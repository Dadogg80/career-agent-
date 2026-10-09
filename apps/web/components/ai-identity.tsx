"use client";
import { Sparkles, ArrowRightLeft, LoaderCircle, Hourglass, ChevronDown, Check, RefreshCw, Info } from "lucide-react";
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

export function AiIdentity({selections,provider,locale,label,pending=false}: {selections?:AiSelection[];provider?:string;locale:Locale;label?:string;pending?:boolean}) {
  const values=selections?.length?selections:provider?provider.split(" + ").map(p=>({provider:p,model:""})):[];
  return <div className="ai-identity" aria-label={locale==="nb"?"AI-leverandør og modell":"AI provider and model"}>{label && <small>{label}</small>}{values.map(s=><Badge key={`${s.provider}:${s.model}`} variant="outline" className={`ai-identity-chip ${s.provider==="Gemini"?"ai-gemini":"ai-groq"}`}><Sparkles size={12}/><span>{s.provider} · {s.model || (locale==="nb"?"modell ikke lagret":"model not recorded")}</span></Badge>)}{!values.length && <small>{pending?(locale==="nb"?"Henter AI-oppsett …":"Loading AI configuration …"):(locale==="nb"?"Leverandør og modell ikke registrert":"Provider and model not recorded")}</small>}</div>;
}
type ConfigurationStatus = {isFetching:boolean;isError:boolean;refetch:()=>unknown};

export function AiChoice({approval,options,choose,disabled,locale,label,area,configuration}: {approval?:AiApproval;options:AiOption[];choose:(token:string)=>void;disabled?:boolean;locale:Locale;label?:string;area?:string;configuration?:ConfigurationStatus}) {
  const selected = approval?.token;
  const loading=!!configuration?.isFetching && !approval;
  const unavailable=!!configuration && !loading && (configuration.isError || !approval);
  const nb=locale==="nb";
  return <div className="ai-choice" data-choice-area={area}>
    {label && <span className="ai-choice-label">{label}</span>}
    {(approval || loading) && <AiIdentity selections={approval?.selections} locale={locale} pending={loading}/>}
    {unavailable && <div className="ai-configuration-status" role="status" aria-live="polite">
      <Info size={16} aria-hidden="true"/>
      <span><strong>{configuration.isError?(nb?"AI-oppsettet kunne ikke hentes":"AI configuration could not be retrieved"):(nb?"Ingen AI-modell tilgjengelig for denne oppgaven":"No AI model available for this task")}</strong><small>{nb?"Hent oppsettet på nytt. Dette sender ingen dokumenter og starter ingen analyse.":"Retry configuration retrieval. This sends no documents and starts no analysis."}</small></span>
      <Button type="button" variant="outline" size="sm" disabled={disabled || configuration.isFetching} onClick={()=>void configuration.refetch()}><RefreshCw size={14} aria-hidden="true"/>{configuration.isFetching?(nb?"Henter …":"Loading …"):(nb?"Prøv igjen":"Try again")}</Button>
    </div>}
    {options.some(option=>option.approval.token!==selected) && <details className="ai-choice-menu">
      <summary aria-label={locale==="nb"?"Bytt AI-modell":"Change AI model"}>
        <span className="ai-choice-trigger-icon"><ArrowRightLeft size={14}/></span>
        <span>{locale==="nb"?"Bytt modell":"Change model"}</span>
        <ChevronDown className="ai-choice-trigger-chevron" size={14}/>
      </summary>
      <div className="ai-choice-options" role="group" aria-label={locale==="nb"?"Tilgjengelige AI-modeller":"Available AI models"}>
        <p>{locale==="nb"?"Velg modell for oppgaven":"Choose a model for this task"}</p>
        {options.map(option=>{
          const current=option.approval.token===selected;
          const names=option.approval.selections.map(selection=>`${selection.provider} · ${selection.model}`);
          const provider=option.approval.selections.length===1?option.approval.selections[0].provider:"AI";
          return <Button key={option.approval.token} className={`ai-choice-option ${current?"is-current":""}`} data-provider={provider.toLowerCase()} size="sm" variant={current?"secondary":"outline"} aria-pressed={current} disabled={disabled || !option.available || current} onClick={event=>{choose(option.approval.token);const menu=event.currentTarget.closest("details");if(menu)menu.open=false;}}>
            <span className="ai-choice-option-icon"><Sparkles size={15}/></span>
            <span className="ai-choice-option-copy"><strong>{names.join(" / ")}</strong><small>{!option.available?(locale==="nb"?"Nøkkel mangler":"Key missing"):current?(locale==="nb"?"Valgt for denne oppgaven":"Selected for this task"):(locale==="nb"?"Velg denne modellen":"Select this model")}</small></span>
            {current && <Check className="ai-choice-option-check" size={16}/>}
          </Button>;
        })}
      </div>
    </details>}
  </div>;
}
