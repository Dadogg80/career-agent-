import { claimId } from "./claims";
import { isAiSelection } from "./ai-configuration";
import type { TailoringSession } from "./cv-tailoring-session";

export type WordingSourceItem = { paragraphIndex:number;text:string;status:"SUPPORTED"|"NEEDS_REVIEW"|"UNSUPPORTED"|"UNASSESSED";reason:string;evidence:{claimId:string;quote:string}[] };
export type WordingSourceResult = { sessionId:string;revision:number;provider:"Groq"|"Gemini";model:string;locale:"nb"|"en";items:WordingSourceItem[] };
export function isWordingSourceResult(value:unknown):value is WordingSourceResult {
 if(!value||typeof value!=="object")return false;
 const v=value as WordingSourceResult;
 const text=(s:unknown,max:number)=>typeof s==="string"&&!!s.trim()&&s.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(s);
 return typeof v.sessionId==="string"&&claimId.test(v.sessionId)&&Number.isSafeInteger(v.revision)&&v.revision>=1&&isAiSelection(v)&&["nb","en"].includes(v.locale)&&Array.isArray(v.items)&&v.items.length>0&&v.items.length<=40&&new Set(v.items.map(i=>i?.paragraphIndex)).size===v.items.length&&v.items.every(i=>i&&Number.isInteger(i.paragraphIndex)&&i.paragraphIndex>=0&&i.paragraphIndex<500&&text(i.text,4000)&&text(i.reason,600)&&["SUPPORTED","NEEDS_REVIEW","UNSUPPORTED","UNASSESSED"].includes(i.status)&&Array.isArray(i.evidence)&&i.evidence.length<=10&&(i.status!=="SUPPORTED"||i.evidence.length>0)&&i.evidence.every(e=>e&&typeof e.claimId==="string"&&claimId.test(e.claimId)&&text(e.quote,1000)));
}
export function wordingSourceDrafts(session:TailoringSession) {
 const s=session.snapshot;
 return s.result.proposals.filter(p=>session.reviews.find(r=>r.paragraphIndex===p.paragraphIndex)?.decision!=="REJECTED").map(p=>{
  const unit=s.result.sourceUnits?.[p.paragraphIndex],context=unit?.contextIndex!=null?s.result.sourceUnits?.[unit.contextIndex]:null;
  return {paragraphIndex:p.paragraphIndex,original:p.oldText,draft:session.reviews.find(r=>r.paragraphIndex===p.paragraphIndex)?.text??p.newText,
   entryContext:context?s.text.slice(context.start,context.end):null,confirmedEvidence:s.claims.filter(c=>p.claimIds.includes(c.id)),jobCriteria:p.requirementIndexes.map(index=>({index,quote:s.quotes[index]}))};
 });
}
/** Validate the exact saved revision, wording and literal per-proposal evidence, never just a plausible status. */
export function wordingSourceMatches(value:WordingSourceResult,session:TailoringSession,indexes:number[],locale:"nb"|"en"):boolean {
 const drafts=wordingSourceDrafts(session);
 return value.sessionId===session.id&&value.revision===session.revision&&value.locale===locale&&value.items.length===indexes.length&&value.items.every(i=>{
  const draft=drafts.find(d=>d.paragraphIndex===i.paragraphIndex);
  return indexes.includes(i.paragraphIndex)&&!!draft&&i.text===draft.draft&&i.evidence.every(e=>draft.confirmedEvidence.some(c=>c.id===e.claimId&&(c.statement.includes(e.quote)||c.context.includes(e.quote))));
 });
}
