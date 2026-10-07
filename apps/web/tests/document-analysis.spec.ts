import { expect, test } from "@playwright/test";
const first = "12345678-1234-1234-1234-123456789abc";
const second = "22345678-1234-1234-1234-123456789abc";
const third = "32345678-1234-1234-1234-123456789abc";
const analysisId = "42345678-1234-1234-1234-123456789abc";
const time = "2026-10-07T00:00:00Z";
const texts: Record<string, string> = { [first]:"Private contact: remove this line.\nBuilt APIs with Kotlin for a synthetic project.", [second]:"Completed a PostgreSQL course with a synthetic certificate.", [third]:"" };
const docs = [first, second, third].map((id, index) => ({ id, originalName:["synthetic-cv.docx", "course.docx", "scan.pdf"][index], mediaType:index === 2 ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document", byteSize:1024, sha256:"a".repeat(64), language:"nb", isMaster:index === 0, createdAt:time }));
const suggestion = { skill:"Kotlin", statement:"Built APIs with Kotlin", context:"Synthetic project", quote:"Built APIs with Kotlin" };
const result = { id:analysisId, locale:"nb", provider:"Groq", summary:[{ text:"API development with Kotlin", quote:suggestion.quote }], suggestions:[suggestion], inputCharacters:texts[first].length, sourceCharacters:texts[first].length, partial:false, omittedItems:0, createdAt:time, documents:[] as object[] };

test("single-document analysis is opt-in, uses reviewed text, reopens its summary and saves only an unverified draft", async ({ page }) => {
  let stored: typeof result | null = null; let calls = 0; let claim: object | null = null;
  const consoleMessages: string[] = []; page.on("console", message => consoleMessages.push(message.text()));
  await page.route("**/api/auth/session", route => route.fulfill({ json:{ authenticated:true, loginAvailable:true, profilesAvailable:true, csrfToken:"synthetic-csrf" } }));
  await page.route("**/api/profile/me", route => route.fulfill({ json:{ id:first, displayName:"Synthetic Pilot", preferredLanguage:"nb", revision:1 } }));
  await page.route("**/api/profile/me/claims", route => route.fulfill({ json:claim ? [claim] : [] }));
  await page.route("**/api/profile/me/documents**", route => {
    const url = route.request().url(); const method = route.request().method();
    if (url.endsWith("/analysis")) {
      if (method === "GET") return route.fulfill({ json:stored });
      calls++; const input = route.request().postDataJSON();
      expect(input).toEqual({ text:"Built APIs with Kotlin for a synthetic project.", locale:"nb", consent:true });
      expect(route.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");
      stored = { ...result, partial:true, inputCharacters:input.text.length }; return route.fulfill({ json:stored });
    }
    if (url.endsWith("/claims")) {
      const input = route.request().postDataJSON(); expect(input.analysisId).toBe(analysisId); expect(input.status).toBeUndefined(); expect(input.documentId).toBeUndefined();
      claim = { ...input, id:second, sourceNote:"AI-assisted CV: synthetic-cv.docx", sourceDocumentId:first, sourceQuote:input.quote, status:"UNVERIFIED", revision:1, createdAt:time, updatedAt:time }; return route.fulfill({ json:claim });
    }
    return route.fulfill({ json:url.endsWith(first) ? { document:docs[0], text:texts[first] } : [docs[0]] });
  });
  await page.goto("/career/profile");
  await page.getByRole("button", { name:"Se tekst og legg til kompetanse", exact:true }).click();
  const dialog = page.getByRole("dialog"); const submit = dialog.getByRole("button", { name:"Oppsummer kompetansen med AI", exact:true });
  await expect(submit).toBeDisabled(); expect(calls).toBe(0);
  const consent = dialog.getByRole("checkbox"); await consent.check();
  await dialog.getByLabel("Tekst som sendes til Groq", { exact:true }).fill("Built APIs with Kotlin for a synthetic project.");
  await expect(consent).not.toBeChecked(); await expect(submit).toBeDisabled(); await consent.check(); await submit.click();
  await expect(dialog.getByRole("region", { name:"Kompetansesammendrag" })).toContainText("API development with Kotlin"); expect(calls).toBe(1); expect(claim).toBeNull();
  await dialog.getByRole("button", { name:"Lukk", exact:true }).click();
  await page.getByRole("button", { name:"Se tekst og legg til kompetanse", exact:true }).click();
  await expect(dialog.getByRole("region", { name:"Kompetansesammendrag" })).toBeVisible(); expect(calls).toBe(1);
  await dialog.getByRole("button", { name:"Se gjennom dette forslaget", exact:true }).click();
  await expect(dialog.getByLabel("Kompetanse", { exact:true })).toHaveValue("Kotlin");
  await dialog.getByRole("button", { name:"Lagre som ubekreftet kompetanse", exact:true }).click();
  await expect(page.getByRole("article", { name:"Kotlin", exact:true }).locator('[data-claim-status="UNVERIFIED"]')).toBeVisible();
  expect(consoleMessages.some(message => message.includes("Private contact") || message.includes("Built APIs"))).toBe(false);
});

test("combined analysis includes readable CV and course evidence in one request and excludes unreadable scans explicitly", async ({ page }) => {
  let calls = 0; let stored: object | null = null;
  await page.route("**/api/auth/session", route => route.fulfill({ json:{ authenticated:true, loginAvailable:true, profilesAvailable:true, csrfToken:"synthetic-csrf" } }));
  await page.route("**/api/profile/me", route => route.fulfill({ json:{ id:first, displayName:"Synthetic Pilot", preferredLanguage:"nb", revision:1 } }));
  await page.route("**/api/profile/me/claims", route => route.fulfill({ json:[] }));
  await page.route("**/api/profile/me/documents**", route => {
    const url = route.request().url();
    if (url.endsWith("/analysis")) {
      if (route.request().method() === "GET") return route.fulfill({ json:stored });
      calls++; const input = route.request().postDataJSON();
      expect(input.documents).toEqual([{ documentId:first, text:texts[first] }, { documentId:second, text:texts[second] }]);
      stored = { ...result, summary:[{ ...result.summary[0], documentId:first }], suggestions:[{ skill:"PostgreSQL", statement:"Completed a PostgreSQL course", context:"Course", quote:"Completed a PostgreSQL course", documentId:second }], sourceCharacters:texts[first].length+texts[second].length, inputCharacters:texts[first].length+texts[second].length, partial:true,
        documents:docs.slice(0,2).map(doc => ({ documentId:doc.id, originalName:doc.originalName, inputCharacters:texts[doc.id].length, sourceCharacters:texts[doc.id].length })) };
      return route.fulfill({ json:stored });
    }
    const document = docs.find(doc => url.endsWith(doc.id)); return route.fulfill({ json:document ? { document, text:texts[document.id] } : docs });
  });
  await page.setViewportSize({ width:390, height:844 });
  await page.goto("/career/profile"); await page.getByRole("button", { name:"Oppsummer alle dokumentene med AI", exact:true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Tekst som sendes til Groq: synthetic-cv.docx", { exact:true })).toHaveValue(texts[first]);
  await expect(dialog.getByLabel("Tekst som sendes til Groq: course.docx", { exact:true })).toHaveValue(texts[second]);
  await expect(dialog).toContainText("Ingen lesbar tekst; dette dokumentet sendes ikke til AI.");
  await dialog.getByRole("checkbox").check(); await dialog.getByRole("button", { name:"Oppsummer kompetansen med AI", exact:true }).click();
  const suggestions = dialog.getByRole("region", { name:"Kompetanseforslag", exact:true });
  await expect(suggestions).toContainText("course.docx"); expect(calls).toBe(1);
  await suggestions.locator("summary").click(); await expect(suggestions.getByText("Completed a PostgreSQL course", { exact:true }).last()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path:"/tmp/career-combined-analysis-mobile.png", fullPage:true });
  await suggestions.getByRole("button", { name:"Se gjennom dette forslaget", exact:true }).click();
  await expect(dialog.getByRole("heading", { name:"course.docx", exact:true })).toBeVisible();
  await expect(dialog.getByLabel("Kompetanse", { exact:true })).toHaveValue("PostgreSQL");
  await expect(dialog.getByLabel("Valgt kildesitat", { exact:true })).toHaveValue("Completed a PostgreSQL course");
});

test("quota and invalid AI replies preserve previous analysis without automatically retrying and translate to English", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/auth/session", route => route.fulfill({ json:{ authenticated:true, loginAvailable:true, profilesAvailable:true, csrfToken:"synthetic-csrf" } }));
  await page.route("**/api/profile/me", route => route.fulfill({ json:{ id:first, displayName:"Synthetic Pilot", preferredLanguage:"nb", revision:1 } }));
  await page.route("**/api/profile/me/claims", route => route.fulfill({ json:[] }));
  await page.route("**/api/profile/me/documents**", route => {
    const url = route.request().url();
    if (url.endsWith("/analysis")) {
      if (route.request().method() === "GET") return route.fulfill({ json:result });
      calls++; return calls === 1 ? route.fulfill({ status:429, headers:{ "Retry-After":"2" }, json:{ code:"AI_RATE_LIMITED" } }) : route.fulfill({ status:502, json:{ code:"AI_INVALID_RESULT" } });
    }
    return route.fulfill({ json:url.endsWith(first) ? { document:docs[0], text:texts[first] } : [docs[0]] });
  });
  await page.goto("/career/profile"); await page.getByRole("combobox", { name:"Språk", exact:true }).selectOption("en");
  await page.getByRole("button", { name:"Read text and add competency", exact:true }).click(); const dialog = page.getByRole("dialog");
  const submit = dialog.getByRole("button", { name:"Summarize competencies with AI", exact:true });
  await dialog.getByRole("checkbox").check(); await submit.click();
  await expect(dialog.getByRole("alert")).toContainText("Groq quota reached"); await expect(submit).toBeDisabled();
  await expect(submit).toBeEnabled({ timeout:5000 }); expect(calls).toBe(1);
  await submit.click(); await expect(dialog.getByRole("alert")).toContainText("AI response could not be checked");
  await expect(dialog.getByRole("region", { name:"Competency summary" })).toContainText("API development with Kotlin"); expect(calls).toBe(2);
});

test("private analysis proxies reject missing approval cross-origin spoofing oversized inputs and anonymous access", async ({ request }) => {
  const path = `/api/profile/me/documents/${first}/analysis`;
  expect((await request.get(path)).status()).toBe(401);
  expect((await request.get("/api/profile/me/documents/analysis")).status()).toBe(401);
  const body = { text:texts[first], locale:"nb", consent:true };
  expect((await request.post(path, { data:{ ...body, consent:false } })).status()).toBe(400);
  expect((await request.post(path, { headers:{ Origin:"https://other.example" }, data:body })).status()).toBe(403);
  expect((await request.post(path, { data:{ ...body, ownerId:second } })).status()).toBe(400);
  expect((await request.post(path, { data:{ ...body, text:"x".repeat(12001) } })).status()).toBe(400);
  expect((await request.post("/api/profile/me/documents/analysis", { data:{ documents:[{ documentId:first, text:texts[first] }, { documentId:first, text:texts[first] }], locale:"nb", consent:true } })).status()).toBe(400);
});
