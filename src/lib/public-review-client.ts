import { supabase } from "@/integrations/supabase/client";
import { generateReview, type GenerationInput } from "@/lib/review-engine/generate";
import { deviceCategory } from "@/lib/device";
import type { PublicBusinessPayload } from "@/lib/public-review.functions";

type Lang = "english" | "hinglish" | "hindi";
type Experience = "excellent" | "good" | "average" | "not_good";
type Length = "short" | "medium" | "detailed";

export async function getPublicBusinessClient(slug: string): Promise<PublicBusinessPayload> {
  const { data: status } = await supabase.rpc("public_business_status", { _slug: slug });
  if (status === "not_found") return { status: "not_found" };
  if (status === "unavailable") return { status: "unavailable" };

  const { data: business } = await supabase
    .from("businesses")
    .select("id,name,slug,logo_url,city,state,accent_color,google_review_url,instagram_url,status")
    .eq("slug", slug)
    .maybeSingle();

  if (!business || business.status !== "active") {
    return { status: status === "unavailable" ? "unavailable" : "not_found" };
  }

  const [{ data: settings }, { data: categories }, { data: services }] = await Promise.all([
    supabase.from("review_settings").select("*").eq("business_id", business.id).maybeSingle(),
    supabase
      .from("service_categories")
      .select("id,name,sort_order")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("business_services")
      .select("id,name,category_id,sort_order")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("sort_order"),
  ]);

  const { status: _status, ...safeBusiness } = business;
  const mappedSettings = settings
    ? {
        customer_headline: settings.customer_headline,
        customer_subheadline: settings.customer_subheadline,
        default_language: settings.default_language,
        allow_english: settings.allow_english,
        allow_hindi: settings.allow_hindi,
        allow_hinglish: settings.allow_hinglish,
        default_length: settings.default_length,
        allow_regenerate: settings.allow_regenerate,
        show_optional_note: settings.show_optional_note,
        selectable_attributes: Array.isArray(settings.selectable_attributes)
          ? (settings.selectable_attributes as string[])
          : [],
        google_cta_text: settings.google_cta_text,
      }
    : null;

  return {
    status: "ok",
    business: safeBusiness,
    ...(mappedSettings ? { settings: mappedSettings } : {}),
    categories: categories ?? [],
    services: services ?? [],
  };
}

