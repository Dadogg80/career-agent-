import { expect, test } from "@playwright/test";
const jobId = "52345678-1234-1234-1234-123456789abc";
const claimId = "62345678-1234-1234-1234-123456789abc";
const pendingId = "72345678-1234-1234-1234-123456789abc";
const time = "2026-10-07T00:00:00Z";
const text = "Kotlin experience is required for this fictional backend role. We also prefer Kafka.";
const job = { id:jobId,content:{ title:"Fictional backend developer",sourceUrl:null,sourceType:"PASTED_TEXT",text,locale:"nb",requirements:[{label:"Kotlin",kind:"REQUIRED",quote:"Kotlin experience is required"},{label:"Kafka",kind:"PREFERRED",quote:"We also prefer Kafka."}],facts:[],omittedItems:0,retrievedAt:null },createdAt:time };
const confirmed = { id:claimId,skill:"Kotlin",statement:"Built APIs using Kotlin",context:"Fictional project",sourceNote:"Private note not sent",status:"CONFIRMED",revision:2,createdAt:time,updatedAt:time };
const result = { id:"82345678-1234-1234-1234-123456789abc",locale:"nb",createdAt:time,assessments:[{requirementIndex:0,classification:"STRONG",reason:"Bekreftet Kotlin-bidrag er relevant.",evidence:[{claimId,quote:confirmed.statement}],question:""},{requirementIndex:1,classification:"CLARIFY",reason:"Kafka er ikke dokumentert, men dette er ikke en bekreftet mangel.",evidence:[],question:"Har du brukt en meldingskø?"}],claims:[{id:claimId,revision:2,skill:confirmed.skill,statement:confirmed.statement,context:confirmed.context}],omittedItems:0,inputCharacters:180,stale:false };

