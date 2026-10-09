"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CircleCheck, MessageSquareText, Pencil, ShieldCheck, X, LoaderCircle } from "lucide-react";
import { isClaim, type CompetencyClaim } from "../lib/claims";
import type { Requirement } from "../lib/job-requirements";
import type { Locale } from "../lib/translations";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { HelpTip } from "./ui/help-tip";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";

export function MatchClarification({question,requirement,requirementIndex,existing,jobId,csrfToken,locale,onSaved}:{question:string;requirement?:Requirement;requirementIndex:number;existing?:CompetencyClaim;jobId:string;csrfToken:string;locale:Locale;onSaved:(decision:"CONFIRM"|"REJECT")=>void}) {
 const nb=locale==="nb",cache=useQueryClient();
 const [skill,setSkill]=useState(existing?.skill??requirement?.label.slice(0,120)??"");
 const [statement,setStatement]=useState(existing?.statement??""),[context,setContext]=useState(existing?.context??"");
 const [scope,setScope]=useState<"YES"|"PARTIAL">("YES"),[rejectOpen,setRejectOpen]=useState(false);
 const savedDraft=useRef<CompetencyClaim | null>(null);
 async function send(path:string,body:unknown,method="POST"){
  const response=await fetch(path,{method,headers:{"Content-Type":"application/json","X-CSRF-TOKEN":csrfToken},body:JSON.stringify(body)});
  const value=await response.json();if(!response.ok || !isClaim(value))throw new Error(typeof value?.code==="string"?value.code:"CLAIM_UNAVAILABLE");return value;
 }
 async function refreshed(decision:"CONFIRM"|"REJECT"){
  onSaved(decision);
  await cache.invalidateQueries({queryKey:["private-claims"]});await cache.invalidateQueries({queryKey:["private-job-match",jobId]});
 }
 const save=useMutation({retry:false,mutationFn:async()=>{
  const content={skill,statement,context,sourceNote:existing?.sourceNote??`User clarification for job ${jobId}; requirement ${requirementIndex}`};
  const target=savedDraft.current??existing;
  const unchanged=target && skill===target.skill && statement===target.statement && context===target.context;
  const claim=unchanged?target:target?await send(`/api/profile/me/claims/${target.id}`,{...content,revision:target.revision},"PUT"):await send("/api/profile/me/claims",content);
  savedDraft.current=claim;
  return claim.status==="CONFIRMED"?claim:send(`/api/profile/me/claims/${claim.id}/review`,{decision:"CONFIRM",revision:claim.revision});
 },onSuccess:()=>refreshed("CONFIRM")});
 const reject=useMutation({retry:false,mutationFn:async()=>{
  const target=savedDraft.current??existing;
  if(!target)throw new Error("CLAIM_UNAVAILABLE");
  return send(`/api/profile/me/claims/${target.id}/review`,{decision:"REJECT",revision:target.revision});
 },onSuccess:async()=>{setRejectOpen(false);await refreshed("REJECT");}});
 const busy=save.isPending||reject.isPending,rejected=existing?.status==="REJECTED";
 const errorText=(code:string)=>code==="AUTH_REQUIRED"?(nb?"Logg inn igjen for å lagre svaret.":"Sign in again to save your answer."):code==="CLAIM_CONFLICT"?(nb?"Svaret er endret et annet sted. Last siden på nytt før du bekrefter.":"The answer changed elsewhere. Reload before confirming."):(nb?"Svaret kunne ikke bekreftes nå. Teksten din er beholdt; prøv igjen. Et eventuelt lagret utkast finnes i profilen.":"Your answer could not be confirmed now. Your text is retained; try again. Any saved draft remains in your profile.");
 return <div className="match-clarification" data-state={rejected?"rejected":existing?"saved":"pending"}>
  <div className="clarification-heading"><MessageSquareText size={18}/><strong>{nb?"Din avklaring":"Your clarification"}</strong><HelpTip label={nb?"Om bekreftelse av svaret":"About confirming your answer"}>{nb?"Du bekrefter bare din egen beskrivelse, ikke at hele stillingskravet er oppfylt. Avvisning fjerner dette svaret fra matchgrunnlaget og bevarer historikken. Det fastslår ikke at kompetansen mangler.":"You confirm your own description, not full fulfillment of the criterion. Rejection excludes this answer from matching and retains its history. It does not establish a skill gap."}</HelpTip></div>
  {existing && <div className="match-existing-answer"><div className="clarification-saved-heading">{rejected?<X size={17}/>:<ShieldCheck size={17}/>}<strong>{rejected?(nb?"Svaret er avvist og brukes ikke i matchen":"Your answer is rejected and excluded from matching"):existing.status==="CONFIRMED"?(nb?"Svaret ditt er lagret og med i grunnlaget":"Your saved answer is included in the evidence"):(nb?"Lagret utkast – bekreft før det brukes":"Saved draft — confirm before use")}</strong><Badge variant="outline">{rejected?(nb?"Avvist":"Rejected"):existing.status==="CONFIRMED"?(nb?"Bekreftet":"Confirmed"):(nb?"Utkast":"Draft")}</Badge></div><p>{existing.statement}</p><small>{existing.context}</small><p className="hint">{nb?"Bekreftet erfaring er ikke det samme som full kravmatch. AI vurderer omfanget; du trenger ikke registrere samme svar igjen.":"Confirmed experience does not establish full coverage. AI assesses its scope; you do not need to register this answer again."}</p></div>}
  <p className="clarification-question">{question || (nb?"Har du relevant erfaring med dette kravet?":"Do you have relevant experience with this requirement?")}</p>
  <details><summary><Pencil size={15}/>{existing?(nb?"Rediger det lagrede svaret":"Edit your saved answer"):(nb?"Avklar og legg til erfaring":"Clarify and add experience")}</summary><div className="match-clarification-fields">
   <div className="clarification-scope" role="group" aria-label={nb?"Omfang av erfaringen":"Scope of your experience"}>{(["YES","PARTIAL"] as const).map(option=><Button key={option} size="sm" variant={scope===option?"default":"outline"} aria-pressed={scope===option} disabled={busy} onClick={()=>setScope(option)}>{option==="YES"?<CircleCheck size={16}/>:<MessageSquareText size={16}/>} {option==="YES"?(nb?"Jeg har erfaring":"I have experience"):(nb?"Delvis erfaring":"Some related experience")}</Button>)}</div>
   {scope==="PARTIAL" && <p className="hint">{nb?"Beskriv det du har gjort, og hva du ikke har erfaring med. Valget endrer ikke matchprosenten automatisk.":"Describe what you have done and what you have not experienced. This selection does not automatically change the match percentage."}</p>}
   <label>{nb?"Beskriv det du selv gjorde":"Describe what you personally did"}<Textarea aria-label={nb?"Beskriv det du selv gjorde":"Describe what you personally did"} placeholder={nb?"For eksempel: Jeg utviklet … og hadde ansvar for …":"For example: I developed … and was responsible for …"} value={statement} maxLength={1000} rows={3} disabled={busy} onChange={e=>setStatement(e.target.value)}/><small className="hint">{statement.length}/1000</small></label>
   <label>{nb?"Firma eller prosjekt":"Company or project"}<Input value={context} placeholder={nb?"Hvor gjorde du dette?":"Where did you do this?"} maxLength={500} disabled={busy} onChange={e=>setContext(e.target.value)}/></label>
   <details className="clarification-label"><summary>{nb?"Endre kompetansenavn":"Edit competency label"}</summary><label>{nb?"Kompetanse":"Competency"}<Input value={skill} maxLength={120} disabled={busy} onChange={e=>setSkill(e.target.value)}/></label></details>
   <p className="hint">{nb?"Lagres i profilen som din egen erfaring. Sendes til AI først når du godkjenner en ny match.":"Saved to your profile as your own experience. Sent to AI only when you approve a new match."}</p>
   {save.error && <p role="alert">{errorText(save.error.message)}</p>}
   <Button disabled={busy || !skill.trim() || !statement.trim() || !context.trim()} onClick={()=>save.mutate()}>{save.isPending?<LoaderCircle className="clarification-spinner" size={16}/>:<Check size={16}/>} {save.isPending?(nb?"Lagrer svaret …":"Saving your answer …"):(nb?"Bekreft og lagre i profilen":"Confirm and save to profile")}</Button>
  </div></details>
  {existing && !rejected && <Button className="clarification-reject" variant="ghost" size="sm" disabled={busy} onClick={()=>{reject.reset();setRejectOpen(true);}}><X size={15}/>{nb?"Avvis dette svaret":"Reject this answer"}</Button>}
  <Dialog open={rejectOpen} onOpenChange={open=>{if(!reject.isPending)setRejectOpen(open);}}><DialogContent closeLabel={nb?"Lukk":"Close"}><DialogHeader><DialogTitle>{nb?"Avvise dette svaret?":"Reject this answer?"}</DialogTitle><DialogDescription>{nb?"Svaret tas ut av kompetansegrunnlaget for nye matcher. Historikken beholdes. Du kan redigere og bekrefte samme oppføring senere.":"This answer is excluded from new matches. Its history is retained. You can edit and confirm the same entry later."}</DialogDescription></DialogHeader><blockquote>{(savedDraft.current??existing)?.statement}</blockquote>{reject.error && <p role="alert">{nb?"Avvisningen kunne ikke lagres. Svaret er beholdt; prøv igjen.":"Could not save rejection. The answer is retained; try again."}</p>}<DialogFooter><Button variant="outline" disabled={reject.isPending} onClick={()=>setRejectOpen(false)}>{nb?"Behold svaret":"Keep answer"}</Button><Button variant="destructive" disabled={reject.isPending} onClick={()=>reject.mutate()}>{reject.isPending?<LoaderCircle className="clarification-spinner" size={16}/>:<X size={16}/>} {nb?"Ja, avvis svaret":"Yes, reject answer"}</Button></DialogFooter></DialogContent></Dialog>
 </div>;
}
