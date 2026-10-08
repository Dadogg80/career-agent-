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
  await page.goto("/career/profile"); await page.getByRole("button", {name:"Din kompetanse",exact:true}).click();
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

test("combined workflow sends every selected source including late passages and keeps proposals searchable",async({page})=>{
 await identity(page);const source="## Example AS\n"+"Synthetic project experience.\n".repeat(1000)+"Built APIs with Kotlin at the end";const course="Completed a PostgreSQL course with a synthetic certificate.";let starts=0;
 const analysis={id:second,locale:"nb",provider:"Groq",summary:[],profile:[],careerEntries:[],suggestions:Array.from({length:16},(_,i)=>({skill:i===15?"Kotlin":`Explicit skill ${i+1}`,statement:"Document describes API development",context:"Example AS",quote:"Built APIs with Kotlin",documentId:id})),inputCharacters:source.length+course.length,sourceCharacters:source.length+course.length,partial:false,omittedItems:0,createdAt:time,documents:[{documentId:id,originalName:document.originalName,inputCharacters:source.length,sourceCharacters:source.length},{documentId:second,originalName:"synthetic-course.docx",inputCharacters:course.length,sourceCharacters:course.length}]};
 const run={id:second,scope:"collection",revision:2,status:"COMPLETED",completedBatches:10,totalBatches:10,nextAt:null,issue:null,analysis};
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[]}));await page.route("**/api/profile/me/documents**",r=>{
  const url=r.request().url();if(url.includes("/workflow")){if(r.request().method()==="POST"){starts++;const input=r.request().postDataJSON();expect(input.documents[0].text).toBe(source);expect(input.documents[1].text).toBe(course);expect(input.documents[0].text.length).toBeGreaterThan(12000);return r.fulfill({json:run});}return r.fulfill({json:null});}
  if(url.endsWith(id))return r.fulfill({json:{document,text:source}});if(url.endsWith(second))return r.fulfill({json:{document:{...document,id:second,originalName:"synthetic-course.docx"},text:course}});return r.fulfill({json:[document,{...document,id:second,originalName:"synthetic-course.docx"}]});
 });
 await page.goto("/career/profile");await page.getByRole("button",{name:"Oppsummer alle dokumentene med AI",exact:true}).click();const sheet=page.locator(".document-workspace-sheet");await sheet.getByRole("checkbox",{name:"Jeg godkjenner at valgt tekst sendes til Groq for denne analysen"}).check();await sheet.getByRole("button",{name:"Bygg profil fra dokumentene",exact:true}).click();await expect(sheet.getByRole("button",{name:"Se gjennom",exact:true})).toHaveCount(16);await sheet.getByLabel("Søk i AI-forslag",{exact:true}).fill("Kotlin");await expect(sheet.getByRole("button",{name:"Se gjennom",exact:true})).toHaveCount(1);expect(starts).toBe(1);
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
  await page.goto("/career/profile"); await page.getByRole("button", {name:"Din kompetanse",exact:true}).click();
  await expect(page.locator("#profile-documents")).toContainText("Ingen lesbar tekst · prøv OCR");
  await page.getByRole("button", {name:"Dokumenter og AI-profil",exact:true}).click(); await page.getByRole("button", { name:"Analyser dokumentet", exact:true }).click();
  const sheet = page.getByRole("dialog"); const reread = sheet.getByRole("button", { name:"Les skannet PDF med OCR", exact:true });
  await reread.click(); await expect(sheet.getByRole("alert")).toContainText("Installer Tesseract");
  await reread.click();
  await sheet.locator(".source-review-tile > summary").click(); await expect(sheet.getByLabel("Tekst som sendes fra synthetic-scan.pdf", { exact:true })).toHaveValue(source);
  await expect(sheet.getByRole("button", { name:"Bygg profil fra dokumentene", exact:true })).toBeDisabled();
  expect(attempts).toBe(2);
  const path = `/api/profile/me/documents/${id}/reread`;
  expect((await request.post(path, { data:{ ocr:true } })).status()).toBe(403);
  expect((await request.post(path, { data:{ ocr:true, text:"spoofed" } })).status()).toBe(400);
  expect((await request.post(path, { headers:{ Origin:"https://other.example" }, data:{ ocr:true } })).status()).toBe(403);
});

test("all supporting documents remain inspectable for one competency with their employer context",async({page})=>{
 const competency={id,skill:"Kotlin",statement:"Built Kotlin APIs",context:"Example AS",sourceNote:"Document: original.md",sourceDocumentId:id,sourceQuote:"Built Kotlin APIs",status:"CONFIRMED",revision:2,createdAt:time,updatedAt:time};
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));await page.route("**/api/profile/me",r=>r.fulfill({json:{id,displayName:"Fictional Pilot",preferredLanguage:"nb",revision:1}}));await page.route("**/api/profile/me/documents",r=>r.fulfill({json:[]}));await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[competency]}));
 await page.route(`**/api/profile/me/claims/${id}/evidence`,r=>r.fulfill({json:[{id,documentId:id,originalName:"original.md",statement:competency.statement,context:competency.context,quote:"Built Kotlin APIs",recordedAt:time},{id:second,documentId:null,originalName:"certificate.txt",statement:competency.statement,context:competency.context,quote:"Kotlin APIs at Example AS",recordedAt:time}]}));
 await page.goto("/career/profile"); await page.getByRole("button", {name:"Din kompetanse",exact:true}).click();const tile=page.getByRole("article",{name:"Kotlin",exact:true});await tile.locator("summary").click();await tile.getByRole("button",{name:"Se alle dokumentkilder",exact:true}).click();await expect(tile).toContainText("certificate.txt · originalen er slettet");await expect(tile.getByText("Kotlin APIs at Example AS",{exact:true})).toBeVisible();await expect(page.locator(".claim-tile")).toHaveCount(1);
});