test("matching shares only selected confirmed revisions after separate approval and reopens without another call", async ({ page }) => {
 let stored: typeof result | null = null; let calls = 0; let current = { ...confirmed };
 const groq={provider:"Groq",model:"openai/gpt-oss-20b"},flash={provider:"Gemini",model:"gemini-3.5-flash"},lite={provider:"Gemini",model:"gemini-3.5-flash-lite"};
 const original={token:"a".repeat(64),selections:[groq]},flashApproval={token:"b".repeat(64),selections:[flash]},liteApproval={token:"c".repeat(64),selections:[lite]};
 const options=[{approval:original,available:true},{approval:flashApproval,available:true},{approval:liteApproval,available:true}];
 const logs: string[] = []; page.on("console",message => logs.push(message.text()));
 await page.route("**/api/ai/config",r=>r.fulfill({json:{tasks:{JOB_ANALYSIS:groq,DOCUMENT_EXTRACTION:groq,PROFILE_SUMMARY:groq,PERSONAL_MATCH:groq},documents:original,documentExcerpt:original,matching:original,job:original,options:{documents:options,documentExcerpt:options,matching:options,job:options}}}));
 await page.route("**/api/auth/session",r => r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me/claims",r => r.fulfill({json:[current,{...confirmed,id:pendingId,skill:"React",status:"UNVERIFIED",revision:1}]}));
 await page.route("**/api/profile/me/jobs**",r => {
  if (r.request().url().endsWith("/match")) {
   if (r.request().method() === "GET") return r.fulfill({json:stored});
   calls++; expect(r.request().postDataJSON()).toEqual({text,claims:[{id:claimId,revision:2}],locale:"nb",consent:true,aiApproval:liteApproval.token});
   expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf"); stored = result; return r.fulfill({json:result});
  }
  return r.fulfill({json:[job]});
 });
 await page.goto("/jobs/saved"); await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();
 const sheet = page.getByRole("dialog");
 await sheet.getByRole("button",{name:"Vurder personlig match",exact:true}).click();
 await sheet.locator(".ai-choice summary").click();
 await sheet.getByRole("button",{name:/Gemini · gemini-3.5-flash-lite/}).click();
 const submit = sheet.getByRole("button",{name:"Analyser personlig match",exact:true});
 await expect(submit).toBeDisabled(); expect(calls).toBe(0);
 await sheet.getByText("Se kompetansegrunnlaget",{exact:true}).click();await expect(sheet.locator(".match-claim")).toHaveCount(1);
 await expect(sheet.locator(".match-claim input")).toHaveCount(0);
 await expect(submit).toBeDisabled();
 const consent = sheet.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for denne matchingen"});
 await consent.check();
 await sheet.getByText("Se annonseteksten som sendes",{exact:true}).click();
 const preview = sheet.getByRole("textbox",{name:"Annonsetekst som sendes"});
 await preview.fill(text+"\n"); await expect(consent).not.toBeChecked();
 await preview.fill(text); await consent.check(); await submit.click();
 await expect(sheet.locator(".match-result")).toBeVisible();
 await expect(page.locator(".saved-job-card .saved-job-match")).toContainText("67%");
 await sheet.locator(".match-assessment summary").filter({hasText:"Kotlin"}).click();
 await expect(sheet.locator(".match-proof")).toContainText(confirmed.statement);
 await sheet.locator(".match-assessment summary").filter({hasText:"Kafka"}).click();
 await expect(sheet.getByText("Har du brukt en meldingskø?",{exact:true})).toBeVisible();
 expect(calls).toBe(1);
 await page.reload(); await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();
 await expect(page.locator(".match-result")).toBeVisible(); expect(calls).toBe(1);
 current = {...confirmed,status:"UNVERIFIED",revision:3};
 await page.reload(); await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();
 await expect(page.getByText("Vurderingen er utdatert fordi kompetansegrunnlaget er endret. Lag en ny vurdering før du bruker den videre.",{exact:true})).toBeVisible();
 expect(logs.join(" ")).not.toContain("Private note not sent");
 await page.setViewportSize({width:390,height:900});
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({path:"/tmp/career-personal-match-mobile.png",fullPage:true});
});

test("matching proxy rejects missing approval spoofed statements owner injection anonymous and foreign origins", async ({ request }) => {
 const path = `/api/profile/me/jobs/${jobId}/match`;
 const input = {text,claims:[{id:claimId,revision:2}],locale:"nb",consent:true};
 expect((await request.get(path)).status()).toBe(401);
 expect((await request.post(path,{data:{...input,consent:false}})).status()).toBe(400);
 expect((await request.post(path,{data:{...input,claims:[{id:claimId,revision:2,statement:"Invented"}]}})).status()).toBe(400);
 expect((await request.post(path,{data:{...input,ownerId:claimId}})).status()).toBe(400);
 expect((await request.post(path,{data:input,headers:{Origin:"https://unrelated.example"}})).status()).toBe(403);
});

test("daily quota keeps matching blocked beyond five minutes and preserves the earlier assessment", async ({ page }) => {
 let calls = 0;
 await page.route("**/api/auth/session", r => r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me/claims", r => r.fulfill({json:[confirmed]}));
 await page.route("**/api/profile/me/jobs**", r => {
  if (r.request().url().endsWith("/match")) {
   if (r.request().method() === "GET") return r.fulfill({json:result});
   calls++; return r.fulfill({status:429,headers:{"Retry-After":"968"},json:{code:"AI_RATE_LIMITED"}});
  }
  return r.fulfill({json:[job]});
 });
 await page.goto("/jobs/saved");
 await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();
 const sheet = page.getByRole("dialog");
 await sheet.getByRole("button",{name:"Vurder personlig match",exact:true}).click();
 await expect(sheet.locator(".match-claim input")).toHaveCount(0);
 await sheet.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Groq for denne matchingen"}).check();
 await page.clock.install();
 const submit = sheet.getByRole("button",{name:"Analyser personlig match",exact:true}); await submit.click();
 await expect(sheet).toContainText("16 min 8 s");
 await expect(sheet.locator(".workflow-notice")).toContainText("Den tidligere vurderingen er beholdt");
 await expect(sheet.locator(".match-result")).toBeVisible();
 await page.clock.fastForward(300000); await expect(submit).toBeDisabled(); expect(calls).toBe(1);
 await page.clock.fastForward(668000); await expect(submit).toBeEnabled(); expect(calls).toBe(1);
});

test("Gemini matching rejects stale approval without retrying and allows explicit reapproval after refresh",async({page})=>{
 const first="a".repeat(64),second="b".repeat(64);let token=first;let attempts=0;
 await page.route("**/api/ai/config",r=>{const selection={provider:"Gemini",model:token===first?"gemini-3.5-flash":"gemini-3.7-flash"};const approval={token,selections:[selection]};return r.fulfill({json:{tasks:{JOB_ANALYSIS:selection,DOCUMENT_EXTRACTION:selection,PROFILE_SUMMARY:selection,PERSONAL_MATCH:selection},documents:approval,documentExcerpt:approval,matching:approval}});});
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"test-csrf"}}));
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[confirmed]}));
 await page.route("**/api/profile/me/jobs**",r=>{
  if(r.request().url().endsWith("/match")) {
   if(r.request().method()==="GET")return r.fulfill({json:null});
   attempts++;expect(r.request().postDataJSON()).toEqual({text,claims:[{id:claimId,revision:2}],locale:"nb",consent:true,aiApproval:attempts===1?first:second});
   if(attempts===1){token=second;return r.fulfill({status:409,json:{code:"AI_APPROVAL_CHANGED"}});}
   return r.fulfill({json:{...result,provider:"Gemini",model:"gemini-3.7-flash"}});
  }
  return r.fulfill({json:[job]});
 });
 await page.goto("/jobs/saved");await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();const sheet=page.getByRole("dialog");
 await sheet.getByRole("button",{name:"Vurder personlig match",exact:true}).click();await expect(sheet).toContainText("Gemini · gemini-3.5-flash");
 await expect(sheet.locator(".match-claim input")).toHaveCount(0);const consent=sheet.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for denne matchingen"});const submit=sheet.getByRole("button",{name:"Analyser personlig match",exact:true});
 await consent.check();await submit.click();await expect(sheet).toContainText("Ingen data er sendt med den gamle godkjenningen.");expect(attempts).toBe(1);
 await sheet.getByRole("button",{name:"Hent AI-oppsett på nytt",exact:true}).click();await expect(sheet).toContainText("Gemini · gemini-3.7-flash");await expect(consent).not.toBeChecked();await expect(submit).toBeDisabled();expect(attempts).toBe(1);
 await consent.check();await submit.click();await expect(sheet.locator(".match-result")).toContainText("Gemini");expect(attempts).toBe(2);
});

