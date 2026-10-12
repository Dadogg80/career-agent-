import {localRequest,sessionHeaders,smallJson,privateBase,privateResponse,mappedPrivateError} from "../../../../../lib/private-api";
import {isPresentation} from "../../../../../lib/presentation";
import {claimId} from "../../../../../lib/claims";
async function proxy(request:Request,write:boolean){
 if(!localRequest(request))return privateResponse({code:"ACCESS_DENIED"},undefined,403);
 let body:unknown;const locale=new URL(request.url).searchParams.get("locale");
 if(!write && !["nb","en"].includes(locale??""))return privateResponse({code:"PROFILE_INVALID"},undefined,400);
 if(write){try{body=await smallJson(request);}catch{return privateResponse({code:"PROFILE_INVALID"},undefined,400);}
  const b=body as Record<string,unknown>;
  if(!b || typeof b!=="object" || Object.keys(b).sort().join(",")!=="index,revision,runId,runRevision" || typeof b.runId!=="string" || !claimId.test(b.runId) || !Number.isSafeInteger(b.index) || Number(b.index)<0 || Number(b.index)>79 || !Number.isSafeInteger(b.revision) || Number(b.revision)<0 || !Number.isSafeInteger(b.runRevision) || Number(b.runRevision)<1)return privateResponse({code:"PROFILE_INVALID"},undefined,400);
 }
 try{const headers=sessionHeaders(request);if(write)headers.set("content-type","application/json");
  const response=await fetch(`${privateBase()}/api/profile/me/presentation${write?"":`?locale=${locale}`}`,{method:write?"PUT":"GET",headers,...(write?{body:JSON.stringify(body)}:{}),cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(10000)});
  const value:unknown=await response.json();if(!response.ok)return privateResponse(mappedPrivateError(value),response,[400,401,403,404,409,503].includes(response.status)?response.status:503);
  if(!isPresentation(value)||!write&&value.locale!==locale)throw new Error("PROFILE_UNAVAILABLE");return privateResponse(value,response);
 }catch{return privateResponse({code:"PROFILE_UNAVAILABLE"});}
}
export async function GET(request:Request){return proxy(request,false);}
export async function PUT(request:Request){return proxy(request,true);}
