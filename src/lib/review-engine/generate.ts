/**
 * Compositional, zero-cost review generator.
 *
 * Reviews are assembled from fragments (see ./fragments.ts) using one of
 * several sentence structures. No paid AI API is involved; generation cost is
 * literally zero. Duplicate and near-duplicate protection is applied against
 * previously generated reviews for the SAME business.
 */
import {
  LIBRARIES,
  attributeKeyFor,
  type AttributeKey,
  type Lang,
  type Sentiment,
} from "./fragments";

export type ReviewLength = "short" | "medium" | "detailed";

export interface GenerationInput {
  businessName: string;
  city?: string | null;
  services: { name: string; vocabulary?: string[] }[];
  experience: Sentiment;
  attributes: string[];
  note?: string | null;
  language: Lang;
  length: ReviewLength;
}

export interface GenerationCandidate {
  text: string;
  normalized: string;
  hash: string;
  structureSignature: string;
  fragments: { type: string; content: string; attributeKey?: string }[];
}

const STRUCTURES = [
  ["opening", "service", "attribute", "note", "closing"],
  ["opening", "experience", "attribute", "attribute", "closing"],
  ["service", "experience", "attribute", "note", "attribute", "closing"],
  ["opening", "note", "attribute", "experience", "closing"],
  ["opening", "attribute", "closing"],
  ["opening", "experience", "note", "closing"],
  ["service", "attribute", "attribute", "experience", "closing"],
  ["opening", "service", "experience", "attribute", "attribute", "note", "closing"],
] as const;

type Slot = (typeof STRUCTURES)[number][number];

const LENGTH_TARGET: Record<ReviewLength, { min: number; max: number; attrs: number }> = {
  short: { min: 25, max: 55, attrs: 1 },
  medium: { min: 50, max: 95, attrs: 2 },
  detailed: { min: 88, max: 145, attrs: 4 },
};

const TONE_BY_SENTIMENT: Record<Sentiment, "positive" | "neutral" | "negative"> = {
  excellent: "positive",
  good: "positive",
  average: "neutral",
  not_good: "negative",
};

/* ------------------------------------------------------------------ utils */

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'`()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function hashText(normalized: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(" ").filter(Boolean));
  const setB = new Set(b.split(" ").filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  return inter / (setA.size + setB.size - inter);
}

export const SIMILARITY_THRESHOLD = 0.72;

function listToSentence(items: string[]): string {
  if (items.length === 0) return "the service";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

interface UsageStat {
  usage_count: number;
  last_used_at: string | null;
}

/**
 * Weighted pick: favours fragments with a low usage count that were not used
 * recently, with a small random factor so output never becomes deterministic.
 */
function weightedPick(options: string[], usage: Map<string, UsageStat>, exclude: Set<string>): string {
  const pool = options.filter((o) => !exclude.has(o));
  const candidates = pool.length > 0 ? pool : options;
  const now = Date.now();
  let best = candidates[0]!;
  let bestScore = -Infinity;
  for (const option of candidates) {
    const stat = usage.get(option);
    const count = stat?.usage_count ?? 0;
    const lastUsed = stat?.last_used_at ? new Date(stat.last_used_at).getTime() : 0;
    const hoursSince = lastUsed ? Math.min((now - lastUsed) / 3_600_000, 240) : 240;
    const score = 1 / (1 + count) + hoursSince / 480 + Math.random() * 1.1;
    if (score > bestScore) {
      bestScore = score;
      best = option;
    }
  }
  return best;
}

function sanitizeNote(note: string): string {
  const trimmed = note.replace(/\s+/g, " ").trim().slice(0, 240);
  if (!trimmed) return "";
  const withCapital = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?।]$/.test(withCapital) ? withCapital : `${withCapital}.`;
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

function trimToWords(sentences: string[], max: number): string[] {
  const out: string[] = [];
  let count = 0;
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (out.length > 0 && count + words > max) break;
    out.push(sentence);
    count += words;
  }
  return out;
}

/* -------------------------------------------------------------- generation */