test("Groq quota recovery keeps selected evidence and requires Gemini approval before a second matching call",async({page})=>{
 const groq={provider:"Groq",model:"openai/gpt-oss-20b"},gemini={provider:"Gemini",model:"gemini-3.5-flash"};
 const original={token:"b".repeat(64),selections:[groq]},alternative={token:"c".repeat(64),selections:[gemini]};const options=[{approval:original,available:true},{approval:alternative,available:true}];
 await page.route("**/api/ai/config",r=>r.fulfill({json:{tasks:{JOB_ANALYSIS:groq,DOCUMENT_EXTRACTION:groq,PROFILE_SUMMARY:groq,PERSONAL_MATCH:groq},documents:original,documentExcerpt:original,matching:original,job:original,options:{documents:options,documentExcerpt:options,matching:options,job:options}}}));
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[confirmed]}));
 let calls=0;let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
 await page.route("**/api/profile/me/jobs**",async r=>{
  if(!r.request().url().endsWith("/match"))return r.fulfill({json:[job]});
  if(r.request().method()==="GET")return r.fulfill({json:{...result,provider:"Groq",model:groq.model}});
  calls++;if(calls===1)return r.fulfill({status:429,headers:{"Retry-After":"968"},json:{code:"AI_RATE_LIMITED"}});
  expect(r.request().postDataJSON()).toMatchObject({aiApproval:alternative.token,consent:true,claims:[{id:claimId,revision:2}]});
  await pending;return r.fulfill({json:{...result,provider:"Gemini",model:gemini.model}});
 });
 await page.goto("/jobs/saved");await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();const sheet=page.getByRole("dialog");
 await sheet.getByRole("button",{name:"Vurder personlig match",exact:true}).click();
 await expect(sheet.locator(".match-claim input")).toHaveCount(0);await sheet.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Groq for denne matchingen"}).check();
 const submit=sheet.getByRole("button",{name:"Analyser personlig match",exact:true});await submit.click();await expect(sheet).toContainText("16 min");
 await sheet.getByRole("button",{name:/Prøv med Gemini/}).click();await expect(submit).toBeDisabled();expect(calls).toBe(1);
 await expect(sheet.locator(".match-claim input")).toHaveCount(0);await expect(sheet.locator(".match-result")).toContainText("Groq · openai/gpt-oss-20b");
 const consent=sheet.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for denne matchingen"});await expect(consent).not.toBeChecked();await consent.check();await submit.click();
 const activity=sheet.locator(".ai-activity");await expect(activity).toContainText("Venter på svar fra Gemini");
 await expect(sheet.getByRole("button",{name:"Sammenligner krav og erfaring …",exact:true})).toBeDisabled();expect(calls).toBe(2);
 await page.emulateMedia({reducedMotion:"reduce"});await expect(activity.locator(".ai-activity-icon svg")).toHaveCSS("animation-name","none");
 await page.screenshot({path:"/tmp/career-ai-loading.png",fullPage:false});release();await expect(activity).toHaveCount(0);
 await expect(sheet.locator(".match-result")).toContainText("Gemini · gemini-3.5-flash");expect(calls).toBe(2);
 await page.screenshot({path:"/tmp/career-ai-provider-recovery-match.png",fullPage:false});
});

