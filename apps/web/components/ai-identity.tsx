"use client";
import { Sparkles, ArrowRightLeft, LoaderCircle, Hourglass } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { AiSelection, AiOption, AiApproval } from "../lib/ai-configuration";
import type { Locale } from "../lib/translations";

export function AiActivity({label,detail,waiting=false}:{label:string;detail?:string;waiting?:boolean}) {
  const Icon=waiting?Hourglass:LoaderCircle;
  return <div className="ai-activity" role="status" aria-live="polite" data-waiting={waiting}>
    <span className="ai-activity-icon" aria-hidden="true"><Icon size={20}/></span>
    <span><strong>{label}</strong>{detail && <small>{detail}</small>}</span>
    <span className="ai-activity-dots" aria-hidden="true"><i/><i/><i/></span>
  </div>;
}

export function AiIdentity({selections,provider,locale,label}: {selections?:AiSelection[];provider?:string;locale:Locale;label?:string}) {
  const values=selections?.length?selections:provider?provider.split(" + ").map(p=>({provider:p,model:""})):[];
  return <div className="ai-identity" aria-label={locale==="nb"?"AI-leverandør og modell":"AI provider and model"}>{label && <small>{label}</small>}{values.map(s=><Badge key={`${s.provider}:${s.model}`} variant="outline" className={`ai-identity-chip ${s.provider==="Gemini"?"ai-gemini":"ai-groq"}`}><Sparkles size={12}/><span>{s.provider} · {s.model || (locale==="nb"?"modell ikke lagret":"model not recorded")}</span></Badge>)}{!values.length && <small>{locale==="nb"?"Henter AI-oppsett …":"Loading AI configuration …"}</small>}</div>;
}
export function AiChoice({approval,options,choose,disabled,locale}: {approval?:AiApproval;options:AiOption[];choose:(token:string)=>void;disabled?:boolean;locale:Locale}) {
  return <div className="ai-choice"><AiIdentity selections={approval?.selections} locale={locale}/>{options.some(o=>o.approval.token!==approval?.token) && <details><summary aria-label={locale==="nb"?"Bytt AI-leverandør":"Change AI provider"}><ArrowRightLeft size={13}/>{locale==="nb"?"Bytt":"Change"}</summary><div className="ai-choice-options">{options.map(o=><Button key={o.approval.token} size="sm" variant={o.approval.token===approval?.token?"secondary":"outline"} disabled={disabled || !o.available || o.approval.token===approval?.token} onClick={e=>{choose(o.approval.token);const menu=e.currentTarget.closest("details");if(menu)menu.open=false;}}>{o.approval.selections.map(s=>`${s.provider} · ${s.model}`).join(" / ")}{!o.available && <small> · {locale==="nb"?"nøkkel mangler":"key missing"}</small>}</Button>)}</div></details>}</div>;
}
