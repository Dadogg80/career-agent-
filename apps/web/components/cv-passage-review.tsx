"use client";
import { ChevronRight,FileText,Sparkles } from "lucide-react";
import type { CvSection,CvSectionPlan } from "../lib/cv-sections";
import type { TextProposal } from "../lib/cv-tailoring";
import { Badge } from "./ui/badge";

/** Existing source/proposal visibility only; never infer an individual AI assessment from a section plan. */
export function CvPassageReview({section,plan,paragraphs,proposals,locale}:{section:CvSection;plan:CvSectionPlan;paragraphs:string[];proposals:TextProposal[];locale:"nb"|"en"}) {
 const nb=locale==="nb";
 const units=section.paragraphIndexes.filter(i=>paragraphs[i]?.trim()!==section.heading?.trim());
 const count=proposals.filter(p=>units.includes(p.paragraphIndex)).length;
 return <section className="mt-5 rounded-xl border border-analysis-border bg-analysis-surface p-3 sm:p-4" aria-label={nb?"Gjennomgang av avsnitt":"Passage review"}>
  <div className="flex flex-wrap items-center justify-between gap-2"><h5 className="flex items-center gap-2 text-sm font-semibold"><FileText size={16}/>{nb?"Avsnitt og erfaringspunkter":"Paragraphs and contributions"}</h5><Badge variant="outline">{units.length} {nb?"avsnitt":"passages"} · {count} {nb?"tekstforslag":"proposals"}</Badge></div>
  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{nb?"Se hva som har fått et forslag, og hva som fortsatt står som originaltekst. Seksjonsvurderingen er ikke en egen vurdering av hvert avsnitt. Godkjenning gjøres i forslagene nedenfor.":"See which passages have suggestions and which retain the original wording. A section assessment is not an individual assessment of every passage. Approve wording in the suggestions below."}</p>
  <ol className="mt-3 grid list-none gap-2 p-0">{units.map((index,position)=>{
   const original=paragraphs[index]??"",proposal=proposals.find(p=>p.paragraphIndex===index);
   const keep=!proposal&&plan.assessed&&plan.action==="KEEP_UNCHANGED";
   const label=proposal?(nb?"Tekstforslag":"Wording suggestion"):keep?(nb?"Seksjonen foreslås beholdt":"Section recommended unchanged"):(nb?"Ingen eget tekstforslag":"No individual suggestion");
   return <li key={index}><details className="group rounded-lg border border-analysis-border bg-white">
    <summary className="grid cursor-pointer list-none grid-cols-[1rem_minmax(0,1fr)] items-start gap-2 p-3 text-sm"><ChevronRight size={16} className="mt-0.5 shrink-0 transition-transform group-open:rotate-90"/><span className="min-w-0"><span className="block text-xs font-medium text-muted-foreground">{nb?"Avsnitt":"Passage"} {position+1}</span><span className="mt-1 block break-words leading-relaxed">{original.length>150?original.slice(0,150)+"…":original}</span></span><Badge variant="outline" className={"col-start-2 max-w-full justify-self-start whitespace-normal "+(proposal?"border-violet-200 bg-violet-50 text-violet-800":keep?"border-emerald-200 bg-emerald-50 text-emerald-900":"border-amber-200 bg-amber-50 text-amber-900")}>{label}</Badge></summary>
    <div className="grid gap-3 border-t border-analysis-border p-3 text-sm sm:p-4"><div><h6 className="text-xs font-semibold text-muted-foreground">{nb?"Originaltekst":"Original wording"}</h6><p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{original}</p></div>
     {proposal?<><div className="rounded-lg border border-violet-200 bg-violet-50 p-3"><h6 className="flex items-center gap-2 text-xs font-semibold text-violet-800"><Sparkles size={14}/>{nb?"Opprinnelig AI-forslag":"Original AI suggestion"}</h6><p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{proposal.newText}</p></div><p className="leading-relaxed text-muted-foreground">{proposal.reason}</p></>:<p className="leading-relaxed text-muted-foreground">{keep?plan.reason:nb?"Ingen egen begrunnelse eller endring ble levert for dette avsnittet. Det betyr ikke at teksten er ferdig vurdert eller at erfaring mangler.":"No individual reason or change was supplied for this passage. This does not establish completed review or missing experience."}</p>}
    </div>
   </details></li>;
  })}</ol>
 </section>;
}
