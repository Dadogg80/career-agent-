import { isAiSelection, type AiSelection } from "./ai-configuration";
import { claimId } from "./claims";
export type CareerDocument = { id: string; originalName: string; mediaType: string; byteSize: number; sha256: string; language: "nb" | "en"; isMaster: boolean; createdAt: string; textCharacters?: number; extractionMethod?: "TEXT" | "OCR"; analysis?: DocumentAnalysisMetadata | null };
export type DocumentAnalysisMetadata = { status:"COMPLETED" | "PARTIAL"; createdAt:string; collection:boolean; competencies:number; careerEntries:number; profileSections:number; inputCharacters:number; sourceCharacters:number; selections:AiSelection[] };
function isAnalysis(value:unknown): value is DocumentAnalysisMetadata {
  if (!value || typeof value!=="object") return false;
  const a=value as DocumentAnalysisMetadata;
  return ["COMPLETED","PARTIAL"].includes(a.status) && typeof a.createdAt==="string" && Number.isFinite(Date.parse(a.createdAt)) && typeof a.collection==="boolean" && [a.competencies,a.careerEntries,a.profileSections,a.inputCharacters,a.sourceCharacters].every(n=>Number.isSafeInteger(n) && n>=0 && n<=1200000) && Array.isArray(a.selections) && a.selections.length<=20 && a.selections.every(isAiSelection);
}
export type DocumentDetail = { document: CareerDocument; text: string };
export function isDocument(value: unknown): value is CareerDocument {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  return typeof d.id === "string" && claimId.test(d.id) && typeof d.originalName === "string" && d.originalName.length > 0 && d.originalName.length <= 120 && typeof d.mediaType === "string" && ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/markdown"].includes(d.mediaType) && typeof d.byteSize === "number" && Number.isSafeInteger(d.byteSize) && d.byteSize > 0 && d.byteSize <= 5242880 && typeof d.sha256 === "string" && /^[a-f0-9]{64}$/.test(d.sha256) && ["nb", "en"].includes(String(d.language)) && typeof d.isMaster === "boolean" && typeof d.createdAt === "string" && Number.isFinite(Date.parse(d.createdAt)) && (d.textCharacters === undefined || typeof d.textCharacters === "number" && Number.isInteger(d.textCharacters) && d.textCharacters >= 0 && d.textCharacters <= 60000) && (d.analysis === undefined || d.analysis === null || isAnalysis(d.analysis)) && (d.extractionMethod === undefined || ["TEXT", "OCR"].includes(String(d.extractionMethod)));
}
export function isDocumentList(value: unknown): value is CareerDocument[] { return Array.isArray(value) && value.length <= 20 && value.every(isDocument); }
export function isDocumentDetail(value: unknown): value is DocumentDetail { return !!value && typeof value === "object" && "document" in value && "text" in value && isDocument(value.document) && typeof value.text === "string" && value.text.length <= 60000; }
