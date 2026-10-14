"use client";
import { BookOpen,Check,FileQuestion,LayoutList } from "lucide-react";
import { cvSectionLabel } from "../lib/cv-sections";
import { tailoringPassages,type TailoringResult } from "../lib/cv-tailoring";
import type { MatchClaim } from "../lib/personal-match";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card,CardHeader,CardContent } from "./ui/card";
import { CvPassageReview } from "./cv-passage-review";
import { HelpTip } from "./ui/help-tip";

export function CvSectionReview({result,text,claims,quotes,locale,selected,onSelect}:{result:TailoringResult;text:string;claims:MatchClaim[];quotes:string[];locale:"nb"|"en";selected:string|null;onSelect:(id:string|null)=>void}) {
 const nb=locale==="nb",sections=result.sections,plans=result.sectionPlans;
 if(!sections||!plans)return <p className="hint">{nb?"Denne lagrede analysen har ingen seksjonsplan. Forslagene kan fortsatt gjennomgås; en ny analyse kan lage planen.":"This saved analysis has no section plan. Its proposals remain reviewable; a new analysis can create a plan."}</p>;
 const section=sections.find(s=>s.id===selected),plan=plans.find(p=>p.sectionId===selected),paragraphs=tailoringPassages(text,result.sourceUnits);
 const sectionText=section?(result.sourceUnits?text.slice(result.sourceUnits[section.paragraphIndexes[0]].start,result.sourceUnits[section.paragraphIndexes[section.paragraphIndexes.length-1]].end):section.paragraphIndexes.map(i=>paragraphs[i]).join("\n\n")):"";
 const unresolved=plans.filter(p=>p.action==="NEEDS_REVIEW").length;
 const action=(value:string)=>value==="KEEP_UNCHANGED"?nb?"Behold teksten":"Keep wording":value==="PROPOSE_CHANGES"?nb?"Endringer foreslått":"Changes proposed":nb?"Må gjennomgås":"Needs review";
 return <Card className="cv-section-review"><CardHeader><div className="workspace-heading"><h3><LayoutList size={18}/>{nb?"Plan for CV-en":"Your CV plan"}<HelpTip label={nb?"Om seksjonsplanen":"About the section plan"}>{nb?"Seksjoner følger tydelige overskrifter i den leste teksten. Uklare eller blandede tekstområder er merket. AI-vurdering er ikke brukergodkjenning, faktabekreftelse eller sluttkontroll.":"Sections follow explicit headings in extracted text. Unclear or mixed passages are labelled. AI assessment is not user approval, factual confirmation or final review."}</HelpTip></h3><Badge variant="outline">{sections.length} {nb?(sections.length===1?"seksjon":"seksjoner"):(sections.length===1?"section":"sections")}</Badge></div><p className="hint">{nb?"Velg en seksjon for å se prioritering, kildegrunnlag og tekstforslag.":"Choose a section to inspect its priority, sources and wording proposals."}</p></CardHeader><CardContent>
 <div className="cv-section-navigation" role="group" aria-label={nb?"Velg CV-seksjon":"Choose CV section"}>
 <Button variant={selected===null?"default":"outline"} size="sm" aria-pressed={selected===null} onClick={()=>onSelect(null)}>{nb?"Alle forslag":"All proposals"}</Button>
 {sections.map(s=><Button key={s.id} variant={selected===s.id?"default":"outline"} size="sm" aria-pressed={selected===s.id} onClick={()=>onSelect(s.id)}>{plans.find(p=>p.sectionId===s.id)?.action==="KEEP_UNCHANGED"?<Check size={14}/>:<BookOpen size={14}/>}<span>{cvSectionLabel(s,nb)}</span><Badge variant="outline">{result.proposals.filter(p=>s.paragraphIndexes.includes(p.paragraphIndex)).length}</Badge></Button>)}
 </div>
 {unresolved>0&&<p role="status" className="hint"><FileQuestion size={14}/> {unresolved} {nb?(unresolved===1?"seksjon trenger gjennomgang. Det betyr ikke at kompetanse mangler.":"seksjoner trenger gjennomgang. Det betyr ikke at kompetanse mangler."):(unresolved===1?"section needs review. This does not establish missing competence.":"sections need review. This does not establish missing competence.")}</p>}
 {section&&plan&&<div className="cv-section-detail"><div className="workspace-heading"><h4>{cvSectionLabel(section,nb)}</h4><Badge variant="outline">{action(plan.action)}</Badge></div>
 {plan.assessed&&<p className="hint">{nb?"AI-prioritet":"AI priority"}: {({HIGH:nb?"Høy":"High",MEDIUM:nb?"Middels":"Medium",LOW:nb?"Lav":"Low"})[plan.priority]}</p>}
 {plan.reviewedParagraphIndexes!=null&&<p className="hint">{nb?"AI oppgir gjennomgang av":"AI declares review of"} {plan.reviewedParagraphIndexes.length}/{section.paragraphIndexes.length} {nb?"tekstpassasjer. Dette er ikke en garanti for kvalitet eller fullstendighet.":"text passages. This does not guarantee quality or completeness."}</p>}
 {plan.assessed&&plan.reviewedParagraphIndexes==null&&<p className="hint">{nb?"Avsnittsdekning ble ikke registrert i denne eldre vurderingen.":"Paragraph coverage was not recorded in this older assessment."}</p>}
 <p>{plan.reason}</p>{section.kind==="UNCLASSIFIED"&&<p className="hint">{nb?"Teksten har ingen entydig seksjonsstruktur. Originalen er bevart.":"The text has no unambiguous section structure. Original wording is retained."}</p>}
 <CvPassageReview section={section} plan={plan} paragraphs={paragraphs} sourceUnits={result.sourceUnits} proposals={result.proposals} passagePlans={result.passagePlans} locale={locale}/>
 <details className="source-evidence"><summary>{nb?"Se originaltekst og grunnlag":"Inspect original text and evidence"}</summary><pre tabIndex={0}>{sectionText}</pre>{plan.requirementIndexes.map(i=><blockquote key={i}>{quotes[i]}</blockquote>)}{plan.claimIds.map(id=>{const claim=claims.find(c=>c.id===id);return <p key={id}><strong>{claim?.skill}</strong> · {claim?.statement} · {claim?.context}</p>;})}</details>
 </div>}
 </CardContent></Card>;
}
