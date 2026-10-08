import { test,expect } from "@playwright/test";
const id="82345678-1234-1234-1234-123456789abc", time="2026-10-07T00:00:00Z";
const claim={id,skill:"Kotlin",statement:"Built APIs using Kotlin",context:"Fictional project",sourceNote:"Private evidence note",status:"CONFIRMED",revision:2,createdAt:time,updatedAt:time};
test("CV builder excludes unconfirmed experience, requires preview approval and retains draft after export failure",async({page})=>{
 let version:any=null;let approvals=0;let aiCalls=0;
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[claim,{...claim,id:"92345678-1234-1234-1234-123456789abc",skill:"Unverified Kafka",status:"UNVERIFIED",revision:1}]}));
 await page.route("**/api/profile/me/entries",r=>r.fulfill({json:[]}));await page.route("**/api/profile/me/jobs",r=>r.fulfill({json:[]}));
 await page.route("**/api/jobs/requirements",r=>{aiCalls++;return r.fulfill({json:{facts:[],requirements:[]}});});
 await page.route("**/api/profile/me/cvs**",r=>{
  const path=new URL(r.request().url()).pathname;const method=r.request().method();
  if(path.endsWith("/cleanup"))return r.fulfill({json:{remaining:0}});
  if(path.endsWith("/approve")){
   approvals++;expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");expect(r.request().postDataJSON()).toEqual({revision:1,approved:true});
   if(approvals===1)return r.fulfill({status:503,json:{code:"CV_EXPORT_FAILED"}});
   version={...version,status:"APPROVED",revision:2,approvedAt:time,artifacts:[{id,format:"PDF",byteSize:12,sha256:"a".repeat(64)},{id:"a2345678-1234-1234-1234-123456789abc",format:"DOCX",byteSize:12,sha256:"b".repeat(64)}]};return r.fulfill({json:version});
  }
  if(method==="POST"){
   const input=r.request().postDataJSON();expect(input.claims).toEqual([{id,revision:2}]);expect(input).not.toHaveProperty("status");
   version={id,title:input.title,content:{locale:input.locale,identity:input.identity,claims:[claim],entries:[],jobId:null,jobTitle:null},revision:1,status:"DRAFT",templateVersion:"standard-v1",createdAt:time,approvedAt:null,artifacts:[],stale:false};return r.fulfill({json:version});
  }
  if(path.endsWith("/download/pdf"))return r.fulfill({contentType:"application/pdf",body:"%PDF-synthetic"});
  if(method==="DELETE"){version=null;return r.fulfill({status:204});}
  return r.fulfill({json:version?[version]:[]});
 });
 await page.setViewportSize({width:390,height:900});await page.goto("/cv");
 await page.getByRole("button",{name:"Lag CV-utkast",exact:true}).click();const dialog=page.getByRole("dialog");
 await dialog.getByRole("textbox",{name:"Fullt navn",exact:true}).fill("Åse Ødegård");
 await dialog.getByRole("textbox",{name:"Overskrift / rolle",exact:true}).fill("Utvikler");
 await expect(dialog.getByText("Unverified Kafka")).toHaveCount(0);
 await expect(dialog.getByRole("button",{name:"3. Lagre og forhåndsvis",exact:true})).toBeDisabled();
 await dialog.getByRole("checkbox",{name:/Kotlin/}).check();await dialog.getByRole("button",{name:"3. Lagre og forhåndsvis",exact:true}).click();
 await expect(page.locator(".cv-paper")).toContainText("Åse Ødegård");await expect(page.locator(".cv-paper")).not.toContainText("Private evidence note");expect(approvals).toBe(0);
 await page.getByRole("button",{name:"Godkjenn og lag DOCX + PDF",exact:true}).click();
 await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Utkast og originaldokumenter er beholdt");await expect(page.locator(".cv-paper")).toContainText("Built APIs using Kotlin");
 await page.getByRole("button",{name:"Godkjenn og lag DOCX + PDF",exact:true}).click();
 await expect(page.getByRole("button",{name:"Last ned PDF",exact:true})).toBeVisible();const downloading=page.waitForEvent("download");await page.getByRole("button",{name:"Last ned PDF",exact:true}).click();expect((await downloading).suggestedFilename()).toContain(id);
 expect(aiCalls).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"/tmp/career-cv-mobile.png",fullPage:true});
 await page.getByRole("button",{name:"Slett versjon",exact:true}).click();await page.getByRole("dialog").filter({hasText:"Slett CV-versjonen?"}).getByRole("button",{name:"Slett versjon",exact:true}).click();
 await expect(page.getByRole("heading",{name:"En CV bygget på det du har bekreftet"})).toBeVisible();
});
test("CV proxies reject cross origin, client-owned status and unauthorized downloads",async({request})=>{
 expect((await request.get("/api/profile/me/cvs")).status()).toBe(401);
 expect((await request.get(`/api/profile/me/cvs/${id}/download/pdf`)).status()).toBe(401);
 expect((await request.post("/api/profile/me/cvs/cleanup",{headers:{Origin:"https://other.example"}})).status()).toBe(403);
 expect((await request.post("/api/profile/me/cvs",{data:{status:"APPROVED"}})).status()).toBe(400);
 expect((await request.post(`/api/profile/me/cvs/${id}/approve`,{data:{revision:1,approved:false}})).status()).toBe(400);
});
