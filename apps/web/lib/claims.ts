export type ConfirmationBasis = "NONE" | "USER" | "DOCUMENT";
export type ClaimStatus = "UNVERIFIED" | "INFERRED" | "CONFIRMED" | "REJECTED";
export type ClaimContent = { skill: string; statement: string; context: string; sourceNote: string };
export type CompetencyClaim = ClaimContent & { id: string; status: ClaimStatus; revision: number; createdAt: string; updatedAt: string; sourceDocumentId?: string | null; sourceQuote?: string | null; confirmationBasis?:ConfirmationBasis };
export type ClaimRevision = ClaimContent & { revision: number; status: ClaimStatus; action: "MANUAL_ENTRY" | "CONTENT_EDIT" | "USER_CONFIRMATION" | "USER_REJECTION" | "DOCUMENT_IMPORT"; recordedAt: string; recordedBy: "PROFILE_OWNER"; sourceDocumentId?: string | null; sourceQuote?: string | null; confirmationBasis?:ConfirmationBasis };
export type ClaimHistory = { items: ClaimRevision[]; total: number };
export const claimId = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const statuses: ClaimStatus[] = ["UNVERIFIED", "INFERRED", "CONFIRMED", "REJECTED"];
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
export function validClaimContent(value: unknown): value is ClaimContent & Record<string, unknown> {
  if (!record(value)) return false;
  return Object.entries({ skill: 120, statement: 1000, context: 500, sourceNote: 500 }).every(([key, max]) => typeof value[key] === "string" && value[key].trim().length > 0 && value[key].length <= max);
}
function provenance(value: Record<string, unknown>): boolean { return (value.confirmationBasis===undefined || ["NONE","USER","DOCUMENT"].includes(String(value.confirmationBasis))) && (value.sourceDocumentId == null || typeof value.sourceDocumentId === "string" && claimId.test(value.sourceDocumentId)) && (value.sourceQuote == null || typeof value.sourceQuote === "string" && value.sourceQuote.length > 0 && value.sourceQuote.length <= 1000); }
function version(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 1; }
function date(value: unknown): value is string { return typeof value === "string" && value.length <= 40 && Number.isFinite(Date.parse(value)); }
export function isClaim(value: unknown): value is CompetencyClaim {
  return record(value) && validClaimContent(value) && provenance(value) && typeof value.id === "string" && claimId.test(value.id) && statuses.includes(value.status as ClaimStatus) && version(value.revision) && date(value.createdAt) && date(value.updatedAt);
}
export function isClaimList(value: unknown): value is CompetencyClaim[] { return Array.isArray(value) && value.length <= 500 && value.every(isClaim); }
export function isClaimHistory(value: unknown): value is ClaimHistory {
  if (!record(value) || !Array.isArray(value.items) || value.items.length > 20 || typeof value.total !== "number" || !Number.isSafeInteger(value.total) || value.total < value.items.length) return false;
  return value.items.every(item => record(item) && validClaimContent(item) && provenance(item) && version(item.revision) && statuses.includes(item.status as ClaimStatus) && ["MANUAL_ENTRY", "CONTENT_EDIT", "USER_CONFIRMATION", "USER_REJECTION", "DOCUMENT_IMPORT"].includes(String(item.action)) && date(item.recordedAt) && item.recordedBy === "PROFILE_OWNER");
}
export type ClaimEvidence={id:string;documentId:string|null;originalName:string;quote:string;statement:string;context:string;recordedAt:string};
export function isClaimEvidence(value:unknown):value is ClaimEvidence[]{return Array.isArray(value)&&value.length<=100&&value.every(item=>record(item)&&typeof item.id==="string"&&claimId.test(item.id)&&(item.documentId===null||typeof item.documentId==="string"&&claimId.test(item.documentId))&&typeof item.originalName==="string"&&item.originalName.length<=120&&typeof item.quote==="string"&&item.quote.length>0&&item.quote.length<=1000&&typeof item.statement==="string"&&item.statement.length<=1000&&typeof item.context==="string"&&item.context.length<=500&&date(item.recordedAt));}
