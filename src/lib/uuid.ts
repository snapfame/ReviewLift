/**
 * RFC 4122 UUID v4.
 * Uses Web Crypto (`randomUUID`, then `getRandomValues`) so the same helper
 * works in the browser, Vite, and Cloudflare Workers. Node's `crypto` module
 * is never imported.
 */
export function randomUUID(): string {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  if (typeof webCrypto?.getRandomValues !== "function") {
    throw new Error("Secure random UUID generation is unavailable in this environment.");
  }

  const bytes = new Uint8Array(16);
  webCrypto.getRandomValues(bytes);
  // version 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // variant 10xx
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
