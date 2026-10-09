import type { CareerEntry } from "./career-entries";

const literal = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");

/** Candidate differences, never an assertion that either source is wrong. */
export function careerPeriodDifferences(entries: CareerEntry[]): [CareerEntry, CareerEntry][] {
  const active = entries.filter(entry => entry.status !== "REJECTED");
  const pairs: [CareerEntry, CareerEntry][] = [];
  for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) {
    const left = active[i], right = active[j], a = left.content, b = right.content;
    if (left.id === right.id || a.kind !== b.kind || !literal(a.organization) || !literal(a.title)) continue;
    if (!(["title", "organization", "client", "deliveryRole"] as const).every(field =>
      literal(a[field]) === literal(b[field]))) continue;
    // Missing endpoints are not evidence of a contradiction; separated periods may be rehires.
    if (!a.startMonth || !b.startMonth || (!a.endMonth && !a.ongoing) || (!b.endMonth && !b.ongoing)) continue;
    const aEnd = a.ongoing ? "9999-12" : a.endMonth!;
    const bEnd = b.ongoing ? "9999-12" : b.endMonth!;
    if (aEnd < b.startMonth || bEnd < a.startMonth) continue;
    if (a.startMonth !== b.startMonth || aEnd !== bEnd) pairs.push([left, right]);
  }
  return pairs;
}
