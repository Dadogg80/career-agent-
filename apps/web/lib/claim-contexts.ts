import { claimId } from "./claims";
import { isEntry, type CareerEntry } from "./career-entries";
export type ClaimCareerContext = { entry: CareerEntry; version: number; state: "CURRENT" | "STALE" | "INACTIVE" | "REMOVED"; basis: "DOCUMENT" | "USER"; sourceDocumentId: string | null; sourceQuote: string | null };
export type ClaimContextOverview = { claimRevision: number; links: ClaimCareerContext[] };
export type ContextCommand = { entryId: string; claimRevision: number; entryRevision: number; version: number; decision: "LINK" | "UNLINK" };
const revision = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
export function isContextOverview(value: unknown): value is ClaimContextOverview {
  if (!value || typeof value !== "object") return false;
  const v = value as ClaimContextOverview;
  return revision(v.claimRevision) && Array.isArray(v.links) && v.links.length <= 50 && v.links.every(link =>
    link && isEntry(link.entry) && revision(link.version) && link.version <= 1000 && ["CURRENT", "STALE", "INACTIVE", "REMOVED"].includes(link.state) &&
    ["DOCUMENT", "USER"].includes(link.basis) && (link.sourceDocumentId === null || typeof link.sourceDocumentId === "string" && claimId.test(link.sourceDocumentId)) &&
    (link.sourceQuote === null || typeof link.sourceQuote === "string" && link.sourceQuote.length >= 1 && link.sourceQuote.length <= 1000) &&
    (link.basis !== "DOCUMENT" || link.sourceQuote !== null)) && new Set(v.links.map(link => link.entry.id)).size === v.links.length;
}
export function validContextCommand(value: unknown): value is ContextCommand {
  if (!value || typeof value !== "object" || Object.keys(value).sort().join(",") !== "claimRevision,decision,entryId,entryRevision,version") return false;
  const v = value as ContextCommand;
  return typeof v.entryId === "string" && claimId.test(v.entryId) && revision(v.claimRevision) && revision(v.entryRevision) &&
    Number.isSafeInteger(v.version) && v.version >= 0 && v.version <= 1000 && ["LINK", "UNLINK"].includes(v.decision);
}
