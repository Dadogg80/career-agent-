export type ImportedJob = { sourceUrl: string; title: string; text: string; retrievedAt: string };
export function isImportedJob(v: unknown): v is ImportedJob {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return typeof x.sourceUrl === "string" && /^https:\/\/arbeidsplassen\.nav\.no\/stillinger\/stilling\/[a-f0-9-]{36}$/.test(x.sourceUrl) &&
    typeof x.title === "string" && x.title.length > 0 && x.title.length <= 300 &&
    typeof x.text === "string" && x.text.trim().length >= 40 && x.text.length <= 15000 &&
    typeof x.retrievedAt === "string" && Number.isFinite(Date.parse(x.retrievedAt));
}
