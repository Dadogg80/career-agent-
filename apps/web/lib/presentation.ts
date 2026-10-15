import { isAiProviderLabel, type AiProviderLabel } from "./ai-configuration";
import {claimId} from "./claims";
import {isAiSelection,type AiSelection} from "./ai-configuration";
import type {ProfileDraft} from "./document-analysis";
export type PresentationSection={runId:string;runRevision:number;index:number;item:ProfileDraft;sources:Record<string,string>;selections:AiSelection[];provider:string};
export type Presentation={locale:"nb"|"en";revision:number;sections:PresentationSection[]};
export function isPresentation(value:unknown):value is Presentation {
 if(!value || typeof value!=="object")return false;const v=value as Presentation;
 const text=(s:unknown,max:number)=>typeof s==="string" && s.trim().length>0 && s.length<=max;
 return ["nb","en"].includes(v.locale) && Number.isSafeInteger(v.revision) && v.revision>=0 && Array.isArray(v.sections) && v.sections.length<=6 && new Set(v.sections.map(s=>s?.item?.kind)).size===v.sections.length && v.sections.every(s=>
  !!s && claimId.test(s.runId) && Number.isSafeInteger(s.runRevision) && s.runRevision>0 && Number.isInteger(s.index) && s.index>=0 && s.index<80 &&
  !!s.item && ["PROFILE","CORE_SKILLS","KEY_INFORMATION","EXPERIENCE","EDUCATION","INTERESTS"].includes(s.item.kind) && text(s.item.text,1000) && claimId.test(s.item.documentId) && text(s.item.quote,1000) &&
  (s.item.additionalSources==null || Array.isArray(s.item.additionalSources) && s.item.additionalSources.length<=30 && s.item.additionalSources.every(e=>claimId.test(e.documentId) && text(e.quote,1000))) &&
  s.sources && typeof s.sources==="object" && !Array.isArray(s.sources) && Object.entries(s.sources).length<=20 && Object.entries(s.sources).every(([id,name])=>claimId.test(id)&&text(name,255)) &&
  isAiProviderLabel(s.provider) && Array.isArray(s.selections) && s.selections.length<=40 && s.selections.every(isAiSelection));
}
