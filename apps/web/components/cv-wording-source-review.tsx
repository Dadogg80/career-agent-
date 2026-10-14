"use client";
import { useEffect,useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldQuestion,SearchCheck,FileText,TriangleAlert } from "lucide-react";
import type { TailoringSession } from "../lib/cv-tailoring-session";
import { isWordingSourceResult,wordingSourceDrafts,wordingSourceMatches,type WordingSourceResult } from "../lib/cv-wording-source";
import { useAiChoice } from "../lib/use-ai-configuration";
import { aiRecipients } from "../lib/ai-configuration";
import { retryAfterSeconds,retryWaitLabel } from "../lib/retry-after";
import { AiChoice,AiIdentity,AiActivity } from "./ai-identity";
import { WorkflowNotice } from "./workflow-notice";
import { Card,CardHeader,CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function CvWordingSourceReview({session,locale,current,dirty,csrfToken}:{session:TailoringSession;locale:"nb"|"en";current:boolean;dirty:boolean;csrfToken:string}) {
 const nb=locale==="nb",choice=useAiChoice("tailoring"),drafts=wordingSourceDrafts(session);
 const [consent,setConsent]=useState(false),[reviewed,setReviewed]=useState<{result:WordingSourceResult;snapshot:TailoringSession}|null>(null);
 const result=reviewed?.result;
 const [waits,setWaits]=useState<Record<string,number>>({}),[seconds,setSeconds]=useState(0);
 const approval=choice.approval?.token,recipients=aiRecipients(choice.approval);
 useEffect(()=>setConsent(false),[session.id,session.revision,approval,locale,dirty,current]);
 const until=waits[approval??""]??0;
 useEffect(()=>{const update=()=>setSeconds(Math.max(0,Math.ceil((until-Date.now())/1000)));update();if(until<=Date.now())return;const timer=setInterval(update,1000);return()=>clearInterval(timer);},[until]);
 const review=useMutation({retry:false,gcTime:0,mutationFn:async(input:{snapshot:TailoringSession;token:string;locale:"nb"|"en"})=>{
  const indexes=wordingSourceDrafts(input.snapshot).map(d=>d.paragraphIndex);
  const r=await fetch(`/api/profile/me/jobs/${input.snapshot.jobId}/tailoring/source-review`,{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-TOKEN":csrfToken},body:JSON.stringify({sessionId:input.snapshot.id,revision:input.snapshot.revision,paragraphIndexes:indexes,locale:input.locale,consent:true,aiApproval:input.token})});
  const v:unknown=await r.json();
  if(!r.ok){const code=v&&typeof v==="object"&&"code" in v?String(v.code):"CV_UNAVAILABLE";if(r.status===429&&["AI_RATE_LIMITED","AI_BUSY"].includes(code))setWaits(old=>({...old,[input.token]:Date.now()+(retryAfterSeconds(r.headers.get("retry-after"))??60)*1000}));throw new Error(code);}
  if(!isWordingSourceResult(v)||!wordingSourceMatches(v,input.snapshot,indexes,input.locale)||!choice.options.some(o=>o.approval.token===input.token&&o.approval.selections.some(s=>s.provider===v.provider&&s.model===v.model)))throw new Error("AI_INVALID_RESULT");
  return v;
 },onSuccess:(value,input)=>setReviewed({result:value,snapshot:input.snapshot}),onSettled:()=>setConsent(false)});
 const blocked=!current||dirty||!csrfToken||!approval||!drafts.length||seconds>0;
 const resultCurrent=!!result&&current&&!dirty&&wordingSourceMatches(result,session,drafts.map(d=>d.paragraphIndex),locale);
 const tones={SUPPORTED:"border-emerald-200 bg-emerald-50 text-emerald-900",NEEDS_REVIEW:"border-amber-200 bg-amber-50 text-amber-900",UNSUPPORTED:"border-rose-200 bg-rose-50 text-rose-900",UNASSESSED:"text-muted-foreground"};
 const labels={SUPPORTED:nb?"AI fant støtte":"AI found support",NEEDS_REVIEW:nb?"Omfang må vurderes":"Scope needs review",UNSUPPORTED:nb?"Mulig udokumentert påstand":"Potentially unsupported claim",UNASSESSED:nb?"Ikke vurdert":"Not assessed"};
 return <Card className="cv-wording-source-review"><CardHeader><div className="workspace-heading"><h3><ShieldQuestion size={19}/>{nb?"Kildegjennomgang av tekstforslag":"Source review of wording proposals"}</h3><Badge variant="outline">{nb?"Valgfritt · 1 ekstra AI-kall":"Optional · 1 additional AI call"}</Badge></div><p className="hint">{nb?"Få en egen AI-vurdering av om formuleringene holder seg til dokumentert erfaring og riktig firma. Vurderingen kan ta feil og erstatter ikke din gjennomgang eller sluttkontroll av CV-filen.":"Get a separate AI opinion on whether wording stays within documented experience and the correct employer. It can be wrong and does not replace your review or final CV-file checks."}</p></CardHeader><CardContent className="space-y-4">
  <AiChoice {...choice} locale={locale} area="wording-source-review" label={nb?"Modell for kildegjennomgang":"Source review model"} disabled={review.isPending}/>
  <details className="source-evidence"><summary><FileText size={15}/>{nb?"Se lagret tekst og kilder som sendes":"Inspect saved wording and evidence to be sent"} · {drafts.length}</summary>{drafts.map(d=><div key={d.paragraphIndex} className="my-3 space-y-2 break-words"><h4>{nb?"Tekstforslag":"Wording proposal"} {d.paragraphIndex+1}</h4>{d.entryContext&&<p className="hint whitespace-pre-wrap">{d.entryContext}</p>}<p className="whitespace-pre-wrap">{d.draft}</p><details><summary>{nb?"Original, krav og kildegrunnlag":"Original, criteria and evidence"}</summary><p>{d.original}</p>{d.jobCriteria.map(c=><blockquote key={c.index}>{c.quote}</blockquote>)}{d.confirmedEvidence.map(c=><div key={c.id}><strong>{c.skill} · {c.context}</strong><p>{c.statement}</p></div>)}</details></div>)}</details>
  {blocked&&<p role="status" className="hint">{!current?(nb?"Oppdater CV-grunnlaget og matchen før en ny kildegjennomgang.":"Refresh CV evidence and matching before a new source review."):dirty?(nb?"Lagre tekstutkastene først. Bare lagret ordlyd blir kontrollert.":"Save your wording drafts first. Only saved wording is reviewed."):!drafts.length?(nb?"Ingen aktive tekstforslag å gjennomgå.":"There are no active wording proposals to review."):!approval?(nb?"Velg en tilgjengelig modell før du godkjenner delingen.":"Choose an available model before approving disclosure."):seconds>0?retryWaitLabel(seconds):(nb?"Innloggingen må være tilgjengelig før du kan starte.":"Your signed-in session must be available before starting.")}</p>}
  <label className="consent-row"><input type="checkbox" checked={consent} disabled={blocked||review.isPending} onChange={e=>setConsent(e.target.checked)}/><span>{nb?`Jeg godkjenner at lagret ordlyd, tilhørende kilder og krav sendes til ${recipients} for en egen kildegjennomgang`:`I approve sending saved wording, its evidence and criteria to ${recipients} for a separate source review`}</span></label>
  <Button variant="outline" disabled={blocked||!consent||review.isPending} onClick={()=>{if(approval&&consent&&!blocked)review.mutate({snapshot:session,token:approval,locale});}}><SearchCheck size={17}/>{nb?"Kontroller ordlyd mot kildene":"Review wording against sources"}</Button>
  {review.isPending&&<AiActivity label={nb?"Vurderer formuleringene mot kildene …":"Reviewing wording against sources …"}/>}
  {review.error&&(review.error.message==="CV_CONFLICT"||review.error.message==="CV_SOURCE_CONFLICT"?<p role="status" className="notice">{nb?"Det lagrede arbeidet eller kildegrunnlaget er endret. Last siden på nytt før en ny vurdering. Tekstene er beholdt.":"Saved work or evidence changed. Reload before another review. Your wording is retained."}</p>:<WorkflowNotice code={review.error.message} locale={locale} area="documents" previous={!!result}/>)}
  {result&&<div className="space-y-3" aria-label={nb?"Resultat av kildegjennomgang":"Source review results"}><AiIdentity selections={[result]} locale={locale}/>{!resultCurrent&&<p role="status" className="notice"><TriangleAlert size={16}/>{nb?"Tidligere kildegjennomgang: teksten eller grunnlaget er endret. Funnene gjelder ordlyden som vises nedenfor.":"Earlier source review: wording or evidence changed. Findings apply to the text displayed below."}</p>}{result.items.map(item=><details key={item.paragraphIndex} className="rounded-xl border border-border p-4" open={item.status!=="SUPPORTED"}><summary className="flex flex-wrap items-center gap-2"><span>{nb?"Tekstforslag":"Wording proposal"} {item.paragraphIndex+1}</span><Badge variant="outline" className={tones[item.status]}>{labels[item.status]}</Badge></summary><p className="my-2 text-sm">{item.reason}</p><blockquote className="whitespace-pre-wrap break-words text-sm">{item.text}</blockquote>{item.evidence.map((e,i)=>{const claim=reviewed?.snapshot.snapshot.claims.find(c=>c.id===e.claimId);return <blockquote key={i} className="mt-2 border-l-2 border-border pl-3 text-sm text-muted-foreground"><strong className="block">{claim?.skill} · {claim?.context}</strong>{e.quote}</blockquote>;})}</details>)}<p className="hint">{nb?"Ingen tekst, kompetanse, matchscore eller godkjenning er endret. Funnene vises bare i denne sideøkten. Du bestemmer om teksten skal redigeres, avvises eller godkjennes.":"No wording, competency, match score or approval has changed. Findings are shown only in this page session. You decide whether to edit, reject or approve wording."}</p></div>}
 </CardContent></Card>;
}
