import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generateReview, type GenerationInput } from "./review-engine/generate";
import { randomUUID } from "./uuid";

const langEnum = z.enum(["english", "hinglish", "hindi"]);
const expEnum = z.enum(["excellent", "good", "average", "not_good"]);
const lenEnum = z.enum(["short", "medium", "detailed"]);

async function getDb() {
  if (process.env["SUPABASE_SERVICE_ROLE_KEY"] && process.env["SUPABASE_URL"]) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin;
  }
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

export interface PublicBusinessPayload {
  status: "ok" | "not_found" | "unavailable";
  business?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    city: string | null;
    state: string | null;
    accent_color: string | null;
    google_review_url: string | null;
    instagram_url: string | null;
  };
  settings?: {
    customer_headline: string;
    customer_subheadline: string;
    default_language: "english" | "hinglish" | "hindi";
    allow_english: boolean;
    allow_hindi: boolean;
    allow_hinglish: boolean;
    default_length: "short" | "medium" | "detailed";
    allow_regenerate: boolean;
    show_optional_note: boolean;
    selectable_attributes: string[];
    google_cta_text: string;
  };
  categories?: { id: string; name: string; sort_order: number }[];
  services?: { id: string; name: string; category_id: string | null; sort_order: number }[];
}

export const getPublicBusiness = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<PublicBusinessPayload> => {
    const db = await getDb();
    const { data: business } = await db
      .from("businesses")
      .select(
        "id,name,slug,logo_url,city,state,accent_color,google_review_url,instagram_url,status",
      )
      .eq("slug", data.slug)
      .maybeSingle();

    if (!business) {
      const { data: status } = await db.rpc("public_business_status", { _slug: data.slug });
      if (status === "unavailable") return { status: "unavailable" };
      return { status: "not_found" };
    }
    if (business.status !== "active") return { status: "unavailable" };

    const [{ data: settings }, { data: categories }, { data: services }] = await Promise.all([
      db.from("review_settings").select("*").eq("business_id", business.id).maybeSingle(),
      db
        .from("service_categories")
        .select("id,name,sort_order")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("sort_order"),
      db
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
  });

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        businessId: z.string().uuid(),
        sessionId: z.string().uuid().nullable().optional(),
        eventType: z.string().min(1).max(64),
        metadata: z.record(z.unknown()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const { data: business } = await db
      .from("businesses")
      .select("id,status")
      .eq("id", data.businessId)
      .maybeSingle();
    if (!business || business.status !== "active") return { ok: false };
    await db.from("analytics_events").insert({
      business_id: data.businessId,
      session_id: data.sessionId ?? null,
      event_type: data.eventType,
      metadata: (data.metadata ?? {}) as never,
    });
    return { ok: true };
  });

export const startSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        businessId: z.string().uuid(),
        serviceIds: z.array(z.string().uuid()).min(1).max(30),
        fromQr: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const { data: business } = await db
      .from("businesses")
      .select("id,status")
      .eq("id", data.businessId)
      .maybeSingle();
    if (!business || business.status !== "active") throw new Error("Business unavailable");

    const { data: qr } = await db
      .from("qr_codes")
      .select("id")
      .eq("business_id", data.businessId)
      .limit(1)
      .maybeSingle();

    const token = randomUUID().replace(/-/g, "");
    const { data: session, error } = await db
      .from("review_sessions")
      .insert({
        business_id: data.businessId,
        qr_code_id: data.fromQr ? (qr?.id ?? null) : null,
        session_token: token,
        selected_service_ids: data.serviceIds as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await db.from("analytics_events").insert([
      { business_id: data.businessId, session_id: session.id, event_type: "review_session_started" },
      {
        business_id: data.businessId,
        session_id: session.id,
        event_type: "services_selected",
        metadata: { count: data.serviceIds.length, service_ids: data.serviceIds } as never,
      },
    ]);

    return { sessionId: session.id };
  });

