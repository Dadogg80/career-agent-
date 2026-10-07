import { expect, test, type Page } from "@playwright/test";
import { collectionExcerpts } from "../lib/document-excerpts";
import type { DocumentDetail } from "../lib/documents";
const id = "12345678-1234-1234-1234-123456789abc";
const second = "22345678-1234-1234-1234-123456789abc";
const time = "2026-10-07T00:00:00Z";
const document = { id, originalName:"synthetic-cv.docx", mediaType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document", byteSize:1024, sha256:"a".repeat(64), language:"nb" as const, isMaster:true, createdAt:time, textCharacters:41000, extractionMethod:"TEXT" as const };
async function identity(page: Page) {
  await page.route("**/api/auth/session", route => route.fulfill({ json:{ authenticated:true, loginAvailable:true, profilesAvailable:true, csrfToken:"synthetic-csrf" } }));
  await page.route("**/api/profile/me", route => route.fulfill({ json:{ id, displayName:"Synthetic Pilot", preferredLanguage:"nb", revision:1 } }));
}

test("bounded source selection redistributes short-document capacity and includes later experience", async () => {
  const long = "Opening skills\n" + "Synthetic experience paragraph.\n".repeat(1200) + "\nBuilt APIs with Kotlin at the end";
  const short = "Completed a PostgreSQL course with a synthetic certificate.";
  const sources: DocumentDetail[] = [{ document, text:long }, { document:{ ...document, id:second, textCharacters:short.length }, text:short }];
  const excerpts = collectionExcerpts(sources);
  expect(Object.values(excerpts).reduce((sum,text) => sum+text.length,0)).toBeLessThanOrEqual(12000);
  expect(excerpts[id].length).toBeGreaterThan(11000);
  expect(excerpts[id]).toContain("Opening skills"); expect(excerpts[id]).toContain("Built APIs with Kotlin at the end");
  expect(excerpts[second]).toBe(short);
});

test("competency search combines context with status filters and separates confirmed facts from review work", async ({ page }) => {
  await identity(page);
  const claims = [
    { id, skill:"Kotlin", statement:"Built APIs and wrote integration tests.", context:"Bank project", sourceNote:"CV: synthetic-cv.docx", sourceDocumentId:id, sourceQuote:"Built APIs", status:"CONFIRMED", revision:2, createdAt:time, updatedAt:time },
    { id:second, skill:"Kotlin", statement:"Completed a Kotlin course.", context:"Course", sourceNote:"Certificate", status:"UNVERIFIED", revision:1, createdAt:time, updatedAt:time },
    { id:"32345678-1234-1234-1234-123456789abc", skill:"React", statement:"Implemented user interfaces.", context:"Bank project", sourceNote:"Recollection", status:"UNVERIFIED", revision:1, createdAt:time, updatedAt:time },
  ];
  await page.route("**/api/profile/me/claims", route => route.fulfill({ json:claims }));
  await page.route("**/api/profile/me/documents", route => route.fulfill({ json:[document] }));
  await page.goto("/career/profile");
  const panel = page.locator("#profile-competencies");
  await expect(panel.locator(".competency-stats")).toContainText("Kompetanseområder");
  await expect(panel.getByRole("article")).toHaveCount(3);
  await panel.getByRole("textbox", { name:"Søk i kompetanse", exact:true }).fill("Bank project");
  await expect(panel.getByRole("article")).toHaveCount(2);
  await panel.getByRole("button", { name:"Bekreftet (1)", exact:true }).click();
  await expect(panel.getByRole("article")).toHaveCount(1);
  await panel.getByRole("textbox", { name:"Søk i kompetanse", exact:true }).fill("no match");
  await expect(panel.getByText("Ingen opplysninger i denne kategorien.", { exact:true })).toBeVisible();
  await panel.getByRole("textbox", { name:"Søk i kompetanse", exact:true }).fill("");
  await panel.getByRole("button", { name:"Alle (3)", exact:true }).click();
  await page.screenshot({ path:"/tmp/competency-workspace-desktop.png", fullPage:true });
  await page.setViewportSize({ width:390, height:844 });
  expect(await page.evaluate(() => window.document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path:"/tmp/competency-workspace-mobile.png", fullPage:true });
});

test("combined analysis covers later passages and renders more than ten proposals without confirming them", async ({ page }) => {
  await identity(page); let calls = 0; let stored: object | null = null;
  const source = "Opening skills\n" + "Synthetic project experience.\n".repeat(1000) + "\nBuilt APIs with Kotlin at the end";
  const course = "Completed a PostgreSQL course with a synthetic certificate.";
  await page.route("**/api/profile/me/claims", route => route.fulfill({ json:[] }));
  await page.route("**/api/profile/me/documents**", route => {
    const url = route.request().url();
    if (url.endsWith("/analysis")) {
      if (route.request().method() === "GET") return route.fulfill({ json:stored });
      calls++; const input = route.request().postDataJSON();
      expect(input.documents[0].text).toContain("Built APIs with Kotlin at the end");
      expect(input.documents[0].text.length).toBeGreaterThan(11000);
      expect(input.documents.reduce((sum:number, item:{text:string}) => sum+item.text.length,0)).toBeLessThanOrEqual(12000);
      stored = { id:second, locale:"nb", provider:"Groq", summary:[{ text:"API development supported by the CV", quote:"Built APIs with Kotlin", documentId:id }],
        suggestions:Array.from({ length:16 }, (_,index) => ({ skill:index === 15 ? "Kotlin" : `Explicit skill ${index+1}`, statement:"Document describes API development", context:"Synthetic project", quote:"Built APIs with Kotlin", documentId:id })),
        inputCharacters:input.documents.reduce((sum:number, item:{text:string}) => sum+item.text.length,0), sourceCharacters:source.length+course.length, partial:true, omittedItems:0, createdAt:time,
        documents:[{ documentId:id, originalName:document.originalName, inputCharacters:input.documents[0].text.length, sourceCharacters:source.length }, { documentId:second, originalName:"synthetic-course.docx", inputCharacters:course.length, sourceCharacters:course.length }] };
      return route.fulfill({ json:stored });
    }
    if (url.endsWith(id)) return route.fulfill({ json:{ document:{ ...document, textCharacters:source.length }, text:source } });
    if (url.endsWith(second)) return route.fulfill({ json:{ document:{ ...document, id:second, originalName:"synthetic-course.docx", textCharacters:course.length }, text:course } });
    return route.fulfill({ json:[{ ...document, textCharacters:source.length }, { ...document, id:second, originalName:"synthetic-course.docx", textCharacters:course.length }] });
  });
  await page.goto("/career/profile");
  await page.getByRole("button", { name:"Oppsummer alle dokumentene med AI", exact:true }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("checkbox").check(); await sheet.getByRole("button", { name:"Oppsummer kompetansen med AI", exact:true }).click();
  await expect(sheet.getByRole("button", { name:"Se gjennom dette forslaget", exact:true })).toHaveCount(16);
  await sheet.getByRole("textbox", { name:"Søk i AI-forslag", exact:true }).fill("Kotlin");
  await expect(sheet.getByRole("button", { name:"Se gjennom dette forslaget", exact:true })).toHaveCount(1);
  expect(calls).toBe(1);
  await page.screenshot({ path:"/tmp/competency-analysis-desktop.png", fullPage:false });
  await page.setViewportSize({ width:390, height:844 });
  expect(await page.evaluate(() => window.document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await sheet.getByRole("button", { name:"Se gjennom dette forslaget", exact:true }).click();
  await expect(sheet.getByLabel("Kompetanse", { exact:true })).toHaveValue("Kotlin");
  await expect(sheet.getByLabel("Valgt kildesitat", { exact:true })).toHaveValue("Built APIs with Kotlin");
});

test("unreadable PDF can be reread with local OCR while errors preserve originals and successful text needs separate AI consent", async ({ page, request }) => {
  await identity(page); let attempts = 0; let source = "";
  const pdf = { ...document, originalName:"synthetic-scan.pdf", mediaType:"application/pdf", textCharacters:0 };
  await page.route("**/api/profile/me/claims", route => route.fulfill({ json:[] }));
  await page.route("**/api/profile/me/documents**", route => {
    const url = route.request().url();
    if (url.endsWith("/reread")) {
      expect(route.request().headers()["x-csrf-token"]).toBe("synthetic-csrf"); expect(route.request().postDataJSON()).toEqual({ ocr:true }); attempts++;
      if (attempts === 1) return route.fulfill({ status:503, json:{ code:"DOCUMENT_OCR_UNAVAILABLE" } });
      source = "Built APIs with Kotlin in a synthetic scanned certificate.";
      return route.fulfill({ json:{ document:{ ...pdf, textCharacters:source.length, extractionMethod:"OCR" }, text:source } });
    }
    if (url.endsWith("/analysis")) return route.fulfill({ json:null });
    return route.fulfill({ json:url.endsWith(id) ? { document:{ ...pdf, textCharacters:source.length, extractionMethod:source ? "OCR" : "TEXT" }, text:source } : [{ ...pdf, textCharacters:source.length }] });
  });
  await page.goto("/career/profile");
  await expect(page.locator("#profile-documents")).toContainText("Ingen lesbar tekst · prøv OCR");
  await page.getByRole("button", { name:"Se tekst og legg til kompetanse", exact:true }).click();
  const sheet = page.getByRole("dialog"); const reread = sheet.getByRole("button", { name:"Les skannet PDF med OCR", exact:true });
  await reread.click(); await expect(sheet.getByRole("alert")).toContainText("Installer Tesseract");
  await reread.click();
  await expect(sheet.getByLabel("Tekst som sendes til Groq", { exact:true })).toHaveValue(source);
  await expect(sheet.getByRole("button", { name:"Oppsummer kompetansen med AI", exact:true })).toBeDisabled();
  expect(attempts).toBe(2);
  const path = `/api/profile/me/documents/${id}/reread`;
  expect((await request.post(path, { data:{ ocr:true } })).status()).toBe(403);
  expect((await request.post(path, { data:{ ocr:true, text:"spoofed" } })).status()).toBe(400);
  expect((await request.post(path, { headers:{ Origin:"https://other.example" }, data:{ ocr:true } })).status()).toBe(403);
});
