"use client";
import { CircleCheck, ArrowRightLeft, GraduationCap } from "lucide-react";
import { matchInsights } from "../lib/match-insights";
import type { PersonalMatch, MatchAssessment } from "../lib/personal-match";
import type { SavedJobContent } from "../lib/saved-jobs";
import type { Locale } from "../lib/translations";
import { HelpTip } from "./ui/help-tip";
import { Badge } from "./ui/badge";

/** Preparation priorities from existing evidence; this is not a CV visibility analysis. */
export function MatchApplicationFocus({result,job,locale,stale}:{result:PersonalMatch;job:SavedJobContent;locale:Locale;stale:boolean}) {
 const nb=locale==="nb",insights=matchInsights(result,job);
 const groups=[
  {key:"strengths",icon:CircleCheck,title:nb?"Fremhev dokumenterte eksempler":"Highlight documented examples",hint:nb?"Knytt konkrete bidrag til det arbeidsgiveren trenger.":"Connect actual contributions to the employer's needs.",items:insights.strengths},
  {key:"transferable",icon:ArrowRightLeft,title:nb?"Forklar overførbar erfaring":"Explain transferable experience",hint:nb?"Vis forbindelsen og vær tydelig på forskjellen. Dette er ikke samme kompetanse.":"Explain the connection and the remaining difference. These are not equivalent capabilities.",items:insights.transferable},
  {key:"formal",icon:GraduationCap,title:nb?"Kontroller kvalifikasjonskrav":"Review qualification requirements",hint:nb?"Relatert erfaring er ikke alene dokumentasjon på en grad eller autorisasjon. Se også eventuelle alternativer i annonsen.":"Related experience alone does not establish a degree or authorization. Check any alternatives offered in the advertisement.",items:insights.formal},
 ];
 if(!groups.some(g=>g.items.length))return null;
 function evidence(item:MatchAssessment){return item.evidence.map(e=>({proof:e,claim:result.claims.find(c=>c.id===e.claimId)}));}
 return <section className="match-application-focus" aria-label={nb?"Prioriteringer fra stillingsmatchen":"Priorities from your job match"}>
  <div className="document-results-heading"><h3>{nb?"Prioriter før du søker":"Prioritize before applying"}</h3><HelpTip label={nb?"Om søknadsprioriteringene":"About application priorities"}>{nb?"Dette bruker den lagrede AI-matchen og dens kildegrunnlag. Det vurderer ikke om erfaringen allerede er synlig i CV-en og bekrefter ingen nye fakta.":"This uses the saved AI assessment and its evidence. It does not assess whether experience is already visible in your CV or confirm new facts."}</HelpTip></div>
  {stale && <p className="notice">{nb?"Dette er den tidligere vurderingen. Oppdater matchen før du bruker prioriteringene.":"This is the earlier assessment. Update the match before using these priorities."}</p>}
  <div className="match-focus-grid">{groups.filter(g=>g.items.length).map(group=><details className="match-focus-group" key={group.key}>
   <summary><group.icon size={18}/><strong>{group.title}</strong><Badge variant="outline">{group.items.length}</Badge></summary><p className="hint">{group.hint}</p>
   <ul>{group.items.map(item=><li key={item.requirementIndex}><h4>{job.requirements[item.requirementIndex].label}</h4><p>{item.reason}</p><blockquote>{job.requirements[item.requirementIndex].quote}</blockquote>{evidence(item).map(({proof,claim},index)=><div className="match-focus-evidence" key={`${proof.claimId}:${index}`}><small>{claim?.skill} · {claim?.context}</small><p>{proof.quote}</p></div>)}</li>)}</ul>
  </details>)}</div>
  <p className="hint">{nb?"AI-vurdert relevans. Kontroller kildene; dette er ikke en sannsynlighet for ansettelse.":"AI-assessed relevance. Review the sources; this is not a hiring probability."}</p>
 </section>;
}
