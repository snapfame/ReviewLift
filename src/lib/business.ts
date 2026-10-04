import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { defaultsForCategory, type DefaultCategory } from "@/lib/business-defaults";
import { randomUUID } from "@/lib/uuid";
import { slugify } from "@/lib/slug";
import type { Database, Tables } from "@/integrations/supabase/types";

export type Business = Tables<"businesses">;
export type ReviewSettings = Tables<"review_settings">;
export type ServiceCategory = Tables<"service_categories">;
export type BusinessService = Tables<"business_services">;
export type MemberRole = Database["public"]["Enums"]["member_role"];

export interface Membership {
  id: string;
  role: MemberRole;
  business: Business;
}

export async function fetchMemberships(userId: string): Promise<Membership[]> {
  const { data, error } = await supabase
    .from("business_members")
    .select("id,role,business:businesses(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => {
      const business = row.business as Business | null;
      if (!business) return null;
      return { id: row.id, role: row.role, business };
    })
    .filter((row): row is Membership => row !== null);
}

export async function allocateSlug(name: string): Promise<string> {
  const base = slugify(name);
  const { data, error } = await supabase.rpc("unique_business_slug", { _base: base });
  if (!error && data) return data;
  const { data: existing } = await supabase.from("businesses").select("slug").eq("slug", base).maybeSingle();
  if (!existing) return base;
  for (let n = 2; n < 50; n += 1) {
    const candidate = `${base}-${n}`;
    const { data: taken } = await supabase.from("businesses").select("slug").eq("slug", candidate).maybeSingle();
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export interface CreateBusinessInput {
  name: string;
  category: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  website_url?: string | null;
  google_review_url?: string | null;
  instagram_url?: string | null;
  logo_url?: string | null;
  accent_color?: string | null;
  ownerId: string;
  seedDefaults?: boolean;
}

export async function createBusinessWithOwner(input: CreateBusinessInput): Promise<Business> {
  const slug = await allocateSlug(input.name);
  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      name: input.name.trim(),
      slug,
      category: input.category,
      phone: input.phone.trim() || null,
      address_line: input.address_line.trim() || null,
      city: input.city.trim() || null,
      state: input.state.trim() || null,
      postal_code: input.postal_code.trim() || null,
      country: input.country.trim() || "India",
      website_url: input.website_url || null,
      google_review_url: input.google_review_url || null,
      instagram_url: input.instagram_url || null,
      logo_url: input.logo_url || null,
      accent_color: input.accent_color || "#1f6feb",
      status: "active",
      onboarding_completed: false,
    })
    .select("*")
    .single();
  if (error || !business) throw new Error(error?.message ?? "Could not create business");

  const { error: memberError } = await supabase.from("business_members").insert({
    business_id: business.id,
    user_id: input.ownerId,
    role: "business_owner",
  });
  if (memberError) throw new Error(memberError.message);

  const { error: settingsError } = await supabase.from("review_settings").insert({
    business_id: business.id,
    customer_headline: "Share your experience",
    customer_subheadline: "Answer a few quick questions and get a review draft you can edit.",
  });
  if (settingsError) throw new Error(settingsError.message);

  const { error: qrError } = await supabase.from("qr_codes").insert({
    business_id: business.id,
    code: `${slug}-primary`,
    destination_slug: slug,
    status: "active",
  });
  if (qrError) throw new Error(qrError.message);

  if (input.seedDefaults !== false) {
    await seedCategoryServices(business.id, defaultsForCategory(input.category));
  }

  return business;
}

export async function seedCategoryServices(businessId: string, categories: DefaultCategory[]) {
  for (let i = 0; i < categories.length; i += 1) {
    const cat = categories[i]!;
    const { data: created, error } = await supabase
      .from("service_categories")
      .insert({
        business_id: businessId,
        name: cat.name,
        sort_order: i + 1,
        active: true,
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Could not create category");
    if (cat.services.length === 0) continue;
    const { error: svcError } = await supabase.from("business_services").insert(
      cat.services.map((service, index) => ({
        business_id: businessId,
        category_id: created.id,
        name: service.name,
        sort_order: index + 1,
        vocabulary: service.vocabulary,
        active: true,
      })),
    );
    if (svcError) throw new Error(svcError.message);
  }
}

export async function uploadBusinessLogo(user: User, businessId: string, file: File): Promise<string> {
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) throw new Error("Logo must be PNG, JPG, WEBP or SVG.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Logo must be smaller than 2 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${user.id}/${businessId}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("business-logos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("business-logos").getPublicUrl(path);
  return data.publicUrl;
}

export async function ensureProfile(user: User, fullName?: string) {
  const { data } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (data) return;
  await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? null,
    full_name: fullName || (user.user_metadata["full_name"] as string | undefined) || "",
  });
}
