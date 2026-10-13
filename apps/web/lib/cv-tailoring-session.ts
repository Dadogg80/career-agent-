import { claimId } from "./claims";
import { isTailoringResult,tailoringPassages,type TailoringResult } from "./cv-tailoring";
import type { MatchClaim } from "./personal-match";
import { MAX_JOB_REQUIREMENTS } from "./job-requirements";
export type WordingReview={paragraphIndex:number;text:string;decision:"PENDING"|"ACCEPTED"|"REJECTED"};
export type TailoringSession={id:string;jobId:string;revision:number;createdAt:string;stale:boolean;snapshot:{result:TailoringResult;text:string;claims:MatchClaim[];quotes:string[];locale:"nb"|"en";promptVersion:string};reviews:WordingReview[]};
export function isTailoringSession(value:unknown):value is TailoringSession {
 if(!value || typeof value!=="object")return false;
 const v=value as TailoringSession,s=v.snapshot;
 const text=(value:unknown,max:number,empty=false)=>typeof value==="string"&&value.length<=max&&(empty||!!value.trim());
 if(typeof v.id!=="string"||!claimId.test(v.id)||typeof v.jobId!=="string"||!claimId.test(v.jobId)||!Number.isSafeInteger(v.revision)||v.revision<1||!text(v.createdAt,40)||!Number.isFinite(Date.parse(v.createdAt))||typeof v.stale!=="boolean"||!s||!isTailoringResult(s.result)||s.result.sessionId!==v.id||!text(s.text,60000)||!["nb","en"].includes(s.locale)||!text(s.promptVersion,80)||!Array.isArray(s.claims)||s.claims.length>500||!s.claims.every(c=>c&&typeof c.id==="string"&&claimId.test(c.id)&&Number.isSafeInteger(c.revision)&&c.revision>0&&text(c.skill,120)&&text(c.statement,1000)&&text(c.context,500,true))||!Array.isArray(s.quotes)||s.quotes.length>MAX_JOB_REQUIREMENTS||!s.quotes.every(q=>text(q,1000)))return false;
 const paragraphs=tailoringPassages(s.text);
 if(s.result.sections && (s.result.sections.flatMap(section=>section.paragraphIndexes).length!==paragraphs.length || s.result.sections.some(section=>section.heading!==null && !paragraphs[section.paragraphIndexes[0]]?.includes(section.heading))))return false;
 if(s.result.passagePlans?.some(p=>p.claimIds.some(id=>!s.claims.some(c=>c.id===id))||p.requirementIndexes.some(i=>i>=s.quotes.length)))return false;
 if(s.result.sectionPlans?.some(plan=>plan.claimIds.some(id=>!s.claims.some(c=>c.id===id))||plan.requirementIndexes.some(i=>i>=s.quotes.length)))return false;
 if(s.result.proposals.some(p=>p.oldText!==paragraphs[p.paragraphIndex]||p.claimIds.some(id=>!s.claims.some(c=>c.id===id))||p.requirementIndexes.some(i=>i>=s.quotes.length)))return false;
 if(s.result.visibility?.some(a=>a.requirementIndex>=s.quotes.length||a.claimIds.some(id=>!s.claims.some(c=>c.id===id))||a.passages.some(p=>!paragraphs[p.paragraphIndex]?.includes(p.quote))))return false;
 return Array.isArray(v.reviews)&&v.reviews.length<=s.result.proposals.length&&new Set(v.reviews.map(r=>r?.paragraphIndex)).size===v.reviews.length&&v.reviews.every(r=>r&&s.result.proposals.some(p=>p.paragraphIndex===r.paragraphIndex)&&text(r.text,4000)&&["PENDING","ACCEPTED","REJECTED"].includes(r.decision));
}
