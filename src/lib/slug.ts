const MAX_SLUG = 60;
const MIN_SLUG = 3;

export const RESERVED_SLUGS = new Set([
  "about",
  "account",
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "brand",
  "callback",
  "contact",
  "dashboard",
  "edit",
  "favicon",
  "features",
  "forgot-password",
  "how-it-works",
  "internal",
  "login",
  "mail",
  "new",
  "null",
  "onboarding",
  "pricing",
  "privacy",
  "public",
  "qr",
  "r",
  "reset-password",
  "settings",
  "signup",
  "static",
  "terms",
  "undefined",
  "www",
]);

export function slugify(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG);
  return cleaned || "business";
}

export function slugChangeError(value: string): string | null {
  const slug = normalizeSlugInput(value);
  if (!slug || slug.length < MIN_SLUG) return "Use at least 3 letters or numbers.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "Use letters, numbers, and single hyphens.";
  if (RESERVED_SLUGS.has(slug)) return "That name is reserved.";
  return null;
}

export function normalizeSlugInput(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG);
}
