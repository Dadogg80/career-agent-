"use client";

import type { ReactNode } from "react";
import { Layers3, Building2, ChevronDown } from "lucide-react";
import type { CompetencyClaim } from "../lib/claims";
import { groupedStatements, type ClaimGroup } from "../lib/claim-groups";
import type { Locale } from "../lib/translations";
import { Badge } from "./ui/badge";
import { ClaimEvidence } from "./claim-evidence";

export function ClaimGroupCard({ group, locale, actions }: { group: ClaimGroup; locale: Locale; actions: (claim: CompetencyClaim) => ReactNode }) {
  const nb = locale === "nb";
  const status = { UNVERIFIED: nb ? "Ubekreftet" : "Unverified", INFERRED: nb ? "Utledet" : "Inferred", CONFIRMED: nb ? "Bekreftet" : "Confirmed", REJECTED: nb ? "Avvist" : "Rejected" };
  const label = (claim: CompetencyClaim) => claim.confirmationBasis === "DOCUMENT" ? nb ? "Dokumentert" : "Document-backed" : status[claim.status];
  const source = nb ? "Grunnlag / kilde" : "Basis / source";
  const evidence = (claim: CompetencyClaim) => <details className="claim-evidence-details"><summary>{source}</summary><p className="claim-source">{claim.sourceNote}</p>{claim.sourceQuote && <blockquote className="claim-source">{claim.sourceQuote}</blockquote>}<p className="hint">{nb ? "Revisjon" : "Revision"}: {claim.revision}</p><ClaimEvidence id={claim.id} locale={locale}/></details>;
  if (group.claims.length === 1) {
    const claim = group.claims[0];
    return <article className="claim-tile claim-single" aria-label={group.label}><div className="claim-heading"><h3>{group.label}</h3><Badge variant="outline" data-claim-status={claim.status}>{label(claim)}</Badge></div><p className="claim-statement" tabIndex={0} role="region" aria-label={`${nb ? "Forklaring" : "Explanation"}: ${group.label}`}>{claim.statement}</p><p className="hint">{claim.context}</p>{evidence(claim)}{actions(claim)}</article>;
  }
  const ready = group.claims.filter(claim => claim.status === "CONFIRMED");
  const pending = group.claims.filter(claim => ["UNVERIFIED", "INFERRED"].includes(claim.status));
  const rejected = group.claims.filter(claim => claim.status === "REJECTED");
  const contexts = [...new Set(group.claims.filter(claim => claim.status !== "REJECTED").map(claim => claim.context.trim()))];
  const sections = [
    { title: nb ? "Bekreftet grunnlag" : "Confirmed evidence", claims: ready },
    { title: nb ? "Utkast · trenger gjennomgang" : "Drafts · need review", claims: pending },
    ...(ready.length || pending.length ? [] : [{ title: nb ? "Avviste bidrag" : "Rejected contributions", claims: rejected }]),
  ];
  return <article className="claim-tile claim-group" aria-label={group.label}>
    <div className="claim-heading"><h3>{group.label}</h3><span className="claim-group-count"><Layers3 size={14}/>{group.claims.length} {nb ? "bidrag" : "contributions"}</span></div>
    <div className="claim-group-statuses">{ready.length > 0 && <Badge variant="outline" data-group-status="CONFIRMED">{ready.length} {nb ? "bekreftet" : "confirmed"}</Badge>}{pending.length > 0 && <Badge variant="outline" data-group-status="DRAFT">{pending.length} {nb ? "utkast" : "drafts"}</Badge>}{rejected.length > 0 && <span className="hint">{rejected.length} {nb ? "avvist" : "rejected"}</span>}</div>
    <div className="claim-group-summary" role="region" tabIndex={0} aria-label={`${nb ? "Samlet forklaring" : "Combined explanation"}: ${group.label}`}>
      {sections.filter(section => section.claims.length).map(section => <section key={section.title}><h4>{section.title}</h4><ul>{groupedStatements(section.claims).map(row => <li key={row.statement}><p>{row.statement}</p><span>{row.contexts.join(" · ")}</span></li>)}</ul></section>)}
    </div>
    {contexts.length > 0 && <p className="claim-group-contexts"><Building2 size={14}/><span>{contexts.join(" · ")}</span></p>}
    <details className="claim-group-contributions"><summary><span>{nb ? "Se bidrag, kilder og rediger" : "View contributions, sources and edit"}</span><ChevronDown size={16}/></summary><div className="claim-group-contribution-list">
      {group.claims.map(claim => <section key={claim.id} data-contribution-id={claim.id} aria-label={`${group.label}: ${claim.context}`}><div className="claim-heading"><strong>{claim.context}</strong><Badge variant="outline" data-claim-status={claim.status}>{label(claim)}</Badge></div><p className="claim-statement-full">{claim.statement}</p>{evidence(claim)}{actions(claim)}</section>)}
    </div></details>
  </article>;
}
