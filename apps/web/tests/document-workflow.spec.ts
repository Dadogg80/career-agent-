import { expect, test, type Page } from "@playwright/test";
const id="12345678-1234-1234-1234-123456789abc",second="22345678-1234-1234-1234-123456789abc",runId="32345678-1234-1234-1234-123456789abc",key="42345678-1234-1234-1234-123456789abc";
const time="2026-10-08T00:00:00Z";
const text="## Example AS\nSenior Developer 2021 – 2024\nBuilt APIs using Kotlin and PostgreSQL.";
const doc={id,originalName:"cv.md",mediaType:"text/markdown",byteSize:200,sha256:"a".repeat(64),language:"nb",isMaster:false,createdAt:time,textCharacters:text.length};
const content={kind:"EMPLOYMENT",title:"Senior Developer",organization:"Example AS",client:"",deliveryRole:"",startMonth:null,endMonth:null,ongoing:false,description:"2021 – 2024\nUtviklet API-er.",sourceNote:"Document source"};
const analysis={id:runId,locale:"nb",provider:"Groq",summary:[],suggestions:["Kotlin","PostgreSQL"].map(skill=>({skill,statement:"Utviklet API-er med Kotlin og PostgreSQL.",context:"Example AS",quote:"Built APIs using Kotlin and PostgreSQL.",documentId:id,category:"TECHNOLOGY",drafted:true})),inputCharacters:text.length,sourceCharacters:text.length,partial:false,omittedItems:0,createdAt:time,documents:[{documentId:id,originalName:"cv.md",inputCharacters:text.length,sourceCharacters:text.length}],profile:[{kind:"PROFILE",text:"Erfaring med API-er, Kotlin og PostgreSQL.",quote:"Built APIs using Kotlin and PostgreSQL.",documentId:id}],careerEntries:[{key,content,periodText:"2021 – 2024",documentId:id,quote:text}]};
function run(status="COMPLETED",revision=3){return {id:runId,scope:id,revision,status,completedBatches:status==="COMPLETED"?2:1,totalBatches:2,nextAt:null as string|null,issue:null as string|null,analysis};}
async function profile(page:Page){
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me",r=>r.fulfill({json:{id,displayName:"Fictional Pilot",preferredLanguage:"nb",revision:1}}));
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[]}));await page.route("**/api/profile/me/entries",r=>r.fulfill({json:[]}));
}
async function open(page:Page){await page.goto("/career/profile");await page.getByRole("button",{name:"Analyser dokumentet",exact:true}).click();}
test("full source is approved once and automatically sequenced; editable skills and history require explicit confirmation",async({page})=>{
 await profile(page);let saved:ReturnType<typeof run>|null=null;let calls=0;let starts=0;let claims=0;let entries=0;const logs:string[]=[];page.on("console",m=>logs.push(m.text()));
 await page.route("**/api/profile/me/documents**",r=>{
  const url=r.request().url(),method=r.request().method();
  if(url.includes("/workflow")){
   if(url.endsWith("/claims")){claims++;const input=r.request().postDataJSON();expect(input).toMatchObject({skill:"Kotlin",statement:"Jeg utviklet API-er med Kotlin.",confirm:true,revision:3,index:0});return r.fulfill({json:{id:second,skill:input.skill,statement:input.statement,context:input.context,sourceNote:"AI-assisted document: cv.md",sourceDocumentId:id,sourceQuote:analysis.suggestions[0].quote,status:"CONFIRMED",revision:2,createdAt:time,updatedAt:time}});}
   if(url.endsWith("/entries")){entries++;const input=r.request().postDataJSON();expect(input.content.organization).toBe("Example AS");expect(input.content.title).toBe("Senior Developer");expect(input.content.startMonth).toBeNull();expect(input.confirm).toBe(false);return r.fulfill({json:{id:second,content:input.content,status:"UNVERIFIED",revision:1,createdAt:time,updatedAt:time}});}
   if(url.endsWith("/summary")){const input=r.request().postDataJSON();expect(input.text).toBe("Mitt redigerte profilsammendrag.");saved={...saved!,revision:4,analysis:{...analysis,profile:[{...analysis.profile[0],text:input.text}]}};return r.fulfill({json:saved});}
   if(method==="GET")return r.fulfill({json:saved});
   expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");
   if(url.endsWith("/next")){calls++;saved=calls===1?run("RUNNING",2):run();return r.fulfill({json:saved});}
   starts++;expect(r.request().postDataJSON()).toEqual({scope:id,documents:[{documentId:id,text}],locale:"nb",consent:true,aiApproval:expect.stringMatching(/^[a-f0-9]{64}$/)});saved={...run("RUNNING",1),completedBatches:0,analysis:{...analysis,suggestions:[],profile:[],careerEntries:[],inputCharacters:0,partial:true}};return r.fulfill({json:saved});
  }
  return r.fulfill({json:url.endsWith(id)?{document:doc,text}:[doc]});
 });
 await open(page);const outer=page.locator(".document-workspace-sheet");const start=outer.getByRole("button",{name:"Bygg profil fra dokumentene",exact:true});await expect(start).toBeDisabled();expect(calls).toBe(0);
 await outer.getByRole("checkbox",{name:"Jeg godkjenner at valgt tekst sendes til Groq for denne analysen"}).check();await start.click();
 await expect(outer.getByText("Gjennomgangen er klar",{exact:true})).toBeVisible();expect(calls).toBe(2);expect(starts).toBe(1);expect(claims).toBe(0);expect(entries).toBe(0);
 await outer.locator(".competency-proposal-grid").getByRole("button",{name:"Se gjennom",exact:true}).first().click();const draft=page.locator(".document-draft-sheet");
 await expect(draft.getByLabel("Kompetanse",{exact:true})).toHaveValue("Kotlin");await draft.getByLabel("Hva gjorde du selv?",{exact:true}).fill("Jeg utviklet API-er med Kotlin.");await draft.getByRole("checkbox").check();await draft.getByRole("button",{name:"Lagre og bekreft",exact:true}).click();await expect(draft).toHaveCount(0);expect(claims).toBe(1);
 await outer.getByRole("button",{name:"Karrierehistorikk",exact:true}).click();await outer.getByRole("button",{name:"Kontroller og legg til historikk",exact:true}).click();await expect(draft.getByLabel("Arbeidsgiver / organisasjon",{exact:true})).toHaveValue("Example AS");await draft.getByRole("button",{name:"Lagre som utkast",exact:true}).click();await expect(draft).toHaveCount(0);expect(entries).toBe(1);
 await outer.getByRole("button",{name:"Profilsammendrag",exact:true}).click();await outer.getByRole("button",{name:"Rediger sammendrag",exact:true}).click();await outer.getByLabel("Om deg",{exact:true}).fill("Mitt redigerte profilsammendrag.");await outer.getByRole("button",{name:"Lagre utkast",exact:true}).click();await expect(outer).toContainText("Mitt redigerte profilsammendrag.");
 await page.screenshot({path:"/tmp/career-document-review-desktop.png",fullPage:false});await outer.getByRole("button",{name:"Lukk",exact:true}).click();await page.getByRole("button",{name:"Din kompetanse",exact:true}).click();await expect(page.locator("#profile-documents")).toBeHidden();
 expect(logs.some(s=>s.includes("Built APIs")||s.includes("Jeg utviklet"))).toBe(false);
 await expect(page).toHaveURL(/#profile-competencies$/);await page.reload();await expect(page.locator("#profile-documents")).toBeHidden();
 await page.getByRole("button",{name:"Dokumenter og AI-profil",exact:true}).click();await expect(page).toHaveURL(/#profile-documents$/);await page.goBack();await expect(page.locator("#profile-documents")).toBeHidden();await page.goForward();await expect(page.locator("#profile-documents")).toBeVisible();expect(calls).toBe(2);
});
test("long documents have full editable previews without manual parts; editing resets consent and mobile view has no overflow",async({page})=>{
 await profile(page);const source="## Example AS\n"+"Built APIs with Kotlin and PostgreSQL.\n".repeat(500);let calls=0;
 await page.route("**/api/profile/me/documents**",r=>{if(r.request().url().includes("/workflow")){if(r.request().method()==="POST")calls++;return r.fulfill({json:null});}return r.fulfill({json:r.request().url().endsWith(id)?{document:{...doc,textCharacters:source.length},text:source}:[doc]});});
 await page.setViewportSize({width:390,height:844});await open(page);const outer=page.locator(".document-workspace-sheet");await outer.locator(".source-review-tile summary").click();const preview=outer.getByLabel("Tekst som sendes fra cv.md",{exact:true});await expect(preview).toHaveValue(source);await expect(outer.getByRole("button",{name:/^Del [0-9]/})).toHaveCount(0);
 const consent=outer.getByRole("checkbox",{name:"Jeg godkjenner at valgt tekst sendes til Groq for denne analysen"});await consent.check();await preview.fill(source+"Additional explicit source.");await expect(consent).not.toBeChecked();expect(calls).toBe(0);expect(await outer.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.screenshot({path:"/tmp/career-document-review-mobile.png",fullPage:false});
});
test("a long quota pause keeps proposals visible, survives reopening and never automatically retries",async({page})=>{
 await profile(page);const paused={...run("PAUSED",2),nextAt:new Date(Date.now()+968000).toISOString(),issue:"AI_RATE_LIMITED"};let calls=0;
 await page.route("**/api/profile/me/documents**",r=>{if(r.request().url().includes("/workflow")){if(r.request().method()==="POST")calls++;return r.fulfill({json:paused});}return r.fulfill({json:r.request().url().endsWith(id)?{document:doc,text}:[doc]});});
 await open(page);const outer=page.locator(".document-workspace-sheet");await expect(outer).toContainText("AI-kvoten er midlertidig brukt opp");await outer.getByRole("button",{name:"Profilsammendrag",exact:true}).click();await expect(outer.getByText("Erfaring med API-er, Kotlin og PostgreSQL.",{exact:true})).toBeVisible();await outer.getByRole("checkbox",{name:"Jeg godkjenner at valgt tekst sendes til Groq for denne analysen"}).check();await expect(outer.getByRole("button",{name:"Fortsett lagret analyse",exact:true})).toBeDisabled();await expect(outer).toContainText(/16 min/);expect(calls).toBe(0);
 await outer.getByRole("button",{name:"Lukk",exact:true}).click();await page.getByRole("button",{name:"Analyser dokumentet",exact:true}).click();await outer.getByRole("button",{name:"Profilsammendrag",exact:true}).click();await expect(outer).toContainText("Erfaring med API-er, Kotlin og PostgreSQL.");expect(calls).toBe(0);
 await outer.getByRole("button",{name:"Lukk",exact:true}).click();await page.getByRole("combobox",{name:"Språk",exact:true}).selectOption("en");await page.getByRole("button",{name:"Analyze document",exact:true}).click();await expect(outer).toContainText("AI quota is temporarily exhausted");await expect(outer.getByRole("button",{name:"Continue saved analysis",exact:true})).toBeDisabled();
});
test("workflow proxies reject anonymous reads, missing consent, spoofed ownership and cross-origin calls",async({request})=>{
 const path="/api/profile/me/documents/workflow";const body={scope:id,documents:[{documentId:id,text}],locale:"nb",consent:true};
 expect((await request.get(`${path}?scope=${id}`)).status()).toBe(401);expect((await request.post(path,{data:{...body,consent:false}})).status()).toBe(400);
 expect((await request.post(path,{data:{...body,ownerId:second}})).status()).toBe(400);expect((await request.post(path,{data:body,headers:{Origin:"https://other.example"}})).status()).toBe(403);
 expect((await request.post(`${path}/${runId}/next`,{data:{revision:1,ownerId:second}})).status()).toBe(400);expect((await request.post(`${path}/${runId}/claims`,{data:{revision:1,index:0,skill:"Kotlin",statement:"Built APIs",context:"Example AS",confirm:true,status:"CONFIRMED"}})).status()).toBe(400);
});

test("Gemini whole-document review names the recipient and binds sending to the displayed configuration",async({page})=>{
 await profile(page);const token="a".repeat(64);const selection={provider:"Gemini",model:"gemini-3.5-flash"};const approval={token,selections:[selection]};
 await page.route("**/api/ai/config",r=>r.fulfill({json:{tasks:{JOB_ANALYSIS:selection,DOCUMENT_EXTRACTION:selection,PROFILE_SUMMARY:selection,PERSONAL_MATCH:selection},documents:approval,documentExcerpt:approval,matching:approval}}));
 let stored:ReturnType<typeof run>|null=null;let starts=0;let nexts=0;
 await page.route("**/api/profile/me/documents**",r=>{
  if(r.request().url().includes("/workflow")) {
   if(r.request().method()==="GET")return r.fulfill({json:stored});
   if(r.request().url().endsWith("/next")){nexts++;stored={...run(),analysis:{...analysis,provider:"Gemini"}};return r.fulfill({json:{...stored,aiApproval:token}});}
   starts++;expect(r.request().postDataJSON()).toEqual({scope:id,documents:[{documentId:id,text}],locale:"nb",consent:true,aiApproval:token});stored={...run("RUNNING",1),completedBatches:0};return r.fulfill({json:{...stored,aiApproval:token,analysis:{...analysis,provider:"Gemini"}}});
  }
  return r.fulfill({json:r.request().url().endsWith(id)?{document:doc,text}:[doc]});
 });
 await open(page);const outer=page.locator(".document-workspace-sheet");
 await expect(outer).toContainText("Gemini · gemini-3.5-flash");
 await expect(outer.getByRole("checkbox",{name:/sendes til Groq/})).toHaveCount(0);
 const consent=outer.getByRole("checkbox",{name:"Jeg godkjenner at valgt tekst sendes til Gemini for denne analysen"});
 const start=outer.getByRole("button",{name:"Bygg profil fra dokumentene",exact:true});await expect(start).toBeDisabled();expect(starts).toBe(0);
 await consent.check();await start.click();await expect(outer).toContainText("Gjennomgangen er klar");expect(starts).toBe(1);expect(nexts).toBe(1);
 await expect(outer.getByText("Kotlin",{exact:true})).toBeVisible();await outer.getByRole("button",{name:"Karrierehistorikk",exact:true}).click();await expect(outer).toContainText("Arbeid, prosjekter og utdanning");
 await page.screenshot({path:"/tmp/career-gemini-document-review.png",fullPage:false});
});


test("quota recovery changes the displayed recipient and resumes the same run only after renewed approval",async({page})=>{
 await profile(page);
 const groq={provider:"Groq",model:"openai/gpt-oss-20b"},gemini={provider:"Gemini",model:"gemini-3.5-flash"};
 const original={token:"b".repeat(64),selections:[groq]},alternative={token:"c".repeat(64),selections:[gemini]};
 const options=[{approval:original,available:true},{approval:alternative,available:true}];
 await page.route("**/api/ai/config",r=>r.fulfill({json:{tasks:{JOB_ANALYSIS:groq,DOCUMENT_EXTRACTION:groq,PROFILE_SUMMARY:groq,PERSONAL_MATCH:groq},documents:original,documentExcerpt:original,matching:original,job:original,options:{documents:options,documentExcerpt:options,matching:options,job:options}}}));
 let stored={...run("PAUSED",2),aiApproval:original.token,plannedSelections:[groq],nextAt:new Date(Date.now()+968000).toISOString(),issue:"AI_RATE_LIMITED" as string|null,analysis:{...analysis,aiSelections:[groq]}};
 let switches=0,nexts=0,starts=0;
 await page.route("**/api/profile/me/documents**",r=>{
  const url=r.request().url();
  if(url.includes("/workflow")){
   if(r.request().method()==="GET")return r.fulfill({json:stored});
   if(url.endsWith("/provider")){switches++;expect(r.request().postDataJSON()).toEqual({revision:2,consent:true,aiApproval:alternative.token});stored={...stored,revision:3,status:"RUNNING",nextAt:null as unknown as string,issue:null,aiApproval:alternative.token,plannedSelections:[gemini]};return r.fulfill({json:stored});}
   if(url.endsWith("/next")){nexts++;expect(r.request().postDataJSON()).toEqual({revision:3});stored={...stored,status:"COMPLETED",completedBatches:2,nextAt:null as unknown as string,analysis:{...stored.analysis,provider:"Groq + Gemini",aiSelections:[groq,gemini]}};return r.fulfill({json:stored});}
   starts++;return r.fulfill({json:stored});
  }
  return r.fulfill({json:url.endsWith(id)?{document:doc,text}:[doc]});
 });
 await page.setViewportSize({width:390,height:844});await open(page);const outer=page.locator(".document-workspace-sheet");
 await expect(outer).toContainText("Groq · openai/gpt-oss-20b");
 await outer.getByRole("button",{name:"Prøv med Gemini",exact:true}).click();
 await expect(outer.getByRole("checkbox",{name:"Jeg godkjenner at valgt tekst sendes til Gemini for denne analysen"})).not.toBeChecked();
 const resume=outer.getByRole("button",{name:"Fortsett lagret analyse",exact:true});await expect(resume).toBeDisabled();expect(switches+nexts).toBe(0);
 await outer.getByRole("checkbox",{name:"Jeg godkjenner at valgt tekst sendes til Gemini for denne analysen"}).check();await resume.click();
 await expect(outer).toContainText("Gjennomgangen er klar");expect(starts).toBe(0);expect(switches).toBe(1);expect(nexts).toBe(1);
 await expect(outer).toContainText("Gemini · gemini-3.5-flash");await expect(outer.getByText("Kotlin",{exact:true})).toBeVisible();
 await expect(outer.locator(".ai-identity").filter({hasText:"Brukt i resultatet"})).toContainText("Groq · openai/gpt-oss-20b");
 expect(await outer.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await page.screenshot({path:"/tmp/career-ai-provider-recovery-mobile.png",fullPage:false});
});

test("grouped competency cards keep distinct contributions editable with their original source and proposal index",async({page})=>{
 await profile(page);let imports=0;
 const drafts=[{...analysis.suggestions[0],skill:"React",statement:"Built frontend components.",quote:"Built APIs using Kotlin and PostgreSQL."},{...analysis.suggestions[0],skill:"react",statement:"Maintained an existing interface.",quote:"Built APIs using Kotlin and PostgreSQL."},{...analysis.suggestions[0],skill:"React",context:"Other company",statement:"Built another product.",quote:"Built APIs using Kotlin and PostgreSQL."}];
 const stored={...run(),analysis:{...analysis,suggestions:drafts}};
 await page.route("**/api/profile/me/documents**",r=>{
  const url=r.request().url();if(url.endsWith("/claims")){imports++;const input=r.request().postDataJSON();expect(input.index).toBe(1);expect(input.statement).toBe(drafts[1].statement);return r.fulfill({json:{id:second,skill:input.skill,statement:input.statement,context:input.context,sourceNote:"cv.md",sourceDocumentId:id,sourceQuote:drafts[1].quote,status:"UNVERIFIED",revision:1,createdAt:time,updatedAt:time}});}
  if(url.includes("/workflow"))return r.fulfill({json:stored});return r.fulfill({json:url.endsWith(id)?{document:doc,text}:[doc]});
 });
 await open(page);const outer=page.locator(".document-workspace-sheet");await expect(outer.locator(".competency-skill-card")).toHaveCount(2);
 const group=outer.locator(".competency-context-group").filter({has:page.getByRole("heading",{name:"Example AS",exact:true})});
 await group.locator(".competency-contributions summary").click();await expect(group).toContainText(drafts[0].statement);await expect(group).toContainText(drafts[1].statement);
 await group.getByRole("button",{name:"Se gjennom",exact:true}).nth(1).click();const sheet=page.locator(".document-draft-sheet");await expect(sheet.getByLabel("Hva gjorde du selv?",{exact:true})).toHaveValue(drafts[1].statement);await expect(sheet.getByLabel("Firma / prosjekt",{exact:true})).toHaveValue("Example AS");
 await sheet.getByRole("button",{name:"Lagre som utkast",exact:true}).click();await expect(sheet).toHaveCount(0);expect(imports).toBe(1);
});

test("continuation cannot send an old source selection after the visible preview has been edited",async({page})=>{
 await profile(page);let posts=0;const stored={...run("PAUSED",2),approvedDocuments:[{documentId:id,text}]};
 await page.route("**/api/profile/me/documents**",r=>{const url=r.request().url();if(url.includes("/workflow")){if(r.request().method()==="POST")posts++;return r.fulfill({json:stored});}return r.fulfill({json:url.endsWith(id)?{document:doc,text}:[doc]});});
 await open(page);const outer=page.locator(".document-workspace-sheet");await outer.locator(".source-review-tile summary").click();
 const preview=outer.getByRole("textbox",{name:"Tekst som sendes fra cv.md",exact:true});await preview.fill(text.replace("Example AS","Removed private organization"));
 const consent=outer.getByRole("checkbox",{name:"Jeg godkjenner at valgt tekst sendes til Groq for denne analysen"});await consent.check();
 await expect(outer.getByRole("button",{name:"Fortsett lagret analyse",exact:true})).toBeDisabled();expect(posts).toBe(0);
 await outer.getByRole("button",{name:"Hent lagret tekstutvalg",exact:true}).click();await expect(preview).toHaveValue(text);await expect(consent).not.toBeChecked();expect(posts).toBe(0);
});
