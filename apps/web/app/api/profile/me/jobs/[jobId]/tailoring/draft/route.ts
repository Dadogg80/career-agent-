import { localRequest,privateResponse,privateBase,sessionHeaders,smallJson,mappedPrivateError } from "../../../../../../../../lib/private-api";
import { claimId } from "../../../../../../../../lib/claims";
import { isCv } from "../../../../../../../../lib/cvs";
export async function POST(request:Request,context:{params:Promise<{jobId:string}>}){
 if(!localRequest(request))return privateResponse({code:"ACCESS_DENIED"},undefined,403);
 const {jobId}=await context.params;if(!claimId.test(jobId))return privateResponse({code:"CV_INVALID"},undefined,400);
 let body:string;
 try{const v=await smallJson(request,2000) as Record<string,unknown>;if(!v||Object.keys(v).sort().join(",")!=="revision,sessionId"||typeof v.sessionId!=="string"||!claimId.test(v.sessionId)||!Number.isSafeInteger(v.revision)||Number(v.revision)<1)throw new Error("Invalid request");body=JSON.stringify(v);}catch{return privateResponse({code:"CV_INVALID"},undefined,400);}
 try{const headers=sessionHeaders(request);headers.set("Content-Type","application/json");const r=await fetch(`${privateBase()}/api/profile/me/jobs/${jobId}/tailoring/draft`,{method:"POST",headers,body,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(10000)});const v:unknown=await r.json();if(!r.ok)return privateResponse(mappedPrivateError(v),r,[400,401,403,404,409,503].includes(r.status)?r.status:503);if(!isCv(v)||v.content.jobId!==jobId||!v.content.reviewedSource||v.content.reviewedSource.sessionId!==JSON.parse(body).sessionId||v.content.reviewedSource.sessionRevision!==JSON.parse(body).revision)throw new Error("Invalid draft");return privateResponse(v,r);}catch{return privateResponse({code:"CV_UNAVAILABLE"});}
}
