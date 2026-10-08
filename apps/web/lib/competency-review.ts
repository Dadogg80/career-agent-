import type { CompetencySuggestion } from "./document-analysis";

export type IndexedProposal = { draft: CompetencySuggestion; index: number };
export type CompetencyReviewGroup = { key: string; context: string; skills: { key: string; label: string; category: string; proposals: IndexedProposal[]; sourceIds: string[] }[] };
const normalize = (text: string) => text.normalize("NFC").trim().replace(/\s+/gu," ").toLowerCase();

/** Presentation grouping only: preserve every contribution, context, source and backend index. */
export function competencyReviewGroups(proposals: IndexedProposal[]): CompetencyReviewGroup[] {
  const groups = new Map<string,CompetencyReviewGroup>();
  for (const proposal of proposals) {
    const { draft } = proposal;
    const context = normalize(draft.context);
    const key = [context, ["kontekst ikke oppgitt","context not stated"].includes(context) ? draft.documentId : ""].join("\u0000");
    let group = groups.get(key);
    if (!group) { group={key,context:draft.context,skills:[]}; groups.set(key,group); }
    const category = draft.category ?? "OTHER";
    const skillKey = [normalize(draft.skill),category].join("\u0000");
    let skill = group.skills.find(s=>s.key===skillKey);
    if (!skill) { skill={key:skillKey,label:draft.skill,category,proposals:[],sourceIds:[]}; group.skills.push(skill); }
    skill.proposals.push(proposal);
    for (const id of [draft.documentId,...(draft.additionalSources??[]).map(s=>s.documentId)]) {
      if (id && !skill.sourceIds.includes(id)) skill.sourceIds.push(id);
    }
  }
  return [...groups.values()];
}