test("automatic evidence planning keeps all skill identities and the whole advertisement",async()=>{
 const {automaticMatchEvidence,matchCoverage,matchSourcePreview}=await import("../lib/match-planning");
 const duplicate={...confirmed,id:pendingId,skill:"APIs",status:"CONFIRMED" as const};
 expect(automaticMatchEvidence([{...confirmed,status:"CONFIRMED"},duplicate,{...confirmed,id:jobId,status:"REJECTED"}],job.content as Parameters<typeof automaticMatchEvidence>[1],text)).toEqual([claimId,pendingId]);
 expect(matchCoverage(result as Parameters<typeof matchCoverage>[0],job.content as Parameters<typeof matchCoverage>[1])).toMatchObject({percent:67,upper:100,assessed:1,total:2});
 const unknown={...result,assessments:result.assessments.map(a=>({...a,classification:"CLARIFY",evidence:[]}))};
 expect(matchCoverage(unknown as Parameters<typeof matchCoverage>[0],job.content as Parameters<typeof matchCoverage>[1])?.percent).toBe(0);
 const long={...job.content,text:"Company description.\n".repeat(600)+"Kotlin experience is required\nWe also prefer Kafka."};
 const preview=matchSourcePreview(long as Parameters<typeof matchSourcePreview>[0]);
 expect(preview).toBe(long.text);expect(preview).toContain("Kotlin experience is required");expect(preview).toContain("We also prefer Kafka.");
 expect(preview.split("\n").every(line=>long.text.includes(line))).toBe(true);
});

test("clarification saves personal experience and confirms it locally without another AI request",async({page})=>{
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 let created=0,reviewed=0,ai=0;let savedClaim:typeof confirmed|null=null;
 await page.route("**/api/profile/me/claims**",r=>{
  if(r.request().url().endsWith("/review")){reviewed++;expect(r.request().postDataJSON()).toEqual({decision:"CONFIRM",revision:1});savedClaim={...savedClaim!,status:"CONFIRMED",revision:2};return r.fulfill({json:savedClaim});}
  if(r.request().method()==="GET")return r.fulfill({json:savedClaim?[confirmed,savedClaim]:[confirmed]});
  created++;const input=r.request().postDataJSON();expect(input).toMatchObject({skill:"Kafka",statement:"Jeg bygget en Kafka-basert hendelsesflyt.",context:"Fictional AS"});expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");savedClaim={...confirmed,...input,id:pendingId,status:"UNVERIFIED",revision:1};return r.fulfill({json:savedClaim});
 });
 await page.route("**/api/profile/me/jobs**",r=>{if(r.request().url().endsWith("/match")){if(r.request().method()==="POST")ai++;return r.fulfill({json:result});}return r.fulfill({json:[job]});});
 await page.goto("/jobs/saved");await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();const sheet=page.getByRole("dialog");
 await expect(sheet.locator(".match-score")).toContainText("67%");
 const assessment=sheet.locator(".match-assessment").filter({has:page.locator("summary").filter({hasText:"Kafka"})});
 await assessment.locator(":scope > summary").click();await assessment.getByText("Avklar og legg til erfaring",{exact:true}).click();
 await assessment.getByLabel("Beskriv det du selv gjorde",{exact:true}).fill("Jeg bygget en Kafka-basert hendelsesflyt.");await assessment.getByLabel("Firma eller prosjekt",{exact:true}).fill("Fictional AS");
 await assessment.getByRole("button",{name:"Bekreft og lagre i profilen",exact:true}).click();await expect(assessment).toContainText("Svaret ditt er lagret");expect(created).toBe(1);expect(reviewed).toBe(1);expect(ai).toBe(0);
});

