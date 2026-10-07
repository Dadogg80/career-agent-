import type { Requirement } from "./job-requirements";

// Context is a deterministic excerpt of the exact submitted source, never an AI explanation.
export function sourceContext(source: string, requirement: Requirement): string {
  const normalized = source.replace(/\s+/g, " ").trim();
  const quote = requirement.quote.replace(/\s+/g, " ").trim();
  const index = normalized.indexOf(quote);
  if (index < 0) return requirement.quote;
  const start = Math.max(0, index - 180);
  const end = Math.min(normalized.length, index + quote.length + 180);
  return `${start > 0 ? "…" : ""}${normalized.slice(start, end)}${end < normalized.length ? "…" : ""}`;
}
