"use client";
import { ChevronRight,FileText,Lock,Sparkles } from "lucide-react";
import type { CvSection,CvSectionPlan } from "../lib/cv-sections";
import { cvSourceUnitLabel,type CvPassagePlan,type CvSourceUnit,type TextProposal } from "../lib/cv-tailoring";
import { Badge } from "./ui/badge";
import { HelpTip } from "./ui/help-tip";

/** Show source-bound individual assessments when available; never infer them from a section plan. */
export function CvPassageReview({section,plan,paragraphs,sourceUnits,proposals,passagePlans,locale}:{section:CvSection;plan:CvSectionPlan;paragraphs:string[];sourceUnits?:CvSourceUnit[]|null;proposals:TextProposal[];passagePlans?:CvPassagePlan[]|null;locale:"nb"|"en"}) {
 const nb=locale==="nb";
 const units=section.paragraphIndexes.filter(i=>sourceUnits?sourceUnits[i]?.kind!=="SECTION_HEADING":paragraphs[i]?.trim()!==section.heading?.trim());
 const count=proposals.filter(p=>units.includes(p.paragraphIndex)).length;
 return <section className="mt-5 rounded-xl border border-analysis-border bg-analysis-surface p-3 sm:p-4" aria-label={nb?"Gjennomgang av avsnitt":"Passage review"}>
  <div className="flex flex-wrap items-center justify-between gap-2"><h5 className="flex min-w-0 items-center gap-2 text-sm font-semibold"><FileText size={16} className="shrink-0"/><span>{nb?"Avsnitt og erfaringspunkter":"Paragraphs and contributions"}</span><HelpTip label={nb?"Om avsnittsgjennomgangen":"About passage review"}>{nb?"Hvert avsnitt trenger sin egen vurdering. En seksjonsvurdering alene bekrefter ikke at alle avsnitt er gjennomgått. AI-begrunnelser er ikke din godkjenning, en faktabekreftelse eller sluttkontroll. Låste kildefelt beholdes uendret; du godkjenner tekstendringer i forslagene nedenfor.":"Each passage needs its own assessment. A section assessment alone does not establish review of every passage. AI reasons are not your approval, factual confirmation or final review. Locked source fields remain unchanged; approve wording changes in the proposals below."}</HelpTip></h5><Badge variant="outline">{units.length} {nb?"avsnitt":"passages"} · {count} {nb?"tekstforslag":"proposals"}</Badge></div>
  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{nb?"Åpne en tekstdel for å se originalen, AI-begrunnelsen og eventuelle endringsforslag.":"Open a passage to inspect its original wording, AI reason and any proposed changes."}</p>
  {passagePlans&&<p className="mt-2 text-xs text-muted-foreground">{nb?"Med egen AI-begrunnelse":"With an individual AI reason"}: {units.filter(i=>passagePlans.some(p=>p.paragraphIndex===i&&p.assessed)).length}/{units.length}.</p>}
  <ol className="mt-3 grid list-none gap-2 p-0">{units.map((index,position)=>{
   const original=paragraphs[index]??"",proposal=proposals.find(p=>p.paragraphIndex===index);
   const unit=sourceUnits?.[index],context=unit?.contextIndex!=null?paragraphs[unit.contextIndex]:null;
   const assessment=passagePlans?.find(p=>p.paragraphIndex===index);
   const keep=assessment?assessment.assessed&&assessment.action==="KEEP_UNCHANGED":!proposal&&plan.assessed&&plan.action==="KEEP_UNCHANGED";
   const label=assessment?.action==="NEEDS_REVIEW"?(nb?"Må gjennomgås":"Needs review"):assessment?.action==="KEEP_UNCHANGED"?(nb?"AI anbefaler å beholde":"AI recommends keeping"):proposal?(nb?"Tekstforslag":"Wording suggestion"):keep?(nb?"Seksjonen foreslås beholdt":"Section recommended unchanged"):(nb?"Ingen eget tekstforslag":"No individual suggestion");
   return <li key={index}><details className="group rounded-lg border border-analysis-border bg-white">
    <summary className="grid cursor-pointer list-none grid-cols-[1rem_minmax(0,1fr)] items-start gap-2 p-3 text-sm"><ChevronRight size={16} className="mt-0.5 shrink-0 transition-transform group-open:rotate-90"/><span className="min-w-0"><span className="block text-xs font-medium text-muted-foreground">{unit?cvSourceUnitLabel(unit,nb):nb?"Avsnitt":"Passage"} {position+1}</span><span className="mt-1 block break-words leading-relaxed">{original.length>150?original.slice(0,150)+"…":original}</span></span><span className="col-start-2 flex min-w-0 flex-wrap gap-2"><Badge variant="outline" className={"max-w-full whitespace-normal "+(proposal&&assessment?.action!=="NEEDS_REVIEW"?"border-violet-200 bg-violet-50 text-violet-800":keep?"border-emerald-200 bg-emerald-50 text-emerald-900":"border-amber-200 bg-amber-50 text-amber-900")}>{label}</Badge>{unit&&!unit.editable&&<Badge variant="outline" className="max-w-full gap-1 whitespace-normal border-slate-200 bg-slate-50 text-slate-700"><Lock size={12}/>{nb?"Bevares uendret":"Read-only original"}</Badge>}</span></summary>
    <div className="grid gap-3 border-t border-analysis-border p-3 text-sm sm:p-4"><div><h6 className="text-xs font-semibold text-muted-foreground">{nb?"Originaltekst":"Original wording"}</h6><p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{original}</p></div>
     {context&&<div className="rounded-lg border border-analysis-border bg-analysis-surface p-3"><h6 className="text-xs font-semibold text-muted-foreground">{nb?"Tilhører denne oppføringen":"Context from this entry"}</h6><p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{context}</p></div>}
     {proposal?<><div className="rounded-lg border border-violet-200 bg-violet-50 p-3"><h6 className="flex items-center gap-2 text-xs font-semibold text-violet-800"><Sparkles size={14}/>{nb?"Opprinnelig AI-forslag":"Original AI suggestion"}</h6><p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{proposal.newText}</p></div><p className="leading-relaxed text-muted-foreground">{assessment?.reason??proposal.reason}</p></>:<p className="leading-relaxed text-muted-foreground">{assessment?assessment.reason:keep?plan.reason:nb?"Ingen egen begrunnelse eller endring ble levert for dette avsnittet. Det betyr ikke at teksten er ferdig vurdert eller at erfaring mangler.":"No individual reason or change was supplied for this passage. This does not establish completed review or missing experience."}</p>}
    </div>
   </details></li>;
  })}</ol>
 </section>;
}
