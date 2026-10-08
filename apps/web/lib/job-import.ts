import { isAiSelection, type AiSelection } from "./ai-configuration";
export type ImportedJob = { sourceUrl: string; title: string; text: string; retrievedAt: string; sourceType?: "NAV_API" | "GROQ_BROWSER_EXCERPT"; aiSelection?:AiSelection | null };
export function isImportedJob(v: unknown): v is ImportedJob {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  const nav = typeof x.sourceUrl === "string" && /^https:\/\/arbeidsplassen\.nav\.no\/stillinger\/stilling\/[a-f0-9-]{36}$/.test(x.sourceUrl) && (x.sourceType === undefined || x.sourceType === "NAV_API");
  const finn = typeof x.sourceUrl === "string" && /^https:\/\/www\.finn\.no\/job\/ad\/[1-9][0-9]{5,11}$/.test(x.sourceUrl) && x.sourceType === "GROQ_BROWSER_EXCERPT";
  return (nav || finn) &&
    (x.aiSelection==null || finn && isAiSelection(x.aiSelection) && x.aiSelection.provider==="Groq") &&
    typeof x.title === "string" && x.title.length > 0 && x.title.length <= 300 &&
    typeof x.text === "string" && x.text.trim().length >= 40 && x.text.length <= 15000 &&
    typeof x.retrievedAt === "string" && Number.isFinite(Date.parse(x.retrievedAt));
}