test("matching approves all 35 contributions without skill checkboxes and updates the saved job card",async({page})=>{
 const evidence=Array.from({length:35},(_,i)=>({...confirmed,id:`${(i+1).toString(16).padStart(8,"0")}-1234-1234-1234-123456789abc`,statement:confirmed.statement+". Fictional delivery".repeat(25)}));
 let saved:Record<string,unknown>|null=null,calls=0;
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:evidence}));
 await page.route("**/api/profile/me/jobs**",r=>{
  if(!r.request().url().endsWith("/match"))return r.fulfill({json:[job]});
  if(r.request().method()==="GET")return r.fulfill({json:saved});
  calls++;const input=r.request().postDataJSON();
  expect(input.claims).toEqual(evidence.map(c=>({id:c.id,revision:c.revision})));
  expect(input.text).toBe(text);expect(input.consent).toBe(true);
  saved={...result,automaticEvidence:true,inputCharacters:20000,claims:evidence.map(({id,revision,skill,statement,context})=>({id,revision,skill,statement,context})),assessments:[{...result.assessments[0],evidence:[{claimId:evidence[34].id,quote:confirmed.statement}]},result.assessments[1]]};
  return r.fulfill({json:saved});
 });
 await page.goto("/jobs/saved");await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();const sheet=page.getByRole("dialog");
 await sheet.getByRole("button",{name:"Vurder personlig match",exact:true}).click();
 await expect(sheet).toContainText("35 kompetansebidrag");
 await expect(sheet.locator(".match-claims input")).toHaveCount(0);
 await sheet.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Groq for denne matchingen"}).check();
 await sheet.getByRole("button",{name:"Analyser personlig match",exact:true}).click();
 await expect(sheet.locator(".match-score")).toContainText("67%");expect(calls).toBe(1);
 await sheet.getByRole("button",{name:"Lukk",exact:true}).click();
 await expect(page.locator(".saved-job-card .saved-job-match")).toContainText("67% kravmatch");
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"/tmp/career-full-profile-match-card.png",fullPage:true});
 await page.reload();await expect(page.locator(".saved-job-card .saved-job-match")).toContainText("67% kravmatch");expect(calls).toBe(1);
});

