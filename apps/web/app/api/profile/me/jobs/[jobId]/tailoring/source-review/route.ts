import { localRequest,privateResponse,privateBase,sessionHeaders,smallJson,mappedPrivateError } from "../../../../../../../../lib/private-api";
import { claimId } from "../../../../../../../../lib/claims";
import { isWordingSourceResult } from "../../../../../../../../lib/cv-wording-source";
import { retryAfterSeconds } from "../../../../../../../../lib/retry-after";

export async function POST(request:Request,context:{params:Promise<{jobId:string}>}) {
 if(!localRequest(request))return privateResponse({code:"ACCESS_DENIED"},undefined,403);
 const {jobId}=await context.params;
 if(!claimId.test(jobId))return privateResponse({code:"CV_INVALID"},undefined,400);
 let body:Record<string,unknown>;
 try {
  body=await smallJson(request,4096) as Record<string,unknown>;
  if(!body||Object.keys(body).sort().join(",")!=="aiApproval,consent,locale,paragraphIndexes,revision,sessionId"||typeof body.sessionId!=="string"||!claimId.test(body.sessionId)||!Number.isSafeInteger(body.revision)||Number(body.revision)<1||typeof body.consent!=="boolean"||typeof body.aiApproval!=="string"||!/^[a-f0-9]{64}$/.test(body.aiApproval)||!["nb","en"].includes(String(body.locale))||!Array.isArray(body.paragraphIndexes)||body.paragraphIndexes.length<1||body.paragraphIndexes.length>40||new Set(body.paragraphIndexes).size!==body.paragraphIndexes.length||!body.paragraphIndexes.every(i=>Number.isInteger(i)&&i>=0&&i<500))throw new Error("Invalid input");
 }catch{return privateResponse({code:"CV_INVALID"},undefined,400);}
 try {
  const headers=sessionHeaders(request);headers.set("Content-Type","application/json");
  const r=await fetch(`${privateBase()}/api/profile/me/jobs/${jobId}/tailoring/source-review`,{method:"POST",headers,body:JSON.stringify(body),cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(305000)});
  const v:unknown=await r.json();
  if(!r.ok){const response=privateResponse(mappedPrivateError(v),r,[400,401,403,404,409,413,429,502,503].includes(r.status)?r.status:503);const retry=retryAfterSeconds(r.headers.get("retry-after"));if(r.status===429&&retry)response.headers.set("Retry-After",String(retry));return response;}
  if(!isWordingSourceResult(v)||v.sessionId!==body.sessionId||v.revision!==body.revision||v.locale!==body.locale||v.items.length!==(body.paragraphIndexes as number[]).length||v.items.some(i=>!(body.paragraphIndexes as number[]).includes(i.paragraphIndex)))throw new Error("Invalid response");
  return privateResponse(v,r);
 }catch{return privateResponse({code:"CV_UNAVAILABLE"});}
}
