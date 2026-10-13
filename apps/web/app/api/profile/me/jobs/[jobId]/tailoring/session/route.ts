import { localRequest,privateResponse,privateBase,sessionHeaders,smallJson,mappedPrivateError } from "../../../../../../../../lib/private-api";
import { claimId } from "../../../../../../../../lib/claims";
import { isTailoringSession } from "../../../../../../../../lib/cv-tailoring-session";
import { MAX_CV_PROPOSALS } from "../../../../../../../../lib/cv-tailoring";
type Context={params:Promise<{jobId:string}>};
async function forward(request:Request,context:Context,method:"GET"|"PUT") {
 if(!localRequest(request))return privateResponse({code:"ACCESS_DENIED"},undefined,403);
 const {jobId}=await context.params;
 if(!claimId.test(jobId))return privateResponse({code:"CV_INVALID"},undefined,400);
 let body:string|undefined;
 if(method==="PUT")try {
  const v=await smallJson(request,60000) as Record<string,unknown>;
  if(!v||Object.keys(v).sort().join(",")!=="reviews,revision,sessionId"||typeof v.sessionId!=="string"||!claimId.test(v.sessionId)||!Number.isSafeInteger(v.revision)||Number(v.revision)<1||!Array.isArray(v.reviews)||v.reviews.length>MAX_CV_PROPOSALS||v.reviews.some(r=>!r||Object.keys(r).sort().join(",")!=="decision,paragraphIndex,text"||!Number.isInteger(r.paragraphIndex)||r.paragraphIndex<0||r.paragraphIndex>=500||typeof r.text!=="string"||!r.text.trim()||r.text.length>4000||!["PENDING","ACCEPTED","REJECTED"].includes(r.decision)))throw new Error("Invalid input");
  body=JSON.stringify(v);
 }catch{return privateResponse({code:"CV_INVALID"},undefined,400);}
 try {
  const headers=sessionHeaders(request);if(body)headers.set("Content-Type","application/json");
  const r=await fetch(`${privateBase()}/api/profile/me/jobs/${jobId}/tailoring/session`,{method,headers,body,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(10000)});
  const v:unknown=await r.json();
  if(!r.ok)return privateResponse(mappedPrivateError(v),r,[400,401,403,404,409,503].includes(r.status)?r.status:503);
  if(!(method==="GET"&&v===null)&&(!isTailoringSession(v)||v.jobId!==jobId))throw new Error("Invalid response");
  return privateResponse(v,r);
 }catch{return privateResponse({code:"CV_UNAVAILABLE"});}
}
export const GET=(request:Request,context:Context)=>forward(request,context,"GET");
export const PUT=(request:Request,context:Context)=>forward(request,context,"PUT");
