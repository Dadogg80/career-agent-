import { validAiApprovalField } from "./ai-configuration";
import { localRequest,privateBase,sessionHeaders,privateResponse,smallJson,mappedPrivateError } from "./private-api";
import { retryAfterSeconds } from "./retry-after";
import { isClaim, claimId } from "./claims";
import { isDocumentRun } from "./document-workflow";
import { isEntry,validEntryContent } from "./career-entries";
export async function documentWorkflowProxy(request:Request,operation:"latest"|"start"|"load"|"next"|"entry"|"claim"|"summary"|"provider",id?:string) {
 if(!localRequest(request))return privateResponse({code:"ACCESS_DENIED"},undefined,403);
 if(id!==undefined && !claimId.test(id))return privateResponse({code:"DOCUMENT_INVALID"},undefined,400);
 const headers=sessionHeaders(request);let body:string|undefined;let scope="";
 try {
  if(operation==="latest") {const query=new URL(request.url).searchParams;scope=query.get("scope")??"";if([...query.keys()].join(",")!=="scope" || scope!=="collection" && scope!=="profile" && !claimId.test(scope))throw new Error();}
  else if(!["load"].includes(operation)) {
   const input=await smallJson(request,operation==="start"?6000000:20000) as Record<string,unknown>;if(!input || typeof input!=="object")throw new Error();
   if(!validAiApprovalField(input))throw new Error();
   const keys=Object.keys(input).filter(key=>key!=="aiApproval" && !(operation==="start" && key==="populateProfile")).sort().join(",");
   if(operation==="start") {
    if(input.populateProfile!==undefined && typeof input.populateProfile!=="boolean")throw new Error();
    if(keys!=="consent,documents,locale,scope" || input.consent!==true || !["nb","en"].includes(String(input.locale)) || input.scope!=="collection" && (typeof input.scope!=="string" || !claimId.test(input.scope)) || !Array.isArray(input.documents) || input.documents.length<1 || input.documents.length>20)throw new Error();
    let size=0;const ids=new Set<string>();for(const item of input.documents){if(!item || Object.keys(item).sort().join(",")!=="documentId,text" || typeof item.documentId!=="string" || !claimId.test(item.documentId) || ids.has(item.documentId) || typeof item.text!=="string" || !item.text.trim() || item.text.length>60000)throw new Error();size+=item.text.length;ids.add(item.documentId);}if(size<40 || size>1200000 || input.scope!=="collection" && (ids.size!==1 || !ids.has(String(input.scope))))throw new Error();
   } else if(operation==="entry") {if(keys!=="confirm,content,key" || typeof input.confirm!=="boolean" || typeof input.key!=="string" || !claimId.test(input.key) || !validEntryContent(input.content) || Object.keys(input.content).sort().join(",")!=="client,deliveryRole,description,endMonth,kind,ongoing,organization,sourceNote,startMonth,title")throw new Error();}
   else if(operation==="claim") {if((input.reject!==undefined && (typeof input.reject!=="boolean" || input.reject===true && input.confirm===true)) || Object.keys(input).filter(key=>key!=="reject").sort().join(",")!=="confirm,context,index,revision,skill,statement" || typeof input.confirm!=="boolean" || !Number.isSafeInteger(input.revision) || Number(input.revision)<1 || !Number.isInteger(input.index) || Number(input.index)<0 || Number(input.index)>299 || !["skill","statement","context"].every(key=>typeof input[key]==="string" && String(input[key]).trim().length>0 && String(input[key]).length<=(key==="skill"?120:key==="statement"?1000:500)))throw new Error();}
   else {if(!Number.isSafeInteger(input.revision) || Number(input.revision)<1)throw new Error();if(operation==="provider" && (keys!=="consent,revision" || input.consent!==true || typeof input.aiApproval!=="string"))throw new Error();if(operation==="next" && keys!=="revision")throw new Error();if(operation==="summary" && (keys!=="index,revision,text" || !Number.isInteger(input.index) || Number(input.index)<0 || Number(input.index)>79 || typeof input.text!=="string" || input.text.trim().length<1 || input.text.length>1000))throw new Error();}
   body=JSON.stringify(input);headers.set("Content-Type","application/json");
  }
 }catch{return privateResponse({code:"DOCUMENT_AI_INPUT_INVALID"},undefined,400);}
 try {
  const suffix=operation==="latest"?`?scope=${encodeURIComponent(scope)}`:id?`/${id}${operation==="provider"?"/provider":operation==="next"?"/next":operation==="entry"?"/entries":operation==="summary"?"/summary":operation==="claim"?"/claims":""}`:"";
  const upstream=await fetch(`${privateBase()}/api/profile/me/documents/workflow${suffix}`,{method:request.method,headers,body,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(30000)});let value:unknown=await upstream.json();
  if(!upstream.ok){const response=privateResponse(mappedPrivateError(value),upstream,[400,401,403,404,409,413,429,502,503].includes(upstream.status)?upstream.status:503);const retry=retryAfterSeconds(upstream.headers.get("retry-after"));if(retry)response.headers.set("Retry-After",String(retry));return response;}
  if(operation==="latest" && value && typeof value==="object" && "run" in value)value=value.run;
  if(!(value===null && operation==="latest") && !(operation==="entry"?isEntry(value):operation==="claim"?isClaim(value):isDocumentRun(value)))throw new Error();return privateResponse(value,upstream);
 }catch{return privateResponse({code:"DOCUMENT_UNAVAILABLE"});}
}
