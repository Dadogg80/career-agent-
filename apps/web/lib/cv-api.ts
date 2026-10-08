import { claimId } from "./claims";
import { isCv,isCvs,isCvIdentity } from "./cvs";
import { localRequest,privateBase,sessionHeaders,privateResponse,smallJson,mappedPrivateError } from "./private-api";
type Operation="list"|"create"|"detail"|"approve"|"delete"|"download"|"cleanup-status"|"cleanup";
export async function cvProxy(request:Request,operation:Operation,id?:string,format?:string){
 if(!localRequest(request))return privateResponse({code:"ACCESS_DENIED"},undefined,403);
 if(id!==undefined&&!claimId.test(id)||operation==="download"&&!["pdf","docx"].includes(format??""))return privateResponse({code:"CV_INVALID"},undefined,400);
 const headers=sessionHeaders(request);let body:string|undefined;
 if(["create","approve","delete"].includes(operation)) {
  try {const value=await smallJson(request,20000) as Record<string,unknown>;const keys=Object.keys(value).sort().join(",");
   if(operation==="create"){
    if(keys!=="claims,entries,identity,jobId,locale,title"||typeof value.title!=="string"||!value.title.trim()||value.title.length>200||!["nb","en"].includes(String(value.locale))||!isCvIdentity(value.identity)||Object.keys(value.identity).sort().join(",")!=="email,headline,location,name,phone,summary"||value.jobId!==null&&(typeof value.jobId!=="string"||!claimId.test(value.jobId)))throw new Error("Invalid draft");
    for(const [key,max] of [["claims",30],["entries",20]] as const){const list=value[key];if(!Array.isArray(list)||list.length>max||!list.every(x=>x&&Object.keys(x).sort().join(",")==="id,revision"&&typeof x.id==="string"&&claimId.test(x.id)&&Number.isSafeInteger(x.revision)&&x.revision>0))throw new Error("Invalid selection");}
   }else if(keys!==(operation==="approve"?"approved,revision":"revision")||!Number.isSafeInteger(value.revision)||Number(value.revision)<1||operation==="approve"&&value.approved!==true)throw new Error("Invalid approval");
   body=JSON.stringify(value);headers.set("Content-Type","application/json");
  }catch{return privateResponse({code:"CV_INVALID"},undefined,400);}
 }
 const suffix=operation.startsWith("cleanup")?"/cleanup":id?`/${id}${operation==="approve"?"/approve":operation==="download"?`/download/${format}`:""}`:"";
 try {
  const r=await fetch(`${privateBase()}/api/profile/me/cvs${suffix}`,{method:["create","approve","cleanup"].includes(operation)?"POST":operation==="delete"?"DELETE":"GET",headers,body,cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(operation==="approve"?60000:15000)});
  if(r.ok&&operation==="download") {
   const media=format==="pdf"?"application/pdf":"application/vnd.openxmlformats-officedocument.wordprocessingml.document";
   if(!r.headers.get("content-type")?.startsWith(media))throw new Error("Invalid file");
   const bytes=await r.arrayBuffer();if(bytes.byteLength<1||bytes.byteLength>5000000)throw new Error("Invalid file");
   const h=new Headers({"Cache-Control":"no-store","Content-Type":media,"Content-Disposition":`attachment; filename="career-cv-${id}.${format}"`,"X-Content-Type-Options":"nosniff"});
   for(const cookie of r.headers.getSetCookie())if(cookie.startsWith("CAREER_SESSION=")&&cookie.length<=4096)h.append("set-cookie",cookie);
   return new Response(bytes,{headers:h});
  }
  if(r.status===204&&operation==="delete")return privateResponse(null,r);
  const v:unknown=await r.json();if(!r.ok)return privateResponse(mappedPrivateError(v),r,[400,401,403,404,409,429,503].includes(r.status)?r.status:503);
  if(operation.startsWith("cleanup")){if(!v||typeof v!=="object"||!("remaining" in v)||!Number.isSafeInteger(v.remaining)||Number(v.remaining)<0||Number(v.remaining)>100)throw new Error("Invalid cleanup");}
  else if(!(operation==="list"?isCvs(v):isCv(v)))throw new Error("Invalid version");
  return privateResponse(v,r);
 }catch{return privateResponse({code:"CV_UNAVAILABLE"});}
}
