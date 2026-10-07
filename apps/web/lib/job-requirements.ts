export type RequirementKind = "REQUIRED" | "PREFERRED" | "UNCLEAR";
export type Requirement = { label: string; kind: RequirementKind; quote: string };

export function isExtraction(value: unknown): value is { requirements: Requirement[] } {
  if (!value || typeof value !== "object" || !("requirements" in value) || !Array.isArray(value.requirements)) return false;
  return value.requirements.length <= 12 && value.requirements.every((r: unknown) => {
    if (!r || typeof r !== "object") return false;
    return "label" in r && typeof r.label === "string" && r.label.length > 0 && r.label.length <= 200 &&
      "quote" in r && typeof r.quote === "string" && r.quote.length > 0 && r.quote.length <= 600 &&
      "kind" in r && ["REQUIRED", "PREFERRED", "UNCLEAR"].includes(String(r.kind));
  });
}