test("twenty stored criteria expose provisional coverage and pending assessments without candidate questions",async({page})=>{
 const requirements=Array.from({length:20},(_,i)=>({label:`API criterion ${i}`,kind:"REQUIRED",quote:`Criterion ${i} requires API experience.`}));
 const expanded={...job,content:{...job.content,text:requirements.map(r=>r.quote).join("\n"),requirements}};
 const assessments=requirements.map((_,i)=>i===19?{...result.assessments[0],requirementIndex:i,evaluated:true}:{requirementIndex:i,classification:"CLARIFY",reason:"AI returnerte ingen gyldig vurdering av dette kravet.",evidence:[],question:"",evaluated:false});
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[confirmed]}));
 await page.route("**/api/profile/me/jobs**",r=>r.fulfill({json:r.request().url().endsWith("/match")?{...result,assessments}:[expanded]}));
 await page.goto("/jobs/saved");await expect(page.locator(".saved-job-match")).toContainText("Foreløpig");
 await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();const sheet=page.getByRole("dialog");
 await expect(sheet.locator(".match-score")).toContainText("5%");await expect(sheet.locator(".match-result")).toContainText("19 av 20 krav har ikke en gyldig AI-vurdering");
 await expect(sheet.locator(".match-assessment")).toHaveCount(20);
 await sheet.getByRole("button",{name:/Ikke vurdert\s*19/}).click();await expect(sheet.locator(".match-assessment")).toHaveCount(19);
 await sheet.locator(".match-assessment summary").first().click();await expect(sheet.locator(".match-clarification")).toHaveCount(0);
 await sheet.getByRole("button",{name:/Alle\s*20/}).click();await sheet.getByRole("textbox",{name:"Finn et krav eller en kompetanse"}).fill("API criterion 19");
 await expect(sheet.locator(".match-assessment")).toHaveCount(1);await sheet.locator(".match-assessment summary").click();await expect(sheet.locator(".match-proof")).toContainText(confirmed.statement);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("a previously confirmed clarification stays visible and edits the same claim instead of creating duplicates",async({page})=>{
 let answer={...confirmed,id:pendingId,skill:"Kafka",statement:"Built and operated Kafka integrations.",context:"Fictional AS",sourceNote:`User clarification for job ${jobId}; requirement 1`,revision:2};
 let creates=0,updates=0,reviews=0,ai=0;
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me/claims**",r=>{
  if(r.request().method()==="GET")return r.fulfill({json:[confirmed,answer]});
  if(r.request().url().endsWith("/review")){reviews++;expect(r.request().postDataJSON()).toEqual({decision:"CONFIRM",revision:3});if(reviews===1)return r.fulfill({status:503,json:{code:"CLAIM_UNAVAILABLE"}});answer={...answer,status:"CONFIRMED",revision:4};return r.fulfill({json:answer});}
  if(r.request().method()==="PUT"){updates++;expect(r.request().url()).toContain(pendingId);const body=r.request().postDataJSON();expect(body.revision).toBe(2);answer={...answer,...body,status:"UNVERIFIED",revision:3};return r.fulfill({json:answer});}
  creates++;return r.fulfill({status:500,json:{code:"UNEXPECTED_CREATE"}});
 });
 await page.route("**/api/profile/me/jobs**",r=>{if(r.request().url().endsWith("/match")){if(r.request().method()==="POST")ai++;return r.fulfill({json:result});}return r.fulfill({json:[job]});});
 await page.goto("/jobs/saved");await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();const sheet=page.getByRole("dialog");
 const assessment=sheet.locator(".match-assessment").filter({has:page.locator("summary").filter({hasText:"Kafka"})});await assessment.locator(":scope > summary").click();
 await expect(assessment).toContainText("Svaret ditt er lagret og med i grunnlaget");await assessment.getByText("Rediger det lagrede svaret",{exact:true}).click();
 await expect(assessment.getByLabel("Beskriv det du selv gjorde",{exact:true})).toHaveValue(answer.statement);
 await assessment.getByLabel("Beskriv det du selv gjorde",{exact:true}).fill("Built Kafka integrations and monitored delivery errors.");await assessment.getByRole("button",{name:"Bekreft og lagre i profilen",exact:true}).click();
 await expect(assessment.getByRole("alert")).toContainText("Teksten din er beholdt");await assessment.getByRole("button",{name:"Bekreft og lagre i profilen",exact:true}).click();
 await expect(assessment).toContainText("Svaret ditt er lagret");expect(creates).toBe(0);expect(updates).toBe(1);expect(reviews).toBe(2);expect(ai).toBe(0);
});

test("validators retain criterion 127 while rejecting unsupported overflow and duplicate assessment indices",async()=>{
 const {isExtraction}=await import("../lib/job-requirements");const {isPersonalMatch}=await import("../lib/personal-match");
 const requirements=Array.from({length:128},(_,i)=>({label:`Criterion ${i}`,kind:"REQUIRED",quote:"Literal source requirement"}));
 const extraction={requirements,facts:[],omittedItems:0};expect(isExtraction(extraction)).toBe(true);expect(isExtraction({...extraction,requirements:[...requirements,requirements[0]]})).toBe(false);
 const expanded={...result,assessments:requirements.map((_,i)=>({...result.assessments[0],requirementIndex:i}))};expect(isPersonalMatch(expanded)).toBe(true);expect(isPersonalMatch({...expanded,assessments:[...expanded.assessments,result.assessments[0]]})).toBe(false);
});
