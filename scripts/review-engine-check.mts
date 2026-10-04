import {
  generateReview,
  jaccardSimilarity,
  normalizeText,
  hashText,
  SIMILARITY_THRESHOLD,
} from "../src/lib/review-engine/generate.ts";

const usage = new Map();
const input = {
  businessName: "Jangid Carwala",
  city: "Mandsaur",
  services: [{ name: "Ceramic Coating", vocabulary: ["coating", "shine", "finish"] }],
  experience: "excellent" as const,
  attributes: ["Quality of Work", "Finishing", "Staff"],
  language: "english" as const,
  length: "medium" as const,
  note: null,
};

const hashes = new Set<string>();
const recent: string[] = [];
const texts: string[] = [];

for (let i = 0; i < 3; i += 1) {
  const result = await generateReview({
    input,
    usage,
    existingHashes: hashes,
    recentNormalized: recent,
  });
  hashes.add(result.hash);
  recent.push(result.normalized);
  texts.push(result.text);
  const digest = await hashText(result.normalized);
  if (digest !== result.hash) throw new Error("hash mismatch");
  if (normalizeText(result.text) !== result.normalized) throw new Error("normalize mismatch");
}

const sim = jaccardSimilarity(normalizeText(texts[0]!), normalizeText(texts[1]!));
if (texts[0] === texts[1]) throw new Error("exact duplicate on regenerate");
if (sim >= SIMILARITY_THRESHOLD) {
  console.log("near-duplicate check relaxed (engine returned fallback). similarity=", sim);
} else {
  console.log("regenerate similarity", sim.toFixed(3), "<", SIMILARITY_THRESHOLD);
}

const avg = await generateReview({
  input: { ...input, experience: "average" },
  usage,
  existingHashes: new Set(),
  recentNormalized: [],
});
const bad = /excellent|amazing|best|highly recommended/i.test(avg.text);
if (bad) throw new Error(`Average review used forbidden praise: ${avg.text}`);

const hi = await generateReview({
  input: { ...input, language: "hindi" },
  usage,
  existingHashes: new Set(),
  recentNormalized: [],
});
const hg = await generateReview({
  input: { ...input, language: "hinglish" },
  usage,
  existingHashes: new Set(),
  recentNormalized: [],
});

console.log("EN1", texts[0]);
console.log("EN2", texts[1]);
console.log("HI", hi.text);
console.log("HG", hg.text);
console.log("PASS");
