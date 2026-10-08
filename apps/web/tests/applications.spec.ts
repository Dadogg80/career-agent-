import { test,expect } from "@playwright/test";
const id="b2345678-1234-1234-1234-123456789abc",jobId="c2345678-1234-1234-1234-123456789abc",cvId="d2345678-1234-1234-1234-123456789abc",time="2026-10-07T00:00:00Z";
const job={id:jobId,createdAt:time,content:{title:"Example developer",text:"A fictional company seeks a developer for Kotlin API development.",sourceUrl:null,sourceType:"PASTED_TEXT",locale:"en",requirements:[],facts:[],omittedItems:0,retrievedAt:null}};
const cv={id:cvId,title:"Example CV",status:"APPROVED",revision:2,templateVersion:"standard-v1",createdAt:time,approvedAt:time,stale:false,content:{locale:"en",identity:{name:"Fictional Pilot",headline:"",email:"",phone:"",location:"",summary:""},claims:[],entries:[],jobId,jobTitle:"Example developer"},artifacts:[{id:cvId,format:"PDF",byteSize:12,sha256:"a".repeat(64)},{id,format:"DOCX",byteSize:12,sha256:"b".repeat(64)}]};
test("application tracking requires explicit submission recording and locks the exact materials while retaining status history",async({page})=>{
 let value:any=null;let saves=0;let deletions=0;
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me/jobs",r=>r.fulfill({json:[job]}));await page.route("**/api/profile/me/cvs",r=>r.fulfill({json:[cv]}));
 await page.route("**/api/profile/me/applications**",r=>{
  const method=r.request().method();if(method==="GET")return r.fulfill({json:value?[value]:[]});
  expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");
  if(method==="POST"){expect(r.request().postDataJSON()).toEqual({jobId});value={id,jobId,jobTitle:"Example developer",content:{status:"CONSIDERING",cvVersionId:null,appliedOn:null,nextFollowUpOn:null,contactName:"",contactEmail:"",contactPhone:"",notes:"",applicationText:""},revision:1,createdAt:time,updatedAt:time,history:[{status:"CONSIDERING",recordedAt:time,cvVersionId:null,appliedOn:null}]};}
  else if(method==="PUT"){saves++;const input=r.request().postDataJSON();expect(input.revision).toBe(value.revision);value={...value,content:input.content,revision:value.revision+1,history:[...value.history,{status:input.content.status,cvVersionId:input.content.cvVersionId,appliedOn:input.content.appliedOn,recordedAt:time}]};}
  else if(method==="DELETE"){deletions++;value=null;return r.fulfill({status:204});}
  return r.fulfill({json:value});
 });
 await page.setViewportSize({width:390,height:900});await page.goto("/applications");
 await page.getByRole("button",{name:"Opprett søknadssak",exact:true}).click();await page.getByRole("combobox",{name:"Lagret stilling",exact:true}).selectOption(jobId);await page.getByRole("button",{name:"Opprett / åpne sak",exact:true}).click();
 await page.getByRole("combobox",{name:"Søknadsstatus",exact:true}).selectOption("APPLIED");await page.getByRole("combobox",{name:"Godkjent CV-versjon",exact:true}).selectOption(cvId);
 await page.getByLabel("Dato du faktisk sendte søknaden",{exact:true}).fill("2026-10-07");await page.getByRole("textbox",{name:"Søknadstekst / svar du vil bevare",exact:true}).fill("My exact submitted text");await page.getByRole("textbox",{name:"Kontaktperson",exact:true}).fill("Kari Test");await page.getByRole("textbox",{name:"Private notater",exact:true}).fill("Ask about team at interview");
 await page.getByRole("button",{name:"Lagre saken",exact:true}).click();expect(saves).toBe(0);const review=page.getByRole("dialog").filter({hasText:"Registrer innsendingen"});await expect(review).toContainText("Example CV");await expect(review).toContainText("My exact submitted text");await review.getByRole("button",{name:"Ja, registrer det jeg har sendt",exact:true}).click();
 await expect(page.getByRole("combobox",{name:"Godkjent CV-versjon",exact:true})).toBeDisabled();await expect(page.getByRole("textbox",{name:"Søknadstekst / svar du vil bevare",exact:true})).toBeDisabled();
 await page.getByRole("combobox",{name:"Søknadsstatus",exact:true}).selectOption("INTERVIEW_1");await page.getByRole("button",{name:"Lagre saken",exact:true}).click();await expect(page.getByRole("combobox",{name:"Søknadsstatus",exact:true})).toHaveValue("INTERVIEW_1");await page.locator(".source-evidence summary").click();await expect(page.locator(".source-evidence")).toContainText(cvId);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"/tmp/career-application-mobile.png",fullPage:true});expect(saves).toBe(2);
 await page.getByRole("button",{name:"Slett saken",exact:true}).click();await page.getByRole("dialog").filter({hasText:"Slett søknadssaken?"}).getByRole("button",{name:"Slett saken",exact:true}).click();await expect(page.getByRole("heading",{name:"Fra interessant stilling til neste steg"})).toBeVisible();expect(deletions).toBe(1);
});
test("application proxies protect ownership fields and require local authenticated access",async({request})=>{
 expect((await request.get("/api/profile/me/applications")).status()).toBe(401);
 expect((await request.post("/api/profile/me/applications",{data:{jobId},headers:{Origin:"https://other.example"}})).status()).toBe(403);
 expect((await request.post("/api/profile/me/applications",{data:{jobId,ownerId:id}})).status()).toBe(400);
 expect((await request.put(`/api/profile/me/applications/${id}`,{data:{revision:1,content:{status:"APPLIED"}}})).status()).toBe(400);
});
