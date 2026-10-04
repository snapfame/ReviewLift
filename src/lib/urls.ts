export function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function reviewPagePath(slug: string, fromQr = false): string {
  return fromQr ? `/r/${slug}?src=qr` : `/r/${slug}`;
}

export function reviewPageUrl(origin: string, slug: string, fromQr = false): string {
  return `${origin.replace(/\/$/, "")}${reviewPagePath(slug, fromQr)}`;
}

export function openSafeUrl(url: string): boolean {
  if (!isSafeHttpUrl(url)) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export function relativeRedirect(value: string | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
