import { expect, test } from "@playwright/test";
const id = "12345678-1234-1234-1234-123456789abc";
const text = "Synthetic CV\nBuilt APIs with Kotlin\nProject example";
const original = { id, originalName:"synthetic.docx", mediaType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document", byteSize:1024, sha256:"a".repeat(64), language:"nb", isMaster:false, createdAt:"2026-10-07T00:00:00Z" };
test("upload retains the source, selecting a CV quote creates an unverified claim, and document deletion needs approval", async ({ page }) => {
  let document: typeof original | null = null; let claim: Record<string, unknown> | null = null; let uploads = 0; let deletes = 0;
  await page.route("**/api/auth/session", route => route.fulfill({ json:{ authenticated:true, loginAvailable:true, profilesAvailable:true, csrfToken:"synthetic-csrf" } }));
  await page.route("**/api/profile/me", route => route.fulfill({ json:{ id, displayName:"Synthetic Pilot", preferredLanguage:"nb", revision:1 } }));
  await page.route("**/api/profile/me/claims", route => route.fulfill({ json:claim ? [claim] : [] }));
  await page.route("**/api/profile/me/documents**", route => {
    const method = route.request().method(); const url = route.request().url();
    if (url.includes("/workflow")) return route.fulfill({ json:null });
    if (method === "GET") return route.fulfill({ json:url.endsWith(id) ? { document, text } : document ? [document] : [] });
    expect(route.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");
    if (method === "DELETE") { deletes++; document = null; return route.fulfill({ status:204 }); }
    if (url.endsWith("/master")) { document = { ...document!, isMaster:true }; return route.fulfill({ json:document }); }
    if (url.endsWith("/claims")) {
      const body = route.request().postDataJSON(); expect(body.quote).toBe("Built APIs with Kotlin"); expect(body.status).toBeUndefined();
      claim = { ...body, id, sourceNote:"CV: synthetic.docx", sourceDocumentId:id, sourceQuote:body.quote, status:"UNVERIFIED", revision:1, createdAt:original.createdAt, updatedAt:original.createdAt }; return route.fulfill({ json:claim });
    }
    uploads++; expect(route.request().headers()["content-type"]).toContain("multipart/form-data"); document = { ...original }; return route.fulfill({ json:document });
  });
  await page.setViewportSize({ width:390, height:844 });
  await page.goto("/career/profile");
  await page.getByLabel("Dokumentfil", { exact:true }).setInputFiles({ name:"synthetic.docx", mimeType:original.mediaType, buffer:Buffer.from("synthetic fixture") });
  await page.getByRole("button", { name:"Last opp dokument", exact:true }).click();
  const card = page.getByRole("article", { name:"synthetic.docx", exact:true });
  await expect(card).toBeVisible(); expect(uploads).toBe(1);
  await card.getByRole("button", { name:"Bruk som master-CV", exact:true }).click();
  await expect(card.getByText("Master-CV", { exact:true })).toBeVisible();
  await card.getByRole("button", { name:"Analyser dokumentet", exact:true }).click();
  const dialog = page.getByRole("dialog"); const source = dialog.getByRole("textbox", { name:"Tekst hentet fra dokumentet", exact:true });
  await dialog.locator(".manual-source-tools > summary").click();
  await expect(source).toHaveValue(text);
  await source.evaluate(element => { const field = element as HTMLTextAreaElement; const start = field.value.indexOf("Built APIs"); field.setSelectionRange(start, start + "Built APIs with Kotlin".length); });
  await dialog.getByRole("button", { name:"Bruk valgt tekst", exact:true }).click();
  await expect(dialog.getByRole("textbox", { name:"Valgt kildesitat", exact:true })).toHaveValue("Built APIs with Kotlin");
  await dialog.getByRole("textbox", { name:"Kompetanse", exact:true }).fill("Kotlin");
  await dialog.getByRole("textbox", { name:"Prosjekt eller arbeidsforhold", exact:true }).fill("Synthetic project");
  await dialog.getByRole("button", { name:"Lagre som ubekreftet kompetanse", exact:true }).click();
  await page.getByRole("button", {name:"Din kompetanse",exact:true}).click(); await expect(page.getByRole("article", { name:"Kotlin", exact:true }).locator('[data-claim-status="UNVERIFIED"]')).toBeVisible();
  expect(await page.evaluate(() => window.document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path:"/tmp/career-profile-documents-mobile.png", fullPage:true });
  await page.getByRole("combobox", { name:"Språk", exact:true }).selectOption("en");
  await page.getByRole("button", {name:"Documents and AI profile",exact:true}).click(); await card.getByRole("button", { name:"Delete", exact:true }).click(); expect(deletes).toBe(0);
  await expect(dialog).toContainText("Competencies and history you created are retained");
  await dialog.getByRole("button", { name:"Permanently delete document", exact:true }).click();
  await expect(page.getByText("Build your document sources. Start with your CV, then add certificates and employment attestations.", { exact:true })).toBeVisible(); expect(deletes).toBe(1);
});
test("private document proxy rejects cross-origin and ownership injection and never serves anonymous originals", async ({ request }) => {
  expect((await request.get("/api/profile/me/documents")).status()).toBe(401);
  expect((await request.get(`/api/profile/me/documents/${id}/original`)).status()).toBe(401);
  expect((await request.post(`/api/profile/me/documents/${id}/master`, { headers:{ Origin:"https://other.example" } })).status()).toBe(403);
  expect((await request.post(`/api/profile/me/documents/${id}/claims`, { data:{ skill:"Kotlin", statement:"Built APIs", context:"Synthetic", quote:"Kotlin", ownerId:id } })).status()).toBe(400);
  expect((await request.post("/api/profile/me/documents", { multipart:{ file:{ name:"synthetic.docx", mimeType:original.mediaType, buffer:Buffer.from("synthetic fixture") }, language:"nb" } })).status()).toBe(403);
});

test("Markdown competency evidence is readable, does not offer master-CV selection and retains employer context",async({page})=>{
 const source="## Example AS\nBuilt APIs with Kotlin for customer X.";
 const document={id,originalName:"project.md",mediaType:"text/markdown",byteSize:source.length,sha256:"a".repeat(64),language:"nb",isMaster:false,createdAt:"2026-10-07T00:00:00Z",textCharacters:source.length,extractionMethod:"TEXT"};
 let uploaded=false;
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));await page.route("**/api/profile/me",r=>r.fulfill({json:{id,displayName:"Fictional Pilot",preferredLanguage:"nb",revision:1}}));await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[]}));
 await page.route("**/api/profile/me/documents**",r=>{if(r.request().method()==="POST"){uploaded=true;return r.fulfill({json:document});}if(r.request().url().endsWith("/analysis"))return r.fulfill({json:{analysis:null}});return r.fulfill({json:r.request().url().endsWith(id)?{document,text:source}:uploaded?[document]:[]});});
 await page.goto("/career/profile");await page.getByLabel("Dokumentfil",{exact:true}).setInputFiles({name:"project.md",mimeType:"text/markdown",buffer:Buffer.from(source)});await page.getByRole("button",{name:"Last opp dokument",exact:true}).click();
 await expect(page.getByRole("article",{name:"project.md",exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Bruk som master-CV",exact:true})).toHaveCount(0);
 await page.getByRole("button",{name:"Analyser dokumentet",exact:true}).click();await page.locator(".source-review-tile > summary").click(); await expect(page.getByRole("textbox",{name:"Tekst som sendes fra project.md",exact:true})).toHaveValue(source);
});