export const generateDraft = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        experience: expEnum,
        attributes: z.array(z.string().max(60)).max(15),
        note: z.string().max(400).nullable().optional(),
        language: langEnum,
        length: lenEnum.optional(),
        regenerate: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await getDb();

    const { data: session } = await db
      .from("review_sessions")
      .select("id,business_id,selected_service_ids")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!session) throw new Error("Session not found");

    const { data: business } = await db
      .from("businesses")
      .select("id,name,city,status")
      .eq("id", session.business_id)
      .maybeSingle();
    if (!business || business.status !== "active") throw new Error("Business unavailable");

    const serviceIds = (session.selected_service_ids as string[]) ?? [];
    const [{ data: services }, { data: settings }] = await Promise.all([
      db.from("business_services").select("id,name,vocabulary").in("id", serviceIds.length ? serviceIds : [""]),
      db.from("review_settings").select("default_length").eq("business_id", business.id).maybeSingle(),
    ]);

    const length = data.length ?? settings?.default_length ?? "medium";

    await db
      .from("review_sessions")
      .update({
        experience_rating: data.experience,
        selected_attributes: data.attributes as never,
        customer_note: data.note ?? null,
        selected_language: data.language,
      })
      .eq("id", session.id);

    // Duplicate / near-duplicate protection scoped to this business.
    const { data: recent } = await db
      .from("review_generations")
      .select("review_hash,normalized_text")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(300);

    const existingHashes = new Set((recent ?? []).map((r) => r.review_hash));
    const recentNormalized = (recent ?? []).map((r) => r.normalized_text);

    const { data: fragmentRows } = await db
      .from("template_fragments")
      .select("id,content,usage_count,last_used_at,fragment_type")
      .eq("language", data.language)
      .or(`business_id.eq.${business.id},business_id.is.null`);

    const usage = new Map<string, { usage_count: number; last_used_at: string | null }>();
    const fragmentIdByContent = new Map<string, string>();
    for (const row of fragmentRows ?? []) {
      usage.set(row.content, { usage_count: row.usage_count, last_used_at: row.last_used_at });
      fragmentIdByContent.set(row.content, row.id);
    }

    const input: GenerationInput = {
      businessName: business.name,
      city: business.city,
      services: (services ?? []).map((s) => ({
        name: s.name,
        vocabulary: Array.isArray(s.vocabulary) ? (s.vocabulary as string[]) : [],
      })),
      experience: data.experience,
      attributes: data.attributes,
      language: data.language,
      length,
      note: data.note ?? null,
    };

    const result = await generateReview({ input, usage, existingHashes, recentNormalized });

    const { count } = await db
      .from("review_generations")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id);

    const { data: generation, error } = await db
      .from("review_generations")
      .insert({
        business_id: business.id,
        session_id: session.id,
        review_text: result.text,
        normalized_text: result.normalized,
        review_hash: result.hash,
        language: data.language,
        review_length: length,
        structure_signature: result.structureSignature,
        generation_number: (count ?? 0) + 1,
      })
      .select("id,generation_number")
      .single();
    if (error) throw new Error(error.message);

    // Anti-repetition bookkeeping.
    for (const fragment of result.fragments) {
      const existingId = fragmentIdByContent.get(fragment.content);
      if (existingId) {
        const stat = usage.get(fragment.content);
        await db
          .from("template_fragments")
          .update({ usage_count: (stat?.usage_count ?? 0) + 1, last_used_at: new Date().toISOString() })
          .eq("id", existingId);
      } else {
        await db.from("template_fragments").insert({
          business_id: null,
          language: data.language,
          fragment_type: fragment.type,
          attribute_key: fragment.attributeKey ?? null,
          content: fragment.content,
          usage_count: 1,
          last_used_at: new Date().toISOString(),
        });
      }
    }

    await db.from("analytics_events").insert({
      business_id: business.id,
      session_id: session.id,
      event_type: data.regenerate ? "review_regenerated" : "review_generated",
      metadata: {
        language: data.language,
        length,
        experience: data.experience,
        attributes: data.attributes,
        structure: result.structureSignature,
      } as never,
    });

    return {
      generationId: generation.id,
      generationNumber: generation.generation_number,
      text: result.text,
    };
  });

export const markGeneration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        generationId: z.string().uuid(),
        action: z.enum(["edited", "copied", "google_clicked", "instagram_clicked", "completed"]),
        text: z.string().max(4000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await getDb();
    const { data: generation } = await db
      .from("review_generations")
      .select("id,business_id,session_id,review_text")
      .eq("id", data.generationId)
      .maybeSingle();
    if (!generation) return { ok: false };

    const patch: {
      review_text?: string;
      edited?: boolean;
      copied_at?: string;
      google_clicked_at?: string;
    } = {};
    if (data.text && data.text.trim() && data.text.trim() !== generation.review_text.trim()) {
      patch.review_text = data.text.trim();
      patch.edited = true;
    }
    if (data.action === "copied") patch.copied_at = new Date().toISOString();
    if (data.action === "google_clicked") patch.google_clicked_at = new Date().toISOString();
    if (data.action === "edited") patch.edited = true;
    if (Object.keys(patch).length > 0) {
      await db.from("review_generations").update(patch).eq("id", generation.id);
    }

    const eventType =
      data.action === "copied"
        ? "review_copied"
        : data.action === "google_clicked"
          ? "google_review_clicked"
          : data.action === "instagram_clicked"
            ? "instagram_clicked"
            : data.action === "edited"
              ? "review_edited"
              : "review_session_completed";

    await db.from("analytics_events").insert({
      business_id: generation.business_id,
      session_id: generation.session_id,
      event_type: eventType,
    });

    if (data.action === "google_clicked" || data.action === "completed") {
      await db
        .from("review_sessions")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", generation.session_id);
    }

    return { ok: true };
  });
