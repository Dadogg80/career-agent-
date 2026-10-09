"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { isClaim, type CompetencyClaim } from "../lib/claims";
import type { Requirement } from "../lib/job-requirements";
import type { Locale } from "../lib/translations";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

export function MatchClarification({question,requirement,requirementIndex,existing,jobId,csrfToken,locale,onSaved}:{question:string;requirement?:Requirement;requirementIndex:number;existing?:CompetencyClaim;jobId:string;csrfToken:string;locale:Locale;onSaved:()=>void}) {
 const nb=locale==="nb",cache=useQueryClient();
 const [skill,setSkill]=useState(existing?.skill??requirement?.label.slice(0,120)??"");
 const [statement,setStatement]=useState(existing?.statement??""),[context,setContext]=useState(existing?.context??"");
 const savedDraft=useRef<CompetencyClaim | null>(null);
 const save=useMutation({retry:false,mutationFn:async()=>{
  async function send(path:string,body:unknown,method="POST"){
   const response=await fetch(path,{method,headers:{"Content-Type":"application/json","X-CSRF-TOKEN":csrfToken},body:JSON.stringify(body)});
   const value=await response.json();if(!response.ok || !isClaim(value))throw new Error(typeof value?.code==="string"?value.code:"CLAIM_UNAVAILABLE");return value;
  }
  const content={skill,statement,context,sourceNote:existing?.sourceNote??`User clarification for job ${jobId}; requirement ${requirementIndex}`};
  const target=savedDraft.current??existing;
  const unchanged=target && skill===target.skill && statement===target.statement && context===target.context;
  const claim=unchanged?target:target?await send(`/api/profile/me/claims/${target.id}`,{...content,revision:target.revision},"PUT"):await send("/api/profile/me/claims",content);
  savedDraft.current=claim;
  return claim.status==="CONFIRMED"?claim:send(`/api/profile/me/claims/${claim.id}/review`,{decision:"CONFIRM",revision:claim.revision});
 },onSuccess:async()=>{await cache.invalidateQueries({queryKey:["private-claims"]});await cache.invalidateQueries({queryKey:["private-job-match",jobId]});onSaved();}});
 if(save.isSuccess)return <p role="status" className="notice"><Check size={16} className="inline"/> {nb?"Lagret som bekreftet kompetanse. Vurder matchen på nytt for å ta med svaret.":"Saved as confirmed competency. Reassess the match to include your answer."}</p>;
 return <div className="match-clarification">{existing && <div className="match-existing-answer"><strong>{nb?"Svaret ditt er lagret og med i grunnlaget":"Your saved answer is included in the evidence"}</strong><p>{existing.statement}</p><small>{existing.context}</small><p className="hint">{nb?"Bekreftet erfaring er ikke det samme som full kravmatch. AI må vurdere om erfaringen dekker kravet; du trenger ikke registrere samme svar igjen.":"Confirmed experience does not automatically establish a full requirement match. AI still assesses its scope; you do not need to register this answer again."}</p></div>}<p className="notice">{question || (nb?"Har du relevant erfaring med dette kravet?":"Do you have relevant experience with this requirement?")}</p><details><summary>{existing?(nb?"Rediger det lagrede svaret":"Edit your saved answer"):(nb?"Avklar og legg til erfaring":"Clarify and add experience")}</summary><div className="match-clarification-fields">
  <label>{nb?"Kompetanse":"Competency"}<Input value={skill} maxLength={120} disabled={save.isPending} onChange={e=>setSkill(e.target.value)}/></label>
  <label>{nb?"Beskriv det du selv gjorde":"Describe what you personally did"}<Textarea aria-label={nb?"Beskriv det du selv gjorde":"Describe what you personally did"} value={statement} maxLength={1000} rows={3} disabled={save.isPending} onChange={e=>setStatement(e.target.value)}/></label>
  <label>{nb?"Firma eller prosjekt":"Company or project"}<Input value={context} maxLength={500} disabled={save.isPending} onChange={e=>setContext(e.target.value)}/></label>
  <p className="hint">{nb?"Når du bekrefter, lagres teksten som din egen erfaring i profilen. Opplysningen sendes ikke til AI før du godkjenner en ny matching.":"Confirming saves this text as your own experience in your profile. It is not sent to AI until you approve another matching analysis."}</p>
  {save.error && <p role="alert">{save.error.message==="AUTH_REQUIRED"?(nb?"Logg inn igjen for å lagre svaret.":"Sign in again to save your answer."):(nb?"Svaret kunne ikke bekreftes nå. Teksten din er beholdt; prøv igjen. Et eventuelt lagret utkast finnes i profilen.":"Your answer could not be confirmed now. Your text is retained; try again. Any saved draft remains in your profile.")}</p>}
  <Button disabled={save.isPending || !skill.trim() || !statement.trim() || !context.trim()} onClick={()=>save.mutate()}><Check size={16}/>{save.isPending?(nb?"Lagrer svaret …":"Saving your answer …"):(nb?"Bekreft og lagre i profilen":"Confirm and save to profile")}</Button>
 </div></details></div>;
}
