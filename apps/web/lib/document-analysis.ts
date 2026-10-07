import { claimId } from "./claims";
export type CompetencySuggestion = { skill: string; statement: string; context: string; quote: string; documentId?: string | null };
export type DocumentAnalysis = { id: string; locale: "nb" | "en"; provider: "Groq"; summary: { text: string; quote: string; documentId?: string | null }[]; suggestions: CompetencySuggestion[]; inputCharacters: number; sourceCharacters: number; partial: boolean; omittedItems: number; createdAt: string; documents: { documentId:string; originalName:string; inputCharacters:number; sourceCharacters:number }[] };
export function isDocumentAnalysis(value: unknown): value is DocumentAnalysis {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  const text = (value: unknown, max: number) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
  const count = (value: unknown, min: number, max: number) => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
  return typeof d.id === "string" && claimId.test(d.id) && ["nb", "en"].includes(String(d.locale)) && d.provider === "Groq"
    && typeof d.createdAt === "string" && Number.isFinite(Date.parse(d.createdAt)) && typeof d.partial === "boolean"
    && count(d.inputCharacters, 40, 12000) && count(d.sourceCharacters, 1, 1200000) && count(d.omittedItems, 0, 13)
    && Array.isArray(d.documents) && d.documents.length <= 20 && d.documents.every(item => item && typeof item.documentId === "string" && claimId.test(item.documentId) && text(item.originalName,120) && count(item.inputCharacters,1,12000) && count(item.sourceCharacters,1,60000))
    && Array.isArray(d.summary) && d.summary.length <= 3 && d.summary.every(item => item && text(item.text, 500) && text(item.quote, 600))
    && Array.isArray(d.suggestions) && d.suggestions.length <= 10 && d.suggestions.every(item => item && text(item.skill, 120) && text(item.statement, 1000) && text(item.context, 500) && text(item.quote, 600))
    && [...d.summary, ...d.suggestions].every(item => d.documents instanceof Array && (d.documents.length ? d.documents.some(source => source.documentId === item.documentId) : item.documentId == null));
}
