import type { CompetencyClaim } from "./claims";

const normalize = (value: string) => value.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase();
const aliases: Record<string, string> = { nextjs: "next.js", "next js": "next.js", reactjs: "react", "react.js": "react", nodejs: "node.js", "node js": "node.js" };
export type ClaimGroup = { key: string; label: string; claims: CompetencyClaim[] };

/** Presentation only: preserve claim IDs, review states, contexts and sources. */
export function claimGroups(claims: CompetencyClaim[]): ClaimGroup[] {
  const groups = new Map<string, ClaimGroup>();
  for (const claim of claims) {
    const name = normalize(claim.skill);
    const key = aliases[name] ?? name;
    const group = groups.get(key) ?? { key, label: { "next.js": "Next.js", "node.js": "Node.js", react: "React" }[key] ?? claim.skill.trim(), claims: [] };
    group.claims.push(claim);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function groupedStatements(claims: CompetencyClaim[]): { statement: string; contexts: string[] }[] {
  const statements = new Map<string, { statement: string; contexts: string[] }>();
  for (const claim of claims) {
    const key = normalize(claim.statement);
    const row = statements.get(key) ?? { statement: claim.statement, contexts: [] };
    if (!row.contexts.some(context => normalize(context) === normalize(claim.context))) row.contexts.push(claim.context);
    statements.set(key, row);
  }
  return [...statements.values()];
}
