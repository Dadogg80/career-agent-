import { claimId } from "./claims";
import { isAiSelection } from "./ai-configuration";
export type TextProposal = { paragraphIndex:number;oldText:string;newText:string;reason:string;claimIds:string[];requirementIndexes:number[] };
export type TailoringResult = { documentId:string;matchId:string;provider:"Groq"|"Gemini";model:string;proposals:TextProposal[];omittedItems:number };
export function isTailoringResult(value:unknown):value is TailoringResult {
 if(!value || typeof value!=="object")return false;
 const v=value as TailoringResult;
 const text=(s:unknown,max:number)=>typeof s==="string" && s.trim().length>0 && s.length<=max;
 return typeof v.documentId==="string" && typeof v.matchId==="string" && claimId.test(v.documentId) && claimId.test(v.matchId) && isAiSelection(v) && Number.isSafeInteger(v.omittedItems) && v.omittedItems>=0 && v.omittedItems<=100 && Array.isArray(v.proposals) && v.proposals.length<=12 && v.proposals.every(p=>p && Number.isInteger(p.paragraphIndex) && p.paragraphIndex>=0 && p.paragraphIndex<500 && text(p.oldText,4000) && text(p.newText,4000) && text(p.reason,600) && Array.isArray(p.claimIds) && p.claimIds.length>0 && p.claimIds.length<=10 && p.claimIds.every(id=>typeof id==="string" && claimId.test(id)) && Array.isArray(p.requirementIndexes) && p.requirementIndexes.length>0 && p.requirementIndexes.length<=12 && p.requirementIndexes.every(i=>Number.isInteger(i) && i>=0 && i<12));
}

/** Literal source segments; long paragraphs are split automatically, never sampled. */
export function tailoringPassages(text:string):string[] {
 return text.split(/\n\s*\n/).flatMap(block=>{
  const parts:string[]=[];let offset=0;
  while(offset<block.length){const limit=Math.min(offset+4000,block.length);const newline=limit<block.length?block.lastIndexOf("\n",limit-1):-1;const split=newline>=offset+2000?newline+1:limit;const high=block.charCodeAt(split-1),low=block.charCodeAt(split);const end=split<block.length && high>=0xD800 && high<=0xDBFF && low>=0xDC00 && low<=0xDFFF?split-1:split;const part=block.slice(offset,end);if(part.trim())parts.push(part);offset=end;}
  return parts;
 });
}