export function buildCandidate(
  input: GenerationInput,
  usage: Map<string, UsageStat>,
  structureIndex: number,
  excluded: Set<string>,
): Omit<GenerationCandidate, "hash"> {
  const lib = LIBRARIES[input.language];
  const tone = TONE_BY_SENTIMENT[input.experience];
  const target = LENGTH_TARGET[input.length];
  const structure = STRUCTURES[structureIndex % STRUCTURES.length]!;

  const serviceNames = input.services.map((s) => s.name);
  const primary = input.services[0];
  const vocabList = primary?.vocabulary?.length ? primary.vocabulary : ["work"];
  const vars = {
    business: input.businessName,
    services: listToSentence(
      input.language === "english" ? serviceNames.map((n) => n.toLowerCase()) : serviceNames,
    ),
    service: primary?.name ?? "the service",
    city: input.city ?? "",
    vocab: vocabList[Math.floor(Math.random() * vocabList.length)]!,
  };

  const attrKeys: AttributeKey[] = (input.attributes.length > 0 ? input.attributes : ["Overall Experience"])
    .map(attributeKeyFor)
    .filter((k, i, arr) => arr.indexOf(k) === i);

  const used: { type: string; content: string; attributeKey?: string }[] = [];
  const sentences: string[] = [];
  let attrCursor = 0;
  let attrEmitted = 0;
  let noteEmitted = false;
  const note = input.note ? sanitizeNote(input.note) : "";

  const emit = (type: Slot) => {
    switch (type) {
      case "opening": {
        const t = weightedPick(lib.openings, usage, excluded);
        used.push({ type: "opening", content: t });
        sentences.push(fill(t, vars));
        break;
      }
      case "service": {
        const t = weightedPick(lib.serviceContext, usage, excluded);
        used.push({ type: "service", content: t });
        sentences.push(fill(t, vars));
        break;
      }
      case "experience": {
        const t = weightedPick(lib.experience[input.experience], usage, excluded);
        used.push({ type: "experience", content: t });
        sentences.push(fill(t, vars));
        break;
      }
      case "attribute": {
        if (attrEmitted >= target.attrs) return;
        const key = attrKeys[attrCursor % attrKeys.length]!;
        attrCursor += 1;
        attrEmitted += 1;
        const bank = lib.attributes[tone][key];
        const t = weightedPick(bank, usage, excluded);
        used.push({ type: "attribute", content: t, attributeKey: key });
        sentences.push(fill(t, vars));
        break;
      }
      case "note": {
        if (!note || noteEmitted) return;
        noteEmitted = true;
        const lead = weightedPick(lib.noteLeadIns, usage, excluded);
        used.push({ type: "note_lead", content: lead });
        // The customer's own words are preserved; we never flip their sentiment
        // or invent facts around them.
        sentences.push(`${lead} ${note}`);
        break;
      }
      case "closing": {
        const t = weightedPick(lib.closings[tone], usage, excluded);
        used.push({ type: "closing", content: t });
        sentences.push(fill(t, vars));
        break;
      }
    }
  };

  for (const slot of structure) emit(slot);

  // Top up towards the target length when the structure came out short.
  let guard = 0;
  while (sentences.join(" ").split(/\s+/).length < target.min && guard < 4) {
    guard += 1;
    if (attrEmitted < attrKeys.length + 1 && attrEmitted < target.attrs + 2) {
      const closing = sentences.pop();
      attrEmitted -= 1;
      emit("attribute");
      if (closing) sentences.push(closing);
    } else {
      break;
    }
  }

  const finalSentences = trimToWords(sentences, target.max);
  const text = finalSentences.join(" ").replace(/\s+/g, " ").trim();
  const normalized = normalizeText(text);

  return {
    text,
    normalized,
    structureSignature: `s${structureIndex % STRUCTURES.length}-${input.language}-${input.experience}-${input.length}`,
    fragments: used,
  };
}

export interface GenerateOptions {
  input: GenerationInput;
  usage: Map<string, UsageStat>;
  existingHashes: Set<string>;
  recentNormalized: string[];
  maxAttempts?: number;
}

export interface GenerateResult extends GenerationCandidate {
  attempts: number;
  relaxed: boolean;
}

export async function generateReview(options: GenerateOptions): Promise<GenerateResult> {
  const { input, usage, existingHashes, recentNormalized } = options;
  const maxAttempts = options.maxAttempts ?? 14;
  const startStructure = Math.floor(Math.random() * STRUCTURES.length);
  let fallback: GenerateResult | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const excluded = new Set<string>();
    const candidate = buildCandidate(input, usage, startStructure + attempt, excluded);
    const hash = await hashText(candidate.normalized);
    const result: GenerateResult = { ...candidate, hash, attempts: attempt + 1, relaxed: false };

    if (existingHashes.has(hash)) continue;

    let maxSimilarity = 0;
    for (const previous of recentNormalized) {
      const similarity = jaccardSimilarity(candidate.normalized, previous);
      if (similarity > maxSimilarity) maxSimilarity = similarity;
      if (maxSimilarity >= SIMILARITY_THRESHOLD) break;
    }

    if (maxSimilarity < SIMILARITY_THRESHOLD) return result;
    if (!fallback) fallback = { ...result, relaxed: true };
  }

  // Last resort: return the least-bad candidate, tagged as relaxed. It is still
  // never an exact duplicate because the hash is checked before storing.
  if (fallback && !existingHashes.has(fallback.hash)) return fallback;

  const forced = buildCandidate(input, usage, Math.floor(Math.random() * STRUCTURES.length), new Set());
  const suffix = input.language === "hindi" ? " धन्यवाद।" : " Thanks.";
  const text = `${forced.text}${suffix}`;
  const normalized = normalizeText(text);
  return {
    ...forced,
    text,
    normalized,
    hash: await hashText(normalized),
    attempts: maxAttempts,
    relaxed: true,
  };
}

export const STRUCTURE_COUNT = STRUCTURES.length;
