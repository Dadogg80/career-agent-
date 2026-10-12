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

for(const width of [1280,390]){
 test(`document library filters metadata without narrowing combined source selection at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  const records=[
   {...original,id:"12345678-1234-1234-1234-123456789abc",originalName:"fictional-master.docx",isMaster:true,textCharacters:100},
   {...original,id:"22345678-1234-1234-1234-123456789abc",originalName:"scanned-certificate.pdf",mediaType:"application/pdf",isMaster:false,textCharacters:0},
   {...original,id:"32345678-1234-1234-1234-123456789abc",originalName:"legacy-project-notes.txt",mediaType:"text/plain",isMaster:false,textCharacters:undefined},
   {...original,id:"42345678-1234-1234-1234-123456789abc",originalName:"fictional-project-experience-with-a-long-filename-for-testing-responsive-layout.docx",isMaster:false,textCharacters:100},
  ];
  const reads=new Set<string>();let writes=0;
  await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
  await page.route("**/api/profile/me",r=>r.fulfill({json:{id,displayName:"Fictional Pilot",preferredLanguage:"nb",revision:1}}));
  await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[]}));
  await page.route("**/api/profile/me/documents**",r=>{
   if(r.request().method()!=="GET"){writes++;return r.fulfill({status:500,json:{}});}
   if(r.request().url().includes("/workflow"))return r.fulfill({json:null});
   const selected=records.find(d=>r.request().url().endsWith(d.id));
   if(selected){reads.add(selected.id);return r.fulfill({json:{document:selected,text:selected.textCharacters===0?"":"Fictional source describing project responsibilities and work experience."}});}
   return r.fulfill({json:records});
  });
  await page.goto("/career/profile");const library=page.locator(".document-panel"),rows=library.locator(".document-tile");
  await expect(rows).toHaveCount(4);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`/tmp/career-document-library-${width}-all.png`,fullPage:true});
  await library.getByRole("combobox",{name:"Vis dokumenter",exact:true}).selectOption("NO_TEXT");await expect(rows).toHaveCount(1);await expect(rows.first()).toContainText("scanned-certificate.pdf");
  await library.getByRole("combobox",{name:"Vis dokumenter",exact:true}).selectOption("UNKNOWN");await expect(rows).toHaveCount(1);await expect(rows.first()).toContainText("Åpne for å kontrollere teksten");await expect(rows.first().locator('.document-read-status[data-readable="unknown"]')).toBeVisible();
  await library.getByRole("combobox",{name:"Vis dokumenter",exact:true}).selectOption("MASTER");await expect(rows).toHaveCount(1);await expect(rows.first()).toContainText("fictional-master.docx");
  await library.getByRole("textbox",{name:"Søk i filnavn",exact:true}).fill("not-present");await expect(rows).toHaveCount(0);
  await library.getByRole("button",{name:"Vis alle dokumenter",exact:true}).click();await expect(rows).toHaveCount(4);
  if(width===390){await page.getByRole("combobox",{name:"Språk",exact:true}).selectOption("en");await library.getByRole("textbox",{name:"Search filenames",exact:true}).fill("MASTER");}else await library.getByRole("textbox",{name:"Søk i filnavn",exact:true}).fill("MASTER");
  await expect(rows).toHaveCount(1);expect(reads.size).toBe(0);expect(writes).toBe(0);
  await page.screenshot({path:`/tmp/career-document-library-${width}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await library.getByRole("button",{name:width===390?"Summarize all documents with AI":"Oppsummer alle dokumentene med AI",exact:true}).click();
  const dialog=page.locator(".document-workspace-sheet");await expect(dialog.locator(".source-review-tile")).toHaveCount(4);
  expect([...reads].sort()).toEqual(records.map(d=>d.id).sort());expect(writes).toBe(0);
 });
}
