import { test, expect } from "@playwright/test";

const selection={provider:"Gemini",model:"gemini-3.5-flash-lite"};
const approval={token:"a".repeat(64),selections:[selection]};
const option={approval,available:true};
const configuration={tasks:{JOB_ANALYSIS:selection,DOCUMENT_EXTRACTION:selection,PROFILE_SUMMARY:selection,PERSONAL_MATCH:selection},documents:approval,documentExcerpt:approval,matching:approval,job:approval,tailoring:approval,sourceRetrieval:approval,options:{documents:[option],documentExcerpt:[option],matching:[option],job:[option],tailoring:[option],sourceRetrieval:[option]}};

for (const locale of ["nb","en"] as const) {
 test(`configuration retry recovers without starting AI (${locale})`,async({page})=>{
  await page.setViewportSize({width:locale==="nb"?390:1280,height:900});
  let configCalls=0,aiCalls=0;
  await page.route("**/api/status",r=>r.fulfill({json:{status:"UP"}}));
  await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:false,loginAvailable:true,profilesAvailable:true}}));
  await page.route("**/api/ai/config",r=>{configCalls++;return configCalls===1?r.fulfill({status:503,json:{code:"UNAVAILABLE"}}):r.fulfill({json:configuration});});
  await page.route("**/api/jobs/requirements",r=>{aiCalls++;return r.fulfill({status:500,json:{}});});
  await page.goto("/jobs/analyze");
  const choice=page.locator('[data-choice-area="job"]');
  await expect(choice).toContainText("AI-oppsettet kunne ikke hentes");
  if(locale==="en") await page.getByRole("combobox",{name:"Språk"}).selectOption("en");
  await expect(choice).toContainText(locale==="nb"?"Dette sender ingen dokumenter":"This sends no documents");
  await expect(choice).not.toContainText(locale==="nb"?"Henter AI-oppsett":"Loading AI configuration");
  expect(configCalls).toBe(1);
  await choice.getByRole("button",{name:locale==="nb"?"Prøv igjen":"Try again",exact:true}).click();
  await expect(choice).toContainText("Gemini · gemini-3.5-flash-lite");
  await expect(page.locator(".ai-configuration-status")).toHaveCount(0);
  expect(configCalls).toBe(2);expect(aiCalls).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`/tmp/career-ai-config-recovery-${locale}.png`,fullPage:true});
 });
}

test("CV preparation can recover a missing task configuration and still requires consent",async({page})=>{
 const jobId="52345678-1234-1234-1234-123456789abc",claimId="62345678-1234-1234-1234-123456789abc",documentId="72345678-1234-1234-1234-123456789abc",matchId="82345678-1234-1234-1234-123456789abc",time="2026-10-07T00:00:00Z";
 const text="Fictional engineer\n\nBuilt Kotlin APIs for a fictional employer and improved service reliability.";
 const claim={id:claimId,skill:"Kotlin",statement:text.split("\n\n")[1],context:"Fictional employer",sourceNote:"Own statement",status:"CONFIRMED",revision:2,createdAt:time,updatedAt:time};
 const job={id:jobId,content:{title:"Fictional developer",sourceUrl:null,sourceType:"PASTED_TEXT",text:"Kotlin experience is required for this fictional backend role.",locale:"nb",requirements:[{label:"Kotlin",kind:"REQUIRED",quote:"Kotlin experience is required"}],facts:[],omittedItems:0,retrievedAt:null},createdAt:time};
 const doc={id:documentId,originalName:"fictional-master.txt",mediaType:"text/plain",byteSize:text.length,sha256:"a".repeat(64),language:"nb",isMaster:true,createdAt:time,textCharacters:text.length};
 const match={id:matchId,locale:"nb",createdAt:time,assessments:[{requirementIndex:0,classification:"STRONG",reason:"Documented APIs",evidence:[{claimId,quote:claim.statement}],question:""}],claims:[{id:claimId,revision:2,skill:claim.skill,statement:claim.statement,context:claim.context}],omittedItems:0,inputCharacters:180,stale:false,automaticEvidence:true,...selection};
 let configCalls=0,aiCalls=0,recovered=false;
 await page.route("**/api/status",r=>r.fulfill({json:{status:"UP"}}));
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/ai/config",r=>{configCalls++;return r.fulfill({json:{...configuration,tailoring:recovered?approval:undefined,options:{...configuration.options,tailoring:recovered?[option]:[]}}});});
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[claim]}));
 await page.route("**/api/profile/me/documents",r=>r.fulfill({json:[doc]}));
 await page.route(`**/api/profile/me/documents/${documentId}`,r=>r.fulfill({json:{document:doc,text}}));
 await page.route(`**/api/profile/me/jobs/${jobId}`,r=>r.fulfill({json:job}));
 await page.route(`**/api/profile/me/jobs/${jobId}/match`,r=>r.fulfill({json:match}));
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{aiCalls++;return r.fulfill({status:500,json:{}});});
 await page.goto(`/jobs/${jobId}/apply`);
 await expect(page.locator(".ai-configuration-status")).toContainText("Ingen AI-modell tilgjengelig");
 const consent=page.getByRole("checkbox",{name:/Jeg godkjenner at dette grunnlaget/});
 const submit=page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true});
 await expect(consent).toBeDisabled();await expect(submit).toBeDisabled();
 const beforeRetry=configCalls;recovered=true;
 await page.locator(".ai-configuration-status").getByRole("button",{name:"Prøv igjen",exact:true}).click();
 await expect(page.locator(".ai-choice")).toContainText("Gemini · gemini-3.5-flash-lite");
 await expect(consent).toBeEnabled();await expect(consent).not.toBeChecked();await expect(submit).toBeDisabled();
 await expect(page.getByLabel("Velg CV som utgangspunkt")).toHaveValue(documentId);
 expect(configCalls).toBe(beforeRetry+1);expect(aiCalls).toBe(0);
});
