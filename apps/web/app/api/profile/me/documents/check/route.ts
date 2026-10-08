import { localRequest,privateBase,sessionHeaders,privateResponse,smallJson,mappedPrivateError } from "../../../../../../lib/private-api";
import { isDocumentCheckReport } from "../../../../../../lib/document-checks";
export async function POST(request:Request){
 if(!localRequest(request))return privateResponse({code:"ACCESS_DENIED"},undefined,403);
 try{const v=await smallJson(request);if(!v||typeof v!=="object"||Array.isArray(v)||Object.keys(v).length)throw new Error();}catch{return privateResponse({code:"DOCUMENT_INVALID"},undefined,400);}
 try{const h=sessionHeaders(request);h.set("Content-Type","application/json");const r=await fetch(`${privateBase()}/api/profile/me/documents/check`,{method:"POST",headers:h,body:"{}",cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(60000)});const v:unknown=await r.json();if(!r.ok)return privateResponse(mappedPrivateError(v),r,[400,401,403,404,429,503].includes(r.status)?r.status:503);if(!isDocumentCheckReport(v))throw new Error();return privateResponse({checkedAt:v.checkedAt,documents:v.documents.map(d=>({documentId:d.documentId,characters:d.characters,checks:d.checks.map(c=>({kind:c.kind,state:c.state,code:c.code,items:c.items}))}))},r);}catch{return privateResponse({code:"DOCUMENT_UNAVAILABLE"});}
}
