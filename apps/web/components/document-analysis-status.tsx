"use client";
import { useId, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Clock3, Info } from "lucide-react";
import { Button } from "./ui/button";
import { AiIdentity } from "./ai-identity";
import type { CareerDocument } from "../lib/documents";
import type { Locale } from "../lib/translations";

/** Saved metadata, without loading document text or making provider requests. */
export function DocumentAnalysisStatus({document,locale}:{document:CareerDocument;locale:Locale}) {
  const nb=locale==="nb", analysis=document.analysis, id=useId();
  const trigger=useRef<HTMLButtonElement>(null);
  const [position,setPosition]=useState<{left:number;top?:number;bottom?:number}|null>(null);
  function show() {
    const rect=trigger.current?.getBoundingClientRect(); if(!rect)return;
    const width=Math.min(340,window.innerWidth-32);
    setPosition({left:Math.max(16,Math.min(rect.left,window.innerWidth-width-16)),...(window.innerHeight-rect.bottom>330?{top:rect.bottom+8}:{bottom:window.innerHeight-rect.top+8})});
  }
  useEffect(()=>{
    if(!position)return;
    const close=()=>setPosition(null);
    window.addEventListener("scroll",close,true);window.addEventListener("resize",close);
    return ()=>{window.removeEventListener("scroll",close,true);window.removeEventListener("resize",close);};
  },[position]);
  if(!analysis)return <div className="document-analysis-status" data-analysis="none"><Sparkles size={14}/><span>{document.analysis===undefined?(nb?"Analysestatus ikke tilgjengelig":"Analysis status unavailable"):(nb?"Ikke AI-analysert":"Not AI analyzed")}</span></div>;
  const complete=analysis.status==="COMPLETED", label=complete?(nb?"AI-analysert":"AI analyzed"):(nb?"Delvis analysert":"Partially analyzed");
  return <div className="document-analysis-status" data-analysis={complete?"complete":"partial"}>
    <Button ref={trigger} type="button" variant="ghost" size="sm" aria-label={nb?"Vis analysedetaljer":"Show analysis details"} aria-describedby={position?id:undefined} onMouseEnter={show} onMouseLeave={()=>setPosition(null)} onFocus={show} onBlur={()=>setPosition(null)} onClick={show} onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();setPosition(null);}}}>
      {complete?<Sparkles size={14}/>:<Clock3 size={14}/>}<span>{label}</span><Info size={13}/>
    </Button><small>{analysis.competencies} {nb?"kompetansefunn":"competency findings"} · {analysis.careerEntries} {nb?"historikkpunkter":"career entries"}</small>
    {position && createPortal(<div id={id} role="tooltip" className="document-analysis-popover" style={position}>
      <strong>{label}</strong><p>{nb?"Analyse startet":"Analysis started"}: {new Date(analysis.createdAt).toLocaleString(locale)}</p>
      <dl><div><dt>{nb?"Kompetansefunn":"Competency findings"}</dt><dd>{analysis.competencies}</dd></div><div><dt>{nb?"Karrierehistorikk":"Career history"}</dt><dd>{analysis.careerEntries}</dd></div><div><dt>{nb?"Profilpunkter":"Profile items"}</dt><dd>{analysis.profileSections}</dd></div><div><dt>{nb?"Tekst behandlet":"Text processed"}</dt><dd>{analysis.inputCharacters.toLocaleString(locale)} / {analysis.sourceCharacters.toLocaleString(locale)}</dd></div></dl>
      <AiIdentity selections={analysis.selections} locale={locale}/>
      <p>{analysis.collection?(nb?"Fra en samlet dokumentanalyse. Tallene gjelder funn med dette dokumentet som kilde.":"From a combined analysis. Counts include findings sourced to this document."):(nb?"Fra analysen av dette dokumentet.":"From this document's analysis.")}</p>
      <small>{nb?"Behandlet tekst betyr ikke at all kompetanse er funnet eller godkjent. Vurder innhold og kilder før bruk.":"Processed text does not mean all competencies were found or approved. Review content and sources before use."}</small>
    </div>,window.document.body)}
  </div>;
}
