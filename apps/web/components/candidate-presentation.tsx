"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { isDocumentRun, profileLabels } from "../lib/document-workflow";
import type { Locale } from "../lib/translations";
import { Card, CardHeader, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { AiIdentity } from "./ai-identity";

/** Read the newest owned saved synthesis; rendering never starts a new AI call. */
export function CandidatePresentation({locale}:{locale:Locale}) {
 const nb=locale==="nb";
 const saved=useQuery({queryKey:["private-document-profile"],gcTime:0,retry:false,refetchOnReconnect:false,queryFn:async()=>{
  const response=await fetch("/api/profile/me/documents/workflow?scope=profile",{cache:"no-store"});
  const value:unknown=await response.json();if(!response.ok || value!==null && !isDocumentRun(value))throw new Error("DOCUMENT_UNAVAILABLE");return value;
 }});
 if(!saved.data)return null;
 const run=saved.data,analysis=run.analysis;
 const names=new Map(analysis.documents.map(d=>[d.documentId,d.originalName]));
 return <Card className="candidate-presentation"><CardHeader><div className="document-results-heading"><h3 className="flex items-center gap-2"><Sparkles size={18}/>{nb?"Din presentasjon":"Your presentation"}</h3><Badge variant="outline">{nb?"AI-utkast med kilder":"AI draft with sources"}</Badge></div><p className="hint">{nb?"Fra siste dokumentanalyse. Nye analyser oppdaterer denne presentasjonen; profilnavn og egne kompetanser beholdes.":"From your latest document analysis. New analyses update this presentation; your profile name and personal statements are retained."}</p><AiIdentity selections={analysis.aiSelections} provider={analysis.aiSelections?.length?undefined:analysis.provider} locale={locale}/></CardHeader><CardContent>
  {run.status!=="COMPLETED" && <p className="hint">{nb?"Analysen pågår eller er satt på pause. Dette er det som er lagret så langt.":"Analysis is in progress or paused. This is what has been saved so far."}</p>}
  <div className="profile-summary-grid">{(analysis.profile??[]).map((item,index)=><details open={item.kind==="PROFILE"} key={`${index}-${item.kind}`} className="candidate-section"><summary>{profileLabels[locale][item.kind as keyof typeof profileLabels.nb]}</summary><p lang={analysis.locale}>{item.text}</p><details><summary>{nb?"Se grunnlaget":"See the evidence"}</summary><p className="hint">{names.get(item.documentId)}</p><blockquote>{item.quote}</blockquote>{item.additionalSources?.map((source,i)=><div key={i}><p className="hint">{names.get(source.documentId)}</p><blockquote>{source.quote}</blockquote></div>)}</details></details>)}</div>
  <p className="hint mt-3">{analysis.documents.length} {nb?"dokumenter i denne analysen. Presentasjonen er en AI-formulering; den bekrefter ikke nye fakta.":"documents in this analysis. This is AI-generated prose; it does not confirm new facts."}</p>
 </CardContent></Card>;
}
