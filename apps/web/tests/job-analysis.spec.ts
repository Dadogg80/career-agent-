import { expect, test } from "@playwright/test";
import { isAiConfiguration } from "../lib/ai-configuration";

const source = "Vi søker en utvikler. Du må ha erfaring med Kotlin. PostgreSQL er en fordel.";
const result = { facts: [], requirements: [{ label: "Kotlin", kind: "REQUIRED", quote: "Du må ha erfaring med Kotlin." }] };

test("renders cited requirements and marks edited source as outdated", async ({ page }) => {
  await page.route("**/api/jobs/requirements", (route) => route.fulfill({ json: result }));
  await page.goto("/jobs/analyze");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse" }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Krav fra annonsen" })).toBeVisible();
  const columns = await page.locator(".analysis-grid.has-result").evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(2);
  await expect(page.locator(".analysis-result-stat")).toHaveCount(3);
  await expect(page.locator(".analysis-result-stat").nth(0)).toContainText("Må-krav");
  await expect(page.locator(".analysis-result-stat").nth(0)).toContainText("1");
  await expect(page.locator(".analysis-result-stat").nth(1)).toContainText("Ønskede krav");
  await expect(page.getByRole("listitem").getByText("Må-krav", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Se detaljer: Kotlin", exact: true }).click();
  await expect(page.locator("blockquote")).toHaveText("Du må ha erfaring med Kotlin.");
  await page.keyboard.press("Escape");
  await page.getByRole("textbox", { name: "Stillingsannonse" }).fill(source + " Ny tekst.");
  await expect(page.getByRole("region", { name: "Gjør annonsen enklere å vurdere" }).getByRole("alert")).toContainText("Annonsen er endret");
});

