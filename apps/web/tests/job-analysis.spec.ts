import { expect, test } from "@playwright/test";

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
 await page.route("**/api/ai/config",r=>r.fulfill({json:{tasks:{JOB_ANALYSIS:groq,DOCUMENT_EXTRACTION:groq,PROFILE_SUMMARY:groq,PERSONAL_MATCH:groq},documents:original,documentExcerpt:original,matching:original,job:original,options:{documents:options,documentExcerpt:options,matching:options,job:options}}}));
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
 await page.route("**/api/ai/config",r=>r.fulfill({json:{tasks:{JOB_ANALYSIS:groq,DOCUMENT_EXTRACTION:groq,PROFILE_SUMMARY:groq,PERSONAL_MATCH:groq},documents:original,documentExcerpt:original,matching:original,job:original,options:{documents:options,documentExcerpt:options,matching:options,job:options}}}));
 let sentApproval="";
 await page.route("**/api/jobs/requirements",r=>{sentApproval=r.request().postDataJSON().aiApproval;return r.fulfill({json:{...result,aiSelection:lite}});});
 await page.goto("/jobs/analyze");
 await page.getByRole("combobox",{name:"Språk"}).selectOption("en");
 await page.locator('.ai-choice[data-choice-area="job"] summary').click();
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

test("FINN retrieval and requirement analysis have separate model approvals",async({page})=>{
 const groq={provider:"Groq",model:"openai/gpt-oss-20b"},gemini={provider:"Gemini",model:"gemini-3.8-flash"};
 const sourceGroq={token:"d".repeat(64),selections:[groq]},sourceGemini={token:"e".repeat(64),selections:[gemini]};
 const jobGroq={token:"f".repeat(64),selections:[groq]},jobGemini={token:"1".repeat(64),selections:[gemini]};
 const sourceOptions=[{approval:sourceGroq,available:true},{approval:sourceGemini,available:true}];
 const jobOptions=[{approval:jobGroq,available:true},{approval:jobGemini,available:true}];
 await page.route("**/api/ai/config",r=>r.fulfill({json:{
  tasks:{JOB_ANALYSIS:groq,DOCUMENT_EXTRACTION:groq,PROFILE_SUMMARY:groq,PERSONAL_MATCH:groq},
  sourceBrowser:groq,sourceRetrieval:sourceGroq,documents:jobGroq,documentExcerpt:jobGroq,matching:jobGroq,job:jobGroq,
  options:{documents:jobOptions,documentExcerpt:jobOptions,matching:jobOptions,job:jobOptions,sourceRetrieval:sourceOptions}
 }}));
 const finn="https://www.finn.no/job/ad/478077416";
 let retrievalApproval="",analysisApproval="";
 await page.route("**/api/jobs/import",r=>{
  retrievalApproval=r.request().postDataJSON().aiApproval;
  return r.fulfill({json:{sourceUrl:finn,title:"Backendutvikler",text:source,retrievedAt:"2026-10-07T00:00:00Z",sourceType:"GEMINI_URL_CONTEXT_EXCERPT",aiSelection:gemini}});
 });
 await page.route("**/api/jobs/requirements",r=>{
  analysisApproval=r.request().postDataJSON().aiApproval;
  return r.fulfill({json:{...result,aiSelection:gemini}});
 });
 await page.goto("/jobs/analyze");
 const sourceChoiceMenu = page.locator('.ai-choice[data-choice-area="sourceRetrieval"] .ai-choice-menu summary');
 await expect(sourceChoiceMenu).toBeVisible();
 await sourceChoiceMenu.click();
 await page.locator('.ai-choice[data-choice-area="sourceRetrieval"] .ai-choice-option').filter({hasText:"gemini-3.8-flash"}).click();
 await page.locator('.ai-choice[data-choice-area="job"] summary').click();
 await page.locator('.ai-choice[data-choice-area="job"] .ai-choice-option').filter({hasText:"gemini-3.8-flash"}).click();
 await page.getByRole("textbox",{name:"Lenke til stillingsannonse"}).fill(finn);
 await page.getByRole("button",{name:"Analyser lenke",exact:true}).click();
 await expect(page.locator(".analysis-quality-source")).toContainText("AI-forberedt utdrag");
 expect(retrievalApproval).toBe(sourceGemini.token);
 expect(analysisApproval).toBe(jobGemini.token);
});
