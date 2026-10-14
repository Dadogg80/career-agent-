import { expect,test } from "@playwright/test";
import { POST } from "../app/api/profile/me/jobs/[jobId]/tailoring/source-review/route";
import { isWordingSourceResult,wordingSourceMatches } from "../lib/cv-wording-source";
import type { TailoringSession } from "../lib/cv-tailoring-session";

const id="52345678-1234-1234-1234-123456789abc",claimId="62345678-1234-1234-1234-123456789abc";
const body={sessionId:id,revision:3,paragraphIndexes:[1],locale:"nb",consent:true,aiApproval:"a".repeat(64)};
const selection={provider:"Gemini" as const,model:"gemini-3.5-flash-lite"};
const response={sessionId:id,revision:3,...selection,locale:"nb" as const,items:[{paragraphIndex:1,text:"Developed APIs.",status:"SUPPORTED" as const,reason:"API work is documented.",evidence:[{claimId,quote:"Built APIs"}]}]};
const session:TailoringSession={id,jobId:id,revision:3,createdAt:"2026-10-14T00:00:00Z",stale:false,reviews:[],snapshot:{text:"Developer\n\nBuilt APIs.",locale:"nb",promptVersion:"fixture",quotes:["API work"],claims:[{id:claimId,revision:2,skill:"APIs",statement:"Built APIs.",context:"Example AS"}],result:{documentId:id,matchId:id,sessionId:id,...selection,omittedItems:0,proposals:[{paragraphIndex:1,oldText:"Built APIs.",newText:"Developed APIs.",reason:"Clearer API wording",claimIds:[claimId],requirementIndexes:[0]}]}}};
test("wording review requires exact saved text revision per-proposal evidence and a complete unique result",()=>{
 expect(isWordingSourceResult(response)).toBe(true);
 expect(wordingSourceMatches(response,session,[1],"nb")).toBe(true);
 for(const altered of [{...response,revision:4},{...response,items:[{...response.items[0],text:"Managed all staff."}]},{...response,items:[{...response.items[0],evidence:[{claimId,quote:"Led autonomous agents"}]}]}])expect(wordingSourceMatches(altered,session,[1],"nb")).toBe(false);
 expect(isWordingSourceResult({...response,items:[response.items[0],response.items[0]]})).toBe(false);
 expect(isWordingSourceResult({...response,items:[{...response.items[0],evidence:[]}]})).toBe(false);
 expect(wordingSourceMatches(response,{...session,reviews:[{paragraphIndex:1,text:"New saved wording.",decision:"PENDING"}]},[1],"nb")).toBe(false);
});
test("source-review proxy rejects forged draft input and mismatched upstream revisions without retrying",async()=>{
 const original=globalThis.fetch;let calls=0;
 const request=(value:unknown)=>new Request(`http://127.0.0.1:3000/api/profile/me/jobs/${id}/tailoring/source-review`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});
 const context={params:Promise.resolve({jobId:id})};
 globalThis.fetch=async()=>{calls++;return Response.json({...response,revision:99});};
 try {
  expect((await POST(request({...body,text:"CLIENT_MUST_NOT_REPLACE_SAVED_WORDING"}),context)).status).toBe(400);
  expect((await POST(request({...body,paragraphIndexes:[1,1]}),context)).status).toBe(400);
  expect(calls).toBe(0);
  const rejected=await POST(request(body),context);
  expect(rejected.status).toBe(503);expect(await rejected.json()).toEqual({code:"CV_UNAVAILABLE"});
  expect(calls).toBe(1);
 }finally{globalThis.fetch=original;}
});
