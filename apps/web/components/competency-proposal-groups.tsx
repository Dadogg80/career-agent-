"use client";

import { Check, Pencil, X, FileText, Inbox } from "lucide-react";
import { competencyReviewGroups, type IndexedProposal } from "../lib/competency-review";
import { categoryLabels } from "../lib/document-workflow";
import type { CompetencySuggestion } from "../lib/document-analysis";
import type { Locale } from "../lib/translations";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function CompetencyProposalGroups({ proposals, names, locale, language, disabled, pending, onReview, onDecision, onOpenProfile }: {
  proposals: IndexedProposal[]; names: Map<string,string>; locale: Locale; language: Locale;
  disabled: boolean; pending: boolean; onOpenProfile?:()=>void; onReview: (index:number,draft:CompetencySuggestion)=>void;
  onDecision: (index:number,draft:CompetencySuggestion,decision:"confirm"|"draft"|"reject")=>void;
}) {
  const nb=locale==="nb";
  const groups=competencyReviewGroups(proposals);
  if(!groups.length)return <div className="review-queue-empty"><Inbox size={28}/><strong>{pending?(nb?"Ingen forslag venter i dette utvalget":"No proposals waiting in this selection"):(nb?"Ingen opplysninger i dette utvalget":"No statements in this selection")}</strong><p className="hint">{nb?"Bytt visning, kategori eller søk for å se andre opplysninger.":"Change the view, category or search to see other statements."}</p></div>;
  return <div className="review-queue-list" tabIndex={0} aria-label={nb?"Kompetanse til gjennomgang":"Competency review list"}>{groups.map(group=><section key={group.key} className="competency-context-group">
    <div className="review-context-heading"><h4>{group.context}</h4><span>{group.skills.reduce((sum,s)=>sum+s.proposals.length,0)} {nb?"opplysninger":"statements"}</span></div>
    <div className="competency-proposal-grid">{group.skills.map(skill=><div key={skill.key} className="competency-skill-card">
      <div className="review-skill-heading"><h4>{skill.label}</h4><Badge variant="secondary">{categoryLabels[locale][skill.category as keyof typeof categoryLabels.nb]}</Badge>{skill.proposals.length>1 && <small>{skill.proposals.length} {nb?"bidrag":"contributions"}</small>}</div>
      {skill.proposals.map(({draft,index})=><div className="competency-contribution" key={index}>
        <div className="review-contribution-text"><p lang={language}>{draft.statement}</p>
          <details className="review-source"><summary><FileText size={13}/>{nb?"Se kilden":"View evidence"} · {[...new Set([draft.documentId,...(draft.additionalSources??[]).map(s=>s.documentId)])].filter(Boolean).length}</summary>
            {[{documentId:draft.documentId,quote:draft.quote},...(draft.additionalSources??[])].map((source,i)=><div key={i}><small>{names.get(source.documentId??"")}</small><blockquote>{source.quote}</blockquote></div>)}
          </details>
        </div>
        <div className="review-row-actions">{!pending && <Badge variant="secondary">{draft.reviewState==="DOCUMENTED" || !draft.reviewState && draft.profileClaimId?(nb?"Dokumentert":"Documented"):draft.reviewState==="CONFIRMED"?(nb?"Bekreftet av deg":"Confirmed by you"):draft.reviewState==="DRAFT"?(nb?"Utkast":"Draft"):(nb?"Avvist / fjernet":"Rejected / removed")}</Badge>}
          {pending?<><Button size="sm" disabled={disabled} onClick={()=>onDecision(index,draft,"confirm")}><Check size={14}/>{nb?"Godkjenn":"Approve"}</Button>
            <Button variant="outline" size="sm" disabled={disabled} onClick={()=>onReview(index,draft)}><Pencil size={14}/>{nb?"Rediger":"Edit"}</Button>
            <Button variant="ghost" size="sm" disabled={disabled} onClick={()=>onDecision(index,draft,"draft")}>{nb?"Utkast":"Draft"}</Button>
            <Button variant="ghost" size="sm" disabled={disabled} onClick={()=>onDecision(index,draft,"reject")}><X size={14}/>{nb?"Avvis":"Reject"}</Button></>:
            draft.profileClaimId?<Button asChild variant="outline" size="sm"><a onClick={onOpenProfile} href="/career/profile#profile-competencies">{nb?"Åpne i din kompetanse":"Open your competencies"}</a></Button>:<Badge variant="outline">{nb?"Ferdigbehandlet":"Reviewed"}</Badge>}
        </div>
      </div>)}
    </div>)}</div>
  </section>)}</div>;
}
