"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, BookOpenCheck, BriefcaseBusiness, ChevronDown, FileText, GraduationCap, Heart, Lightbulb, Pencil, Save, ShieldAlert, Sparkles, UserRound, X } from "lucide-react";
import { isDocumentRun, profileLabels } from "../lib/document-workflow";
import type { Locale } from "../lib/translations";
import { Card, CardHeader, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { AiIdentity } from "./ai-identity";

/** Read the newest owned saved synthesis; rendering never starts a new AI call. */
export function CandidatePresentation({locale,csrfToken,onAuthRequired,onReviewDocuments}:{locale:Locale;csrfToken:string;onAuthRequired:()=>void;onReviewDocuments:()=>void}) {
 const nb=locale==="nb";const cache=useQueryClient();
 const saved=useQuery({queryKey:["private-document-profile"],gcTime:0,retry:false,refetchOnReconnect:false,queryFn:async()=>{
  const response=await fetch("/api/profile/me/documents/workflow?scope=profile",{cache:"no-store"});
  const value:unknown=await response.json();if(!response.ok || value!==null && !isDocumentRun(value))throw new Error("DOCUMENT_UNAVAILABLE");return value;
 }});
 const write=useMutation({retry:false,mutationFn:async({runId,revision,index,text}:{runId:string;revision:number;index:number;text:string})=>{
  const response=await fetch(`/api/profile/me/documents/workflow/${runId}/summary`,{method:"PUT",cache:"no-store",headers:{"Content-Type":"application/json","X-CSRF-TOKEN":csrfToken},body:JSON.stringify({revision,index,text})});
  if(response.status===401)onAuthRequired();const value:unknown=await response.json();
  if(!response.ok)throw new Error(value&&typeof value==="object"&&"code" in value&&typeof value.code==="string"?value.code:"DOCUMENT_UNAVAILABLE");
  if(!isDocumentRun(value))throw new Error("DOCUMENT_UNAVAILABLE");return value;
 },onSuccess:async run=>{cache.setQueryData(["private-document-profile"],run);cache.setQueryData(["private-document-workflow",run.scope],run);await cache.invalidateQueries({queryKey:["private-document-profile"]});}});
 if(!saved.data)return null;
 const run=saved.data,analysis=run.analysis;
 const names=new Map(analysis.documents.map(d=>[d.documentId,d.originalName]));
 const icons={PROFILE:UserRound,CORE_SKILLS:Lightbulb,KEY_INFORMATION:FileText,EXPERIENCE:BriefcaseBusiness,EDUCATION:GraduationCap,INTERESTS:Heart};
 return <Card className="candidate-presentation"><CardHeader className="candidate-presentation-header">
  <div className="candidate-presentation-title"><span className="candidate-presentation-icon"><Sparkles size={19}/></span><div><div className="candidate-presentation-kicker">{nb?"Utkast fra dokumentanalyse":"Draft from document analysis"}</div><div className="document-results-heading"><h3>{nb?"Din presentasjon":"Your presentation"}</h3><Badge variant="outline">{nb?"AI-skrevet · ikke bekreftet":"AI-written · not confirmed"}</Badge></div></div></div>
  <p className="candidate-presentation-explainer">{nb?"Du har ikke skrevet inn denne teksten. AI laget den fra tekstutdrag i den siste godkjente dokumentanalysen. Sitater viser grunnlaget, men bekrefter ikke at AI-formuleringen er riktig.":"You did not enter this text. AI drafted it from excerpts in the latest approved document analysis. Citations show its sources, but do not confirm that the AI wording is accurate."}</p>
  <div className="candidate-presentation-actions"><AiIdentity selections={analysis.aiSelections} provider={analysis.aiSelections?.length?undefined:analysis.provider} locale={locale}/><Button variant="outline" size="sm" onClick={onReviewDocuments}><BookOpenCheck size={15}/>{nb?"Gå til dokumentene":"Go to documents"}<ArrowUpRight size={14}/></Button></div>
 </CardHeader><CardContent>
  {run.status!=="COMPLETED" && <p className="hint">{nb?"Analysen pågår eller er satt på pause. Dette er det som er lagret så langt.":"Analysis is in progress or paused. This is what is saved so far."}</p>}
  <div className="candidate-section-grid">{(analysis.profile??[]).map((item,index)=>{const Icon=icons[item.kind as keyof typeof icons]??FileText;return <CandidateSection key={`${run.id}-${index}-${item.kind}`} revision={run.revision} index={index} label={profileLabels[locale][item.kind as keyof typeof profileLabels.nb]} text={item.text} quote={item.quote} source={names.get(item.documentId)??""} additionalSources={(item.additionalSources??[]).map(source=>({quote:source.quote,source:names.get(source.documentId)??""}))} icon={<Icon size={17}/>} locale={locale} saving={write.isPending} onSave={text=>write.mutate({runId:run.id,revision:run.revision,index,text})}/>;})}</div>
  {!!write.error&&<p className="candidate-save-error" role="alert">{nb?"Kunne ikke lagre teksten. Analysen eller kilden kan ha blitt endret. Last inn siden og prøv igjen.":"Could not save the wording. The analysis or source may have changed. Reload the page and try again."}</p>}
  <p className="candidate-presentation-footnote"><ShieldAlert size={15}/>{analysis.documents.length} {nb?"dokumenter analysert. Dette er redigerbar AI-tekst, ikke bekreftede profilfakta. Kompetanse og historikk behandles separat med egen status og kilde.":"documents analyzed. This is editable AI wording, not confirmed profile facts. Competencies and career history are managed separately with their own status and evidence."}</p>
 </CardContent></Card>;
}

function CandidateSection({revision,index,label,text,quote,source,additionalSources,icon,locale,saving,onSave}:{revision:number;index:number;label:string;text:string;quote:string;source:string;additionalSources:{source:string;quote:string}[];icon:ReactNode;locale:Locale;saving:boolean;onSave:(text:string)=>void}) {
 const nb=locale==="nb";const [editing,setEditing]=useState(false);const [draft,setDraft]=useState(text);
 return <details open={index===0} className="candidate-section">
  <summary><span className="candidate-section-icon">{icon}</span><strong>{label}</strong><ChevronDown size={16} className="candidate-section-chevron"/></summary>
  <div className="candidate-section-content">
   {editing?<Textarea aria-label={nb?`Rediger ${label}`:`Edit ${label}`} lang={locale} rows={5} maxLength={1000} value={draft} onChange={event=>setDraft(event.target.value)}/>:<p lang={locale}>{text}</p>}
   <details className="candidate-evidence"><summary><FileText size={14}/>{nb?"Se AI-ens kildeutdrag":"See the AI source excerpts"}</summary><div className="candidate-evidence-list"><div><small>{source}</small><blockquote>{quote}</blockquote></div>{additionalSources.map((item,at)=><div key={`${at}-${item.source}`}><small>{item.source}</small><blockquote>{item.quote}</blockquote></div>)}</div></details>
   <div className="candidate-section-actions">{editing?<><Button size="sm" disabled={saving||!draft.trim()} onClick={()=>{onSave(draft);setEditing(false);}}><Save size={14}/>{nb?"Lagre tekst":"Save wording"}</Button><Button size="sm" variant="ghost" disabled={saving} onClick={()=>{setDraft(text);setEditing(false);}}><X size={14}/>{nb?"Avbryt":"Cancel"}</Button></>:<Button size="sm" variant="ghost" disabled={saving} onClick={()=>{setDraft(text);setEditing(true);}}><Pencil size={14}/>{nb?"Rediger tekstforslag":"Edit text draft"}</Button>}</div>
  </div>
 </details>;
}