export async function trackEventClient(input: {
  businessId: string;
  sessionId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("analytics_events").insert({
    business_id: input.businessId,
    session_id: input.sessionId ?? null,
    event_type: input.eventType,
    metadata: {
      device: deviceCategory(),
      ...(input.metadata ?? {}),
    } as never,
  });
  if (error) console.warn("analytics insert failed", error.message);
}

export async function startSessionClient(input: {
  businessId: string;
  serviceIds: string[];
  fromQr?: boolean;
}): Promise<{ sessionId: string }> {
  const { data, error } = await supabase.rpc("start_review_session", {
    _business_id: input.businessId,
    _service_ids: input.serviceIds as never,
    _from_qr: input.fromQr ?? false,
  });
  if (error || !data) throw new Error(error?.message ?? "Could not start session");
  const sessionId = data as string;
  await trackEventClient({ businessId: input.businessId, sessionId, eventType: "review_session_started" });
  await trackEventClient({
    businessId: input.businessId,
    sessionId,
    eventType: "services_selected",
    metadata: { count: input.serviceIds.length, service_ids: input.serviceIds },
  });
  return { sessionId };
}

export async function generateDraftClient(input: {
  sessionId: string;
  businessId: string;
  businessName: string;
  city?: string | null;
  services: { name: string; vocabulary?: string[] }[];
  experience: Experience;
  attributes: string[];
  note?: string | null;
  language: Lang;
  length: Length;
  regenerate?: boolean;
}): Promise<{ generationId: string; generationNumber: number; text: string }> {
  await supabase.rpc("update_review_session", {
    _session_id: input.sessionId,
    _experience: input.experience,
    _attributes: input.attributes as never,
    _note: input.note ?? null,
    _language: input.language,
  });

  const { data: recent } = await supabase.rpc("recent_review_signatures", {
    _business_id: input.businessId,
    _limit: 300,
  });

  const existingHashes = new Set((recent ?? []).map((row) => row.review_hash));
  const recentNormalized = (recent ?? []).map((row) => row.normalized_text);

  const { data: fragmentRows } = await supabase
    .from("template_fragments")
    .select("content,usage_count,last_used_at")
    .eq("language", input.language)
    .or(`business_id.eq.${input.businessId},business_id.is.null`);

  const usage = new Map<string, { usage_count: number; last_used_at: string | null }>();
  for (const row of fragmentRows ?? []) {
    usage.set(row.content, { usage_count: row.usage_count, last_used_at: row.last_used_at });
  }

  const names = input.services.map((s) => s.name);
  const { data: vocabRows } = await supabase
    .from("business_services")
    .select("name,vocabulary")
    .eq("business_id", input.businessId)
    .in("name", names.length ? names : [""]);
  const vocabByName = new Map(
    (vocabRows ?? []).map((row) => [
      row.name,
      Array.isArray(row.vocabulary) ? (row.vocabulary as string[]) : [],
    ]),
  );

  const generationInput: GenerationInput = {
    businessName: input.businessName,
    city: input.city ?? null,
    services: input.services.map((s) => ({
      name: s.name,
      vocabulary: s.vocabulary?.length ? s.vocabulary : (vocabByName.get(s.name) ?? []),
    })),
    experience: input.experience,
    attributes: input.attributes,
    language: input.language,
    length: input.length,
    note: input.note ?? null,
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await generateReview({
      input: generationInput,
      usage,
      existingHashes,
      recentNormalized,
    });

    const { data: generationId, error } = await supabase.rpc("save_review_generation", {
      _session_id: input.sessionId,
      _review_text: result.text,
      _normalized_text: result.normalized,
      _review_hash: result.hash,
      _language: input.language,
      _review_length: input.length,
      _structure_signature: result.structureSignature,
    });

    if (!error && generationId) {
      for (const fragment of result.fragments) {
        await supabase.rpc("record_fragment_usage", {
          _language: input.language,
          _fragment_type: fragment.type,
          _content: fragment.content,
          _attribute_key: fragment.attributeKey ?? null,
        });
      }
      await trackEventClient({
        businessId: input.businessId,
        sessionId: input.sessionId,
        eventType: input.regenerate ? "review_regenerated" : "review_generated",
        metadata: {
          language: input.language,
          length: input.length,
          experience: input.experience,
          attributes: input.attributes,
          structure: result.structureSignature,
        },
      });
      return {
        generationId: generationId as string,
        generationNumber: existingHashes.size + 1,
        text: result.text,
      };
    }

    if (error?.message?.includes("duplicate_hash")) {
      existingHashes.add(result.hash);
      lastError = new Error(error.message);
      continue;
    }
    lastError = new Error(error?.message ?? "Could not save review");
  }

  throw lastError ?? new Error("Could not generate a unique review");
}

export async function markGenerationClient(input: {
  generationId: string;
  businessId: string;
  sessionId: string;
  action: "edited" | "copied" | "google_clicked" | "instagram_clicked" | "completed";
  text?: string;
}) {
  await supabase.rpc("mark_review_generation", {
    _generation_id: input.generationId,
    _action: input.action,
    _text: input.text ?? null,
  });
  const eventType =
    input.action === "copied"
      ? "review_copied"
      : input.action === "google_clicked"
        ? "google_review_clicked"
        : input.action === "instagram_clicked"
          ? "instagram_clicked"
          : input.action === "edited"
            ? "review_edited"
            : "review_session_completed";
  await trackEventClient({
    businessId: input.businessId,
    sessionId: input.sessionId,
    eventType,
  });
}
