"use client";

import type { ReactNode } from "react";
import { Layers3, Building2, ChevronDown, ShieldCheck, FileCheck2, Clock3, XCircle } from "lucide-react";
import type { CompetencyClaim } from "../lib/claims";
import { groupedStatements, type ClaimGroup } from "../lib/claim-groups";
import type { Locale } from "../lib/translations";
import { Badge } from "./ui/badge";
import { ClaimEvidence } from "./claim-evidence";

export function ClaimGroupCard({ group, locale, actions, careerLinks }: { group: ClaimGroup; locale: Locale; actions: (claim: CompetencyClaim) => ReactNode; careerLinks?: (claim: CompetencyClaim) => ReactNode }) {
  const nb = locale === "nb";
  const status = { UNVERIFIED: nb ? "Ubekreftet" : "Unverified", INFERRED: nb ? "Utledet" : "Inferred", CONFIRMED: nb ? "Bekreftet" : "Confirmed", REJECTED: nb ? "Avvist" : "Rejected" };
  const label = (claim: CompetencyClaim) => claim.confirmationBasis === "DOCUMENT" ? nb ? "Dokumentert" : "Document-backed" : claim.status === "CONFIRMED" && claim.confirmationBasis === "USER" ? nb ? "Bekreftet av deg" : "Confirmed by you" : status[claim.status];
  const source = nb ? "Grunnlag / kilde" : "Basis / source";
  const evidence = (claim: CompetencyClaim) => <details className="claim-evidence-details"><summary>{source}</summary><p className="claim-source">{claim.sourceNote}</p>{claim.sourceQuote && <blockquote className="claim-source">{claim.sourceQuote}</blockquote>}<p className="hint">{nb ? "Revisjon" : "Revision"}: {claim.revision}</p><ClaimEvidence id={claim.id} locale={locale}/></details>;
  if (group.claims.length === 1) {
    const claim = group.claims[0];
    const StatusIcon = claim.confirmationBasis === "DOCUMENT" ? FileCheck2 : claim.status === "CONFIRMED" ? ShieldCheck : claim.status === "REJECTED" ? XCircle : Clock3;
    return <article className="claim-tile claim-single" aria-label={group.label} data-claim-status={claim.status}><div className="claim-heading"><span className="claim-skill-icon"><Layers3 size={17}/></span><h3>{group.label}</h3><Badge variant="outline" data-claim-status={claim.status}><StatusIcon size={12}/>{label(claim)}</Badge></div><p className="claim-statement" tabIndex={0} role="region" aria-label={`${nb ? "Forklaring" : "Explanation"}: ${group.label}`}>{claim.statement}</p><p className="hint">{claim.context}</p>{evidence(claim)}{careerLinks?.(claim)}{actions(claim)}</article>;
  }
  const documented = group.claims.filter(claim => claim.status === "CONFIRMED" && claim.confirmationBasis === "DOCUMENT");
  const userConfirmed = group.claims.filter(claim => claim.status === "CONFIRMED" && claim.confirmationBasis === "USER");
  const otherConfirmed = group.claims.filter(claim => claim.status === "CONFIRMED" && !["DOCUMENT","USER"].includes(claim.confirmationBasis ?? ""));
  const pending = group.claims.filter(claim => ["UNVERIFIED", "INFERRED"].includes(claim.status));
  const rejected = group.claims.filter(claim => claim.status === "REJECTED");
  const contexts = [...new Set(group.claims.filter(claim => claim.status !== "REJECTED").map(claim => claim.context.trim()))];
  const sections = [
    { title: nb ? "Dokumentert i kilden" : "Document-backed", claims: documented },
    { title: nb ? "Bekreftet av deg" : "Confirmed by you", claims: userConfirmed },
    { title: nb ? "Bekreftet · grunnlag ikke registrert" : "Confirmed · basis not recorded", claims: otherConfirmed },
    { title: nb ? "Utkast · trenger gjennomgang" : "Drafts · need review", claims: pending },
    ...(documented.length || userConfirmed.length || otherConfirmed.length || pending.length ? [] : [{ title: nb ? "Avviste bidrag" : "Rejected contributions", claims: rejected }]),
  ];
  const contextSummary = contexts.slice(0,3);
  return <article className="claim-tile claim-group" aria-label={group.label}>
    <div className="claim-heading claim-group-heading"><span className="claim-skill-icon"><Layers3 size={17}/></span><div className="claim-group-title"><h3>{group.label}</h3><span className="claim-group-count">{group.claims.length} {nb ? "bidrag" : "contributions"}</span></div></div>
    <div className="claim-group-statuses">{documented.length > 0 && <Badge variant="outline" data-group-status="DOCUMENTED"><FileCheck2 size={12}/>{documented.length} {nb ? "dokumentert" : "documented"}</Badge>}{userConfirmed.length > 0 && <Badge variant="outline" data-group-status="CONFIRMED"><ShieldCheck size={12}/>{userConfirmed.length} {nb ? "bekreftet av deg" : "confirmed by you"}</Badge>}{otherConfirmed.length > 0 && <Badge variant="outline" data-group-status="UNATTRIBUTED">{otherConfirmed.length} {nb ? "bekreftet" : "confirmed"}</Badge>}{pending.length > 0 && <Badge variant="outline" data-group-status="DRAFT"><Clock3 size={12}/>{pending.length} {nb ? "utkast" : "drafts"}</Badge>}{rejected.length > 0 && <span className="claim-group-rejected"><XCircle size={12}/>{rejected.length} {nb ? "avvist" : "rejected"}</span>}</div>
    <div className="claim-group-summary" role="region" tabIndex={0} aria-label={`${nb ? "Samlet forklaring" : "Combined explanation"}: ${group.label}`}>
      {sections.filter(section => section.claims.length).map((section,index) => <section key={section.title} data-section={index}><h4>{section.title}<span aria-hidden="true">{section.claims.length}</span></h4><ul>{groupedStatements(section.claims).map(row => <li key={row.statement}><p>{row.statement}</p><span>{row.contexts.join(" · ")}</span></li>)}</ul></section>)}
    </div>
    {contexts.length > 0 && <div className="claim-group-contexts"><Building2 size={14}/><div>{contextSummary.map(context=><span key={context}>{context}</span>)}{contexts.length>contextSummary.length&&<span>+{contexts.length-contextSummary.length} {nb?"flere":"more"}</span>}</div></div>}
    <details className="claim-group-contributions"><summary><span>{nb ? "Gjennomgå enkeltbidrag" : "Review individual contributions"}<small>{group.claims.length} {nb ? "kilder og statuser beholdes separat" : "separate sources and statuses"}</small></span><span className="claim-group-open"><ChevronDown size={16}/></span></summary><div className="claim-group-contribution-list">
      {group.claims.map((claim,index) => <section key={claim.id} data-contribution-id={claim.id} aria-label={`${group.label}: ${claim.context}`}><div className="claim-contribution-header"><span className="claim-contribution-index">{String(index+1).padStart(2,"0")}</span><strong>{claim.context}</strong><Badge variant="outline" data-claim-status={claim.status}>{label(claim)}</Badge></div><p className="claim-statement-full">{claim.statement}</p>{evidence(claim)}{careerLinks?.(claim)}{actions(claim)}</section>)}
    </div></details>
  </article>;
}
