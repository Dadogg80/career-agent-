import { localRequest,privateResponse,privateBase,sessionHeaders,smallJson,mappedPrivateError } from "../../../../../../../lib/private-api";
import { claimId } from "../../../../../../../lib/claims";
import { isTailoringResult } from "../../../../../../../lib/cv-tailoring";
import { retryAfterSeconds } from "../../../../../../../lib/retry-after";
export async function POST(request:Request,context:{params:Promise<{jobId:string}>}) {
 if(!localRequest(request))return privateResponse({code:"ACCESS_DENIED"},undefined,403);
 const {jobId}=await context.params;
 if(!claimId.test(jobId))return privateResponse({code:"CV_INVALID"},undefined,400);
 let body:string;
 try {
  const v=await smallJson(request,400000) as Record<string,unknown>;
  if(!v || Object.keys(v).sort().join(",")!=="aiApproval,consent,documentId,locale,matchId,text" || v.consent!==true || typeof v.documentId!=="string" || !claimId.test(v.documentId) || typeof v.matchId!=="string" || !claimId.test(v.matchId) || !["nb","en"].includes(String(v.locale)) || typeof v.aiApproval!=="string" || !/^[a-f0-9]{64}$/.test(v.aiApproval) || typeof v.text!=="string" || v.text.length<40 || v.text.length>60000)throw new Error("Invalid input");
  body=JSON.stringify(v);
 }catch{return privateResponse({code:"CV_INVALID"},undefined,400);}
 try {
  const headers=sessionHeaders(request);headers.set("Content-Type","application/json");
  const r=await fetch(`${privateBase()}/api/profile/me/jobs/${jobId}/tailoring`,{method:"POST",headers,body,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(90000)});
  const v:unknown=await r.json();
  if(!r.ok){const response=privateResponse(mappedPrivateError(v),r,[400,401,403,404,409,429,502,503].includes(r.status)?r.status:503);const retry=retryAfterSeconds(r.headers.get("retry-after"));if(r.status===429 && retry)response.headers.set("Retry-After",String(retry));return response;}
  if(!isTailoringResult(v))throw new Error("Invalid response");
  return privateResponse(v,r);
 }catch{return privateResponse({code:"CV_UNAVAILABLE"});}
}
