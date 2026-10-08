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
  await expect(page.getByRole("listitem").getByText("Må-krav", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Se detaljer: Kotlin", exact: true }).click();
  await expect(page.locator("blockquote")).toHaveText("Du må ha erfaring med Kotlin.");
  await page.keyboard.press("Escape");
  await page.getByRole("textbox", { name: "Stillingsannonse" }).fill(source + " Ny tekst.");
  await expect(page.getByRole("region", { name: "Analyser en stillingsannonse" }).getByRole("alert")).toContainText("Annonsen er endret");
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

test("real browser proxy reaches the backend and reports missing configuration", async ({ page }) => {
  await page.goto("/jobs/analyze");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse" }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  await expect(page.locator(".workflow-notice")).toContainText("Automatisk sortering er ikke tilgjengelig");
  await expect(page.getByRole("textbox", { name: "Stillingsannonse" })).toHaveValue(source);
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
  await expect(page.getByText(/Noen AI-forslag/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await expect(page.getByText(/Some AI suggestions/)).toBeVisible();
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
 await page.getByRole("button",{name:"Prøv med Gemini",exact:true}).click();expect(calls).toBe(1);
 await expect(page.getByRole("textbox",{name:"Stillingsannonse"})).toHaveValue(source);await page.getByRole("button",{name:"Analyser",exact:true}).click();
 await expect(page.locator(".ai-identity").filter({hasText:"Brukt i analysen"})).toContainText("Gemini · gemini-3.5-flash");expect(calls).toBe(2);
});
