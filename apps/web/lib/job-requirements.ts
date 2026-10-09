/** Defensive ad payload limit; mirrors JobAnalysisLimits.REQUIREMENTS on the server. */
export const MAX_JOB_REQUIREMENTS = 128;
import { isAiSelection, type AiSelection } from "./ai-configuration";
export type RequirementKind = "REQUIRED" | "PREFERRED" | "UNCLEAR";
export type Requirement = { label: string; kind: RequirementKind; quote: string };

export type JobFact = { kind: "COMPANY" | "ROLE" | "APPLICANT" | "OFFER" | "DEADLINE" | "LOCATION" | "CONTACT" | "OTHER"; label: string; value: string; quote: string };
export function isFact(value: unknown): value is JobFact {
  if (!value || typeof value !== "object") return false;
  const f = value as Record<string, unknown>;
  return typeof f.kind === "string" && ["COMPANY", "ROLE", "APPLICANT", "OFFER", "DEADLINE", "LOCATION", "CONTACT", "OTHER"].includes(f.kind) &&
    typeof f.label === "string" && f.label.trim().length > 0 && f.label.length <= 100 &&
    typeof f.value === "string" && f.value.trim().length > 0 && f.value.length <= 500 &&
    typeof f.quote === "string" && f.quote.trim().length > 0 && f.quote.length <= 1000;
}

export function isExtraction(value: unknown): value is { requirements: Requirement[]; facts: JobFact[]; omittedItems?: number; aiSelection?:AiSelection|null } {
  if (!value || typeof value !== "object" || !("requirements" in value) || !Array.isArray(value.requirements)) return false;
  if ("aiSelection" in value && value.aiSelection!==null && !isAiSelection(value.aiSelection))return false;
  if (!("facts" in value) || !Array.isArray(value.facts) || value.facts.length > 10 || !value.facts.every(isFact)) return false;
  if ("omittedItems" in value && (typeof value.omittedItems !== "number" || !Number.isInteger(value.omittedItems) || value.omittedItems < 0 || value.omittedItems > 2147483647)) return false;
  return value.requirements.length <= MAX_JOB_REQUIREMENTS && value.requirements.every((r: unknown) => {
    if (!r || typeof r !== "object") return false;
    return "label" in r && typeof r.label === "string" && r.label.length > 0 && r.label.length <= 200 &&
      "quote" in r && typeof r.quote === "string" && r.quote.length > 0 && r.quote.length <= 600 &&
      "kind" in r && ["REQUIRED", "PREFERRED", "UNCLEAR"].includes(String(r.kind));
  });
}
