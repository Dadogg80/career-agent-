import { test, expect } from "@playwright/test";

const selection={provider:"Gemini",model:"gemini-3.5-flash-lite"};
const structuredModels=[
 {provider:"Groq",model:"openai/gpt-oss-20b"},
 {provider:"Groq",model:"openai/gpt-oss-120b"},
 {provider:"Gemini",model:"gemini-3.8-flash"},
 {provider:"Gemini",model:"gemini-3.7-flash"},
 {provider:"Gemini",model:"gemini-3.6-flash"},
 {provider:"Gemini",model:"gemini-3.5-flash"},
 selection,
 {provider:"Gemini",model:"gemini-3.1-flash-lite"},
];
const sourceModels=[{provider:"Groq",model:"openai/gpt-oss-20b"},{provider:"Groq",model:"openai/gpt-oss-120b"},
 {provider:"Gemini",model:"gemini-3.5-flash-lite"},{provider:"Gemini",model:"gemini-3.5-flash"},
 {provider:"Gemini",model:"gemini-3.6-flash"},{provider:"Gemini",model:"gemini-3.7-flash"},
 {provider:"Gemini",model:"gemini-3.8-flash"},{provider:"Gemini",model:"gemini-3.1-flash-lite"}];
const optionFor=(model:{provider:string;model:string},index:number)=>({approval:{token:"a".repeat(63)+index.toString(16),selections:[model]},available:true});
const allStructuredOptions=structuredModels.map(optionFor);
const selectedOption=allStructuredOptions.find(o=>o.approval.selections[0].model===selection.model)!;
const structuredOptions=[selectedOption,...allStructuredOptions.filter(o=>o!==selectedOption)];
const approval=selectedOption.approval;
const allSourceOptions=sourceModels.map(optionFor);
const sourceDefault=allSourceOptions.find(o=>o.approval.selections[0].model==="gemini-3.8-flash")!;
const sourceOptions=[sourceDefault,...allSourceOptions.filter(o=>o!==sourceDefault)];
const sourceApproval=sourceDefault.approval;
const configuration={tasks:{JOB_ANALYSIS:selection,DOCUMENT_EXTRACTION:selection,PROFILE_SUMMARY:selection,PERSONAL_MATCH:selection,CV_TAILORING:selection},documents:approval,documentExcerpt:approval,matching:approval,job:approval,tailoring:approval,sourceRetrieval:sourceApproval,options:{documents:structuredOptions,documentExcerpt:structuredOptions,matching:structuredOptions,job:structuredOptions,tailoring:structuredOptions,sourceRetrieval:sourceOptions}};

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
 await page.route("**/api/ai/config",r=>{configCalls++;return r.fulfill({json:{...configuration,tailoring:recovered?approval:undefined,options:{...configuration.options,tailoring:recovered?structuredOptions:[]}}});});
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[claim]}));
 await page.route("**/api/profile/me/documents",r=>r.fulfill({json:[doc]}));
 await page.route(`**/api/profile/me/documents/${documentId}`,r=>r.fulfill({json:{document:doc,text}}));
 await page.route(`**/api/profile/me/jobs/${jobId}`,r=>r.fulfill({json:job}));
 await page.route(`**/api/profile/me/jobs/${jobId}/match`,r=>r.fulfill({json:match}));
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring/session`,r=>r.fulfill({json:null}));
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{aiCalls++;return r.fulfill({status:500,json:{}});});
 await page.goto(`/jobs/${jobId}/apply`);
 const tailoring=page.locator('[data-choice-area="tailoring"]');
 await expect(page.locator(".ai-configuration-status")).toContainText("Ingen AI-modell tilgjengelig");
 const consent=page.getByRole("checkbox",{name:/Jeg godkjenner at dette grunnlaget/});
 const submit=page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true});
 await expect(consent).toBeDisabled();await expect(submit).toBeDisabled();
 const beforeRetry=configCalls;recovered=true;
 await page.locator(".ai-configuration-status").getByRole("button",{name:"Prøv igjen",exact:true}).click();
 await expect(tailoring).toContainText("Tilpasning av CV-tekst");
 await expect(tailoring).toContainText("Gemini · gemini-3.5-flash-lite");
 await tailoring.locator("summary").click();
 await expect(tailoring.locator('[role="group"] button')).toHaveCount(8);
 await expect(consent).toBeEnabled();await expect(consent).not.toBeChecked();await expect(submit).toBeDisabled();
 await expect(page.getByLabel("Velg CV som utgangspunkt")).toHaveValue(documentId);
 expect(configCalls).toBe(beforeRetry+1);expect(aiCalls).toBe(0);
});

test("job retrieval and structured analysis expose separate supported model selectors",async({page})=>{
 await page.setViewportSize({width:390,height:900});
 let aiCalls=0;
 await page.route("**/api/status",r=>r.fulfill({json:{status:"UP"}}));
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:false,loginAvailable:true,profilesAvailable:true}}));
 await page.route("**/api/ai/config",r=>r.fulfill({json:configuration}));
 await page.route("**/api/jobs/import",r=>{aiCalls++;return r.fulfill({status:500,json:{}});});
 await page.route("**/api/jobs/requirements",r=>{aiCalls++;return r.fulfill({status:500,json:{}});});
 await page.goto("/jobs/analyze");
 const analysis=page.locator('[data-choice-area="job"]');
 const retrieval=page.locator('[data-choice-area="sourceRetrieval"]');
 await expect(analysis).toContainText(/Analyze requirements|Analyser krav/);
 await expect(retrieval).toContainText(/Retrieve ad|Hent annonse/);
 await analysis.locator("summary").click();
 await expect(analysis.locator('[role="group"]').getByRole("button")).toHaveCount(8);
 await expect(analysis).not.toContainText("qwen/qwen3.8-27b");
 for(const {model} of structuredModels) await expect(analysis).toContainText(model);
 await expect(analysis).toContainText(/adapter-protocol-supported|støttet adapterprotokoll/);
 await analysis.getByRole("button",{name:/openai\/gpt-oss-120b/}).click();
 await expect(analysis).toContainText("Groq · openai/gpt-oss-120b");
 await retrieval.locator("summary").click();
 await expect(retrieval.locator('[role="group"]').getByRole("button")).toHaveCount(8);
 await expect(retrieval).not.toContainText("qwen/qwen3.8-27b");
 expect(aiCalls).toBe(0);
});

test("unsupported configured default stays visible but is not added to the eight runnable choices",async({page})=>{
 const unsupported={provider:"Groq",model:"qwen/qwen3.8-27b"};
 const unsupportedApproval={token:"0".repeat(64),selections:[unsupported]};
 let aiCalls=0;
 await page.route("**/api/status",r=>r.fulfill({json:{status:"UP"}}));
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:false,loginAvailable:true,profilesAvailable:true}}));
 await page.route("**/api/ai/config",r=>r.fulfill({json:{...configuration,
  tasks:{...configuration.tasks,JOB_ANALYSIS:unsupported},
  job:unsupportedApproval,
 }}));
 await page.route("**/api/jobs/requirements",r=>{aiCalls++;return r.fulfill({status:500,json:{}});});
 await page.goto("/jobs/analyze");
 const choice=page.locator('[data-choice-area="job"]');
 await expect(choice).toContainText("Groq · qwen/qwen3.8-27b");
 await expect(choice).toContainText("Konfigurert standardmodell støttes ikke");
 await choice.locator("summary").click();
 const options=choice.locator('[role="group"] button');
 await expect(options).toHaveCount(8);
 await expect(choice.getByRole("button",{name:/qwen\/qwen3\.8-27b/})).toHaveCount(0);
 expect(aiCalls).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
