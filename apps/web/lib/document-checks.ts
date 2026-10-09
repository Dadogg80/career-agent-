import { claimId } from "./claims";
export const checkCodes = ["ORIGINAL_MISSING","ORIGINAL_CHANGED","ORIGINAL_UNCHANGED","TEXT_EMPTY","OCR_REQUIRES_REVIEW","TEXT_LIMIT_REACHED","READER_UNAVAILABLE","READER_DIFFERENT","TEXT_READABLE","NOT_ANALYZED","NOT_INCLUDED","EVIDENCE_CHANGED","NO_SUGGESTIONS","PARTIAL_ANALYSIS","EVIDENCE_SUPPORTED"] as const;
export type DocumentCheckReport = {
 checkedAt:string;
 documents:{
  documentId:string;
  characters:number;
  checks:{
   kind:"ORIGINAL"|"TEXT"|"INDIVIDUAL_AI"|"COMBINED_AI";
   state:"PASS"|"REVIEW"|"MISSING"|"FAIL";
   code:typeof checkCodes[number];
   items:number;
  }[];
 }[];
};
export function isDocumentCheckReport(value:unknown):value is DocumentCheckReport {
 if(!value||typeof value!=="object"||!("checkedAt" in value)||typeof value.checkedAt!=="string"||!Number.isFinite(Date.parse(value.checkedAt))||!("documents" in value)||!Array.isArray(value.documents)||value.documents.length>20)return false;
 return value.documents.every(v=>v&&typeof v.documentId==="string"&&claimId.test(v.documentId)&&Number.isSafeInteger(v.characters)&&v.characters>=0&&v.characters<=60000&&Array.isArray(v.checks)&&v.checks.length===4&&v.checks.every((c:{kind:unknown;state:unknown;code:unknown;items:unknown})=>["ORIGINAL","TEXT","INDIVIDUAL_AI","COMBINED_AI"].includes(String(c.kind))&&["PASS","REVIEW","MISSING","FAIL"].includes(String(c.state))&&checkCodes.includes(c.code as typeof checkCodes[number])&&Number.isSafeInteger(c.items)&&Number(c.items)>=0&&Number(c.items)<=23));
}
