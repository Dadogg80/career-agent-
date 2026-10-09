import { MAX_JOB_REQUIREMENTS } from "./job-requirements";
import { claimId } from "./claims";
import { isAiSelection } from "./ai-configuration";
export type TextProposal = { paragraphIndex:number;oldText:string;newText:string;reason:string;claimIds:string[];requirementIndexes:number[] };
export type VisibilityStatus = "VISIBLE"|"WEAKLY_VISIBLE"|"NOT_VISIBLE"|"NEEDS_CLARIFICATION"|"UNASSESSED";
export type CvVisibility = {requirementIndex:number;status:VisibilityStatus;reason:string;claimIds:string[];passages:{paragraphIndex:number;quote:string}[]};
export type TailoringResult = { documentId:string;matchId:string;provider:"Groq"|"Gemini";model:string;proposals:TextProposal[];omittedItems:number;visibility?:CvVisibility[]|null };
export function isTailoringResult(value:unknown):value is TailoringResult {
 if(!value || typeof value!=="object")return false;
 const v=value as TailoringResult;
 const text=(s:unknown,max:number)=>typeof s==="string" && s.trim().length>0 && s.length<=max;
 return (v.visibility==null || isVisibilityList(v.visibility)) && typeof v.documentId==="string" && typeof v.matchId==="string" && claimId.test(v.documentId) && claimId.test(v.matchId) && isAiSelection(v) && Number.isSafeInteger(v.omittedItems) && v.omittedItems>=0 && v.omittedItems<=100 && Array.isArray(v.proposals) && v.proposals.length<=12 && v.proposals.every(p=>p && Number.isInteger(p.paragraphIndex) && p.paragraphIndex>=0 && p.paragraphIndex<500 && text(p.oldText,4000) && text(p.newText,4000) && text(p.reason,600) && Array.isArray(p.claimIds) && p.claimIds.length>0 && p.claimIds.length<=10 && p.claimIds.every(id=>typeof id==="string" && claimId.test(id)) && Array.isArray(p.requirementIndexes) && p.requirementIndexes.length>0 && p.requirementIndexes.length<=MAX_JOB_REQUIREMENTS && p.requirementIndexes.every(i=>Number.isInteger(i) && i>=0 && i<MAX_JOB_REQUIREMENTS));
}

/** Literal source segments; long paragraphs are split automatically, never sampled. */
export function tailoringPassages(text:string):string[] {
 return text.split(/\n\s*\n/).flatMap(block=>{
  const parts:string[]=[];let offset=0;
  while(offset<block.length){const limit=Math.min(offset+4000,block.length);const newline=limit<block.length?block.lastIndexOf("\n",limit-1):-1;const split=newline>=offset+2000?newline+1:limit;const high=block.charCodeAt(split-1),low=block.charCodeAt(split);const end=split<block.length && high>=0xD800 && high<=0xDBFF && low>=0xDC00 && low<=0xDFFF?split-1:split;const part=block.slice(offset,end);if(part.trim())parts.push(part);offset=end;}
  return parts;
 });
}

/** Apply reviewed substitutions to exact source ranges, retaining all other whitespace and text. */
export function reviewedCvText(source:string,changes:{paragraphIndex:number;oldText:string;text:string}[]):string|null {
 const paragraphs=tailoringPassages(source),ranges:{start:number;end:number}[]=[];
 let position=0;
 for(const paragraph of paragraphs){const start=source.indexOf(paragraph,position);if(start<0)return null;position=start+paragraph.length;ranges.push({start,end:position});}
 if(new Set(changes.map(c=>c.paragraphIndex)).size!==changes.length || changes.some(c=>!Number.isInteger(c.paragraphIndex) || c.paragraphIndex<0 || c.oldText!==paragraphs[c.paragraphIndex] || !c.text.trim() || c.text.length>4000))return null;
 let cursor=0,output="";
 for(const change of [...changes].sort((a,b)=>a.paragraphIndex-b.paragraphIndex)){const range=ranges[change.paragraphIndex];output+=source.slice(cursor,range.start)+change.text;cursor=range.end;}
 return output+source.slice(cursor);
}

export function isVisibilityList(value:unknown):value is CvVisibility[] {
 if(!Array.isArray(value) || value.length>MAX_JOB_REQUIREMENTS)return false;
 const str=(v:unknown,max:number)=>typeof v==="string" && !!v.trim() && v.length<=max;
 return new Set(value.map(v=>v?.requirementIndex)).size===value.length && value.every(v=>v && Number.isInteger(v.requirementIndex) && v.requirementIndex>=0 && v.requirementIndex<MAX_JOB_REQUIREMENTS && ["VISIBLE","WEAKLY_VISIBLE","NOT_VISIBLE","NEEDS_CLARIFICATION","UNASSESSED"].includes(v.status) && str(v.reason,600) && Array.isArray(v.claimIds) && v.claimIds.length<=10 && v.claimIds.every((id:unknown)=>typeof id==="string" && claimId.test(id)) && Array.isArray(v.passages) && v.passages.length<=5 && v.passages.every((p:{paragraphIndex:number;quote:string})=>p && Number.isInteger(p.paragraphIndex) && p.paragraphIndex>=0 && p.paragraphIndex<500 && str(p.quote,500)) && (!["VISIBLE","WEAKLY_VISIBLE","NOT_VISIBLE"].includes(v.status) || v.claimIds.length>0) && (!["VISIBLE","WEAKLY_VISIBLE"].includes(v.status) || v.passages.length>0) && (v.status!=="NOT_VISIBLE" || v.passages.length===0));
}