test("job analysis result summary stays readable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/jobs/requirements", route => route.fulfill({ json: {
    facts: [],
    requirements: [
      { label: "Kotlin", kind: "REQUIRED", quote: "Du må ha erfaring med Kotlin." },
      { label: "PostgreSQL", kind: "PREFERRED", quote: "PostgreSQL er en fordel." },
      { label: "Språk", kind: "UNCLEAR", quote: "Gode språkkunnskaper." },
    ],
  } }));
  await page.goto("/jobs/analyze");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse" }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  await expect(page.locator(".analysis-result-stat")).toHaveCount(3);
  await expect(page.getByRole("navigation", { name: "Krav fra annonsen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("paste-only entry gives the advertisement editor room and keeps the next step visible", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/jobs/analyze");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await expect(page.locator(".analysis-grid")).toHaveClass(/is-paste-entry/);
  const editor = page.getByRole("textbox", { name: "Stillingsannonse" });
  await expect(editor).toBeVisible();
  expect(await editor.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(300);
  await expect(page.getByRole("heading", { name: "Neste mulighet starter her" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("English request and UI error retain the advertisement", async ({ page }) => {
  let requestedLocale = "";
  await page.route("**/api/jobs/requirements", (route) => {
    requestedLocale = route.request().postDataJSON().locale;
    return route.fulfill({ status: 429, json: { code: "AI_RATE_LIMITED" } });
  });
  await page.goto("/jobs/analyze");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await page.getByRole("textbox", { name: "Job advertisement" }).fill(source);
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect(page.locator(".workflow-notice")).toContainText("is waiting for available AI quota");
  await expect(page.getByRole("textbox", { name: "Job advertisement" })).toHaveValue(source);
  expect(requestedLocale).toBe("en");
});

test("real proxy rejects invalid input without an AI call", async ({ request }) => {
  const response = await request.post("/api/jobs/requirements", { data: { text: "short", locale: "nb" } });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ code: "INVALID_INPUT" });
});

test("real proxy rejects a stale AI approval before calling a provider", async ({ request }) => {
  const response = await request.post("/api/jobs/requirements", {
    data: { text: source, locale: "nb", aiApproval: "0".repeat(64) },
  });
  expect(response.status()).toBe(409);
  expect(await response.json()).toEqual({ code: "AI_APPROVAL_CHANGED" });
});

test("cross-origin and oversized requests are rejected", async ({ request }) => {
  const crossOrigin = await request.post("/api/jobs/requirements", {
    headers: { origin: "https://other.example" }, data: { text: source, locale: "nb" },
  });
  expect(crossOrigin.status()).toBe(403);
  const oversized = await request.post("/api/jobs/requirements", { data: { text: "x".repeat(100001), locale: "nb" } });
  expect(oversized.status()).toBe(413);
});

test("partial evidence is visible in both languages and valid cards remain usable", async ({ page }) => {
  await page.route("**/api/jobs/requirements", route => route.fulfill({ json: { ...result, omittedItems: 1 } }));
  await page.goto("/jobs/analyze");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse" }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  const omissions = page.locator(".analysis-quality-omissions");
  await expect(omissions.locator("summary")).toContainText("1 AI-forslag utelatt");
  await omissions.locator("summary").click();
  await expect(omissions).toContainText(/manglet et kontrollerbart sitat/);
  await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await expect(omissions).toContainText(/had no verifiable source quotation/);
});

test("advertisement retry can select Gemini without refetching source and displays the actual result model",async({page})=>{
 const groq={provider:"Groq",model:"openai/gpt-oss-20b"},gemini={provider:"Gemini",model:"gemini-3.5-flash"};
 const original={token:"b".repeat(64),selections:[groq]},alternative={token:"c".repeat(64),selections:[gemini]};const options=[{approval:original,available:true},{approval:alternative,available:true}];
 await page.route("**/api/ai/config",r=>r.fulfill({json:{tasks:{JOB_ANALYSIS:groq,DOCUMENT_EXTRACTION:groq,PROFILE_SUMMARY:groq,PERSONAL_MATCH:groq,CV_TAILORING:groq},documents:original,documentExcerpt:original,matching:original,job:original,options:{documents:options,documentExcerpt:options,matching:options,job:options}}}));
 let calls=0;
 await page.route("**/api/jobs/requirements",r=>{
  calls++;if(calls===1)return r.fulfill({status:429,headers:{"Retry-After":"968"},json:{code:"AI_RATE_LIMITED"}});
  expect(r.request().postDataJSON()).toEqual({text:source,locale:"nb",aiApproval:alternative.token});return r.fulfill({json:{...result,aiSelection:gemini}});
 });
 await page.goto("/jobs/analyze");await page.getByRole("button",{name:"Lim inn tekst",exact:true}).click();await page.getByRole("textbox",{name:"Stillingsannonse"}).fill(source);await page.getByRole("button",{name:"Analyser",exact:true}).click();
 await page.getByRole("button",{name:/Prøv med Gemini/}).click();expect(calls).toBe(1);
 await expect(page.getByRole("textbox",{name:"Stillingsannonse"})).toHaveValue(source);await page.getByRole("button",{name:"Analyser",exact:true}).click();
 await expect(page.locator(".ai-identity").filter({hasText:"Brukt i analysen"})).toContainText("Gemini · gemini-3.5-flash");expect(calls).toBe(2);
});

test("job analysis offers separate Groq and Gemini models for the analysis call",async({page})=>{
 const groq={provider:"Groq",model:"openai/gpt-oss-20b"},flash={provider:"Gemini",model:"gemini-3.5-flash"},lite={provider:"Gemini",model:"gemini-3.5-flash-lite"};
 const original={token:"a".repeat(64),selections:[groq]},flashApproval={token:"b".repeat(64),selections:[flash]},liteApproval={token:"c".repeat(64),selections:[lite]};
 const options=[{approval:original,available:true},{approval:flashApproval,available:true},{approval:liteApproval,available:true}];
 await page.route("**/api/ai/config",r=>r.fulfill({json:{tasks:{JOB_ANALYSIS:groq,DOCUMENT_EXTRACTION:groq,PROFILE_SUMMARY:groq,PERSONAL_MATCH:groq,CV_TAILORING:groq},documents:original,documentExcerpt:original,matching:original,job:original,options:{documents:options,documentExcerpt:options,matching:options,job:options}}}));
 let sentApproval="";
 await page.route("**/api/jobs/requirements",r=>{sentApproval=r.request().postDataJSON().aiApproval;return r.fulfill({json:{...result,aiSelection:lite}});});
 await page.goto("/jobs/analyze");
 await page.getByRole("combobox",{name:"Språk"}).selectOption("en");
 const heading=page.locator(".job-analysis-heading"),before=await heading.boundingBox();
 await page.locator('.ai-choice[data-choice-area="job"] summary').click();
 await expect.poll(async()=>{const b=await heading.boundingBox();return Math.round(b!.height);}).toBe(Math.round(before!.height));
 const optionsBox=await page.locator('.ai-choice[data-choice-area="job"] .ai-choice-options').boundingBox();
 expect(optionsBox!.width).toBeGreaterThan(250);expect(optionsBox!.x).toBeGreaterThanOrEqual(0);
 if(!process.env.CI)await page.screenshot({path:"/tmp/career-job-model-popup-desktop.png"});
 await page.locator('.ai-choice[data-choice-area="job"] summary').press("Escape");
 await page.setViewportSize({width:390,height:850});
 await page.locator('.ai-choice[data-choice-area="job"] summary').click();
 await expect.poll(async()=>{const b=await page.locator('.ai-choice[data-choice-area="job"] .ai-choice-options').boundingBox();return !!b&&b.x>=15&&b.x+b.width<=375;}).toBe(true);
 if(!process.env.CI)await page.screenshot({path:"/tmp/career-job-model-popup-mobile.png"});

 await expect(page.locator(".ai-choice-options")).toBeVisible();
 await expect(page.locator(".ai-choice-option")).toHaveCount(3);
 await page.getByRole("button",{name:/Gemini · gemini-3.5-flash-lite/}).click();
 await expect(page.locator(".ai-choice-options")).toBeHidden();
 await page.getByRole("button",{name:"Paste text",exact:true}).click();
 await page.getByRole("textbox",{name:"Job advertisement"}).fill(source);
 await page.getByRole("button",{name:"Analyze",exact:true}).click();
 await expect(page.locator(".ai-identity").filter({hasText:"Used in this analysis"})).toContainText("Gemini · gemini-3.5-flash-lite");
 expect(sentApproval).toBe(liteApproval.token);
});

function sourceModelConfiguration() {
 const groq={provider:"Groq",model:"openai/gpt-oss-20b"},gemini={provider:"Gemini",model:"gemini-3.8-flash"};
 const sourceSelections=[groq,{provider:"Groq",model:"openai/gpt-oss-120b"},...["gemini-3.5-flash-lite","gemini-3.5-flash","gemini-3.6-flash","gemini-3.7-flash","gemini-3.8-flash","gemini-3.1-flash-lite"].map(model=>({provider:"Gemini",model}))];
 const sourceOptions=sourceSelections.map((selection,index)=>({approval:{token:(index+1).toString(16).repeat(64),selections:[selection]},available:true}));
 const jobGroq={token:"f".repeat(64),selections:[groq]},jobGemini={token:"e".repeat(64),selections:[gemini]};
 const jobOptions=[{approval:jobGroq,available:true},{approval:jobGemini,available:true}];
 const configuration={
  tasks:{JOB_ANALYSIS:groq,DOCUMENT_EXTRACTION:groq,PROFILE_SUMMARY:groq,PERSONAL_MATCH:groq,CV_TAILORING:groq},
  sourceBrowser:groq,sourceRetrieval:sourceOptions[0].approval,documents:jobGroq,documentExcerpt:jobGroq,matching:jobGroq,job:jobGroq,
  options:{documents:jobOptions,documentExcerpt:jobOptions,matching:jobOptions,job:jobOptions,sourceRetrieval:sourceOptions}
 };
 return {configuration,sourceOptions,jobGroq,jobGemini};
}

test("source retrieval accepts a larger bounded model catalog and preserves private task limits",()=>{
 const {configuration,sourceOptions}=sourceModelConfiguration();
 expect(sourceOptions).toHaveLength(8);
 expect(isAiConfiguration(configuration)).toBe(true);
 const configuredOption={approval:{token:"9".repeat(64),selections:[{provider:"Gemini",model:"configured-source-model"}]},available:true};
 expect(isAiConfiguration({...configuration,options:{...configuration.options,sourceRetrieval:[...sourceOptions,configuredOption]}})).toBe(true);
 const expanded=Array.from({length:16},(_,index)=>({...sourceOptions[index%sourceOptions.length],approval:{...sourceOptions[index%sourceOptions.length].approval,token:index.toString(16).padStart(64,"0")}}));
 expect(isAiConfiguration({...configuration,options:{...configuration.options,sourceRetrieval:expanded}})).toBe(true);
 expect(isAiConfiguration({...configuration,options:{...configuration.options,sourceRetrieval:[...expanded,sourceOptions[0]]}})).toBe(false);
 expect(isAiConfiguration({...configuration,options:{...configuration.options,sourceRetrieval:[{...sourceOptions[0],approval:{...sourceOptions[0].approval,token:"invalid"}}]}})).toBe(false);
 for(const area of ["documents","documentExcerpt","matching","job","tailoring"]){
  expect(isAiConfiguration({...configuration,options:{...configuration.options,[area]:expanded.slice(0,10)}})).toBe(true);
  expect(isAiConfiguration({...configuration,options:{...configuration.options,[area]:expanded.slice(0,11)}})).toBe(false);
 }
});

test("FINN retrieval and requirement analysis have separate model approvals",async({page})=>{
 const {configuration,sourceOptions,jobGroq,jobGemini}=sourceModelConfiguration();
 expect(isAiConfiguration(configuration)).toBe(true);
 await page.route("**/api/ai/config",r=>r.fulfill({json:configuration}));
 const sourceApprovals=["gemini-3.5-flash-lite","gemini-3.7-flash"].map(model=>sourceOptions.find(option=>option.approval.selections[0].model===model)!.approval);
 const urls=["https://www.finn.no/job/ad/478077416","https://www.finn.no/job/ad/478077417"];
 const retrievalApprovals:string[]=[],analysisApprovals:string[]=[];
 await page.route("**/api/jobs/import",r=>{
  const index=retrievalApprovals.length,body=r.request().postDataJSON();
  expect(body).toEqual({url:urls[index],aiApproval:sourceApprovals[index].token});retrievalApprovals.push(body.aiApproval);
  return r.fulfill({json:{sourceUrl:body.url,title:"Backendutvikler",text:source,retrievedAt:"2026-10-07T00:00:00Z",sourceType:"GEMINI_URL_CONTEXT_EXCERPT",aiSelection:sourceApprovals[index].selections[0]}});
 });
 await page.route("**/api/jobs/requirements",r=>{
  const body=r.request().postDataJSON();expect(body).toEqual({text:source,locale:"nb",aiApproval:jobGemini.token});analysisApprovals.push(body.aiApproval);
  return r.fulfill({json:{...result,aiSelection:jobGemini.selections[0]}});
 });
 await page.goto("/jobs/analyze");
 const sourceChoice=page.locator('.ai-choice[data-choice-area="sourceRetrieval"]'),jobChoice=page.locator('.ai-choice[data-choice-area="job"]');
 const sourceChoiceMenu=sourceChoice.locator(".ai-choice-menu summary");
 await expect(sourceChoiceMenu).toBeVisible();await sourceChoiceMenu.click();
 await expect(sourceChoice.locator(".ai-choice-option strong")).toHaveText(sourceOptions.map(option=>{const selection=option.approval.selections[0];return `${selection.provider} · ${selection.model}`;}));
 await sourceChoiceMenu.press("Escape");
 await jobChoice.locator("summary").click();await jobChoice.getByText("Gemini · gemini-3.8-flash",{exact:true}).click();
 await expect(sourceChoice.locator(".ai-identity")).toContainText(jobGroq.selections[0].model);
 expect(retrievalApprovals).toEqual([]);expect(analysisApprovals).toEqual([]);
 for(const [index,approval] of sourceApprovals.entries()){
  await sourceChoiceMenu.click();await sourceChoice.getByText(`Gemini · ${approval.selections[0].model}`,{exact:true}).click();
  await expect(sourceChoice.locator(".ai-identity")).toContainText(approval.selections[0].model);
  await expect(jobChoice.locator(".ai-identity")).toContainText(jobGemini.selections[0].model);
  expect(retrievalApprovals).toHaveLength(index);expect(analysisApprovals).toHaveLength(index);
  await page.getByRole("textbox",{name:"Lenke til stillingsannonse"}).fill(urls[index]);await page.getByRole("button",{name:"Analyser lenke",exact:true}).click();
  await expect(page.locator(".analysis-result-identities .ai-identity").filter({hasText:"Kildeinnhenting"})).toContainText(approval.selections[0].model);
  await expect(page.locator(".analysis-result-identities .ai-identity").filter({hasText:"Brukt i analysen"})).toContainText(jobGemini.selections[0].model);
  await expect(page.locator(".analysis-quality-source")).toContainText("AI-forberedt utdrag");
  expect(retrievalApprovals).toEqual(sourceApprovals.slice(0,index+1).map(a=>a.token));expect(analysisApprovals).toEqual(Array(index+1).fill(jobGemini.token));
 }
});
