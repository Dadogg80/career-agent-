"use client";

import { Check } from "lucide-react";
import { competencyReviewGroups, type IndexedProposal } from "../lib/competency-review";
import { categoryLabels } from "../lib/document-workflow";
import type { CompetencySuggestion } from "../lib/document-analysis";
import type { Locale } from "../lib/translations";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function CompetencyProposalGroups({ proposals, names, locale, language, saved, disabled, onReview }: {
  proposals: IndexedProposal[]; names: Map<string,string>; locale: Locale; language: Locale;
  saved: string[]; disabled: boolean; onReview: (index:number,draft:CompetencySuggestion)=>void;
}) {
  const nb=locale==="nb";
  const groups=competencyReviewGroups(proposals);
  function contribution({draft,index}:IndexedProposal) {
    return <div className="competency-contribution" key={index}>
      <p lang={language}>{draft.statement}</p>
      <p className="hint">{[...new Set([draft.documentId,...(draft.additionalSources??[]).map(s=>s.documentId)])].map(id=>names.get(id??"")).filter(Boolean).join(" · ")}</p>
      <Button variant="outline" size="sm" disabled={disabled} onClick={()=>onReview(index,draft)}>{saved.includes(`claim:${index}`) && <Check size={14}/>} {nb?"Se gjennom":"Review"}</Button>
    </div>;
  }
  if(!groups.length)return <p className="hint">{nb?"Ingen forslag samsvarer med søket eller kategorien. Prøv et annet utvalg.":"No proposals match this search or category. Try another selection."}</p>;
  return <>{groups.map(group=><section key={group.key} className="competency-context-group">
    <div className="document-results-heading"><h4>{group.context}</h4><span className="hint">{group.skills.length} {nb?"kompetanseetiketter":"skill labels"}</span></div>
    <div className="competency-proposal-grid">{group.skills.map(skill=><Card key={skill.key} className="competency-skill-card"><CardContent className="pt-5">
      <div className="claim-heading"><h4>{skill.label}</h4><Badge variant="outline">{nb?"AI-forslag":"AI draft"}</Badge></div>
      <p className="hint">{categoryLabels[locale][skill.category as keyof typeof categoryLabels.nb]} · {skill.sourceIds.length} {nb?"dokumenter":"documents"}</p>
      {skill.proposals.length===1?contribution(skill.proposals[0]):<details className="competency-contributions"><summary>{skill.proposals.length} {nb?"ulike bidrag – åpne for å gjennomgå":"distinct contributions – open to review"}</summary>{skill.proposals.map(contribution)}</details>}
    </CardContent></Card>)}</div>
  </section>)}</>;
}
