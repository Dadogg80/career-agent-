import { expect, test } from "@playwright/test";
const id = "52345678-1234-1234-1234-123456789abc";
const text = "Example AS builds services. Kotlin is required. The office is in Oslo.";
const extraction = { requirements: [{ label: "Kotlin", kind: "REQUIRED", quote: "Kotlin is required." }], facts: [{ kind: "LOCATION", label: "Arbeidssted", value: "Oslo", quote: "The office is in Oslo." }], omittedItems: 0 };
const content = { title: "Fictional Kotlin developer", sourceUrl: null, sourceType: "PASTED_TEXT", text, locale: "nb", ...extraction, retrievedAt: null };
const job = { id, content, createdAt: "2026-10-07T00:00:00Z" };

test("saving an analysis retains its actual text and source without another AI call", async ({ page }) => {
 let calls = 0; let saves = 0;
 await page.route("**/api/auth/session", r => r.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
 await page.route("**/api/jobs/requirements", r => { calls++; return r.fulfill({ json: extraction }); });
 await page.route("**/api/profile/me/jobs", r => { saves++; const input = r.request().postDataJSON(); expect(input).toEqual(content); expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf"); return r.fulfill({ json: job }); });
 await page.goto("/jobs/analyze");
 await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
 await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(text);
 await page.getByRole("button", { name: "Analyser", exact: true }).click();
 await page.getByRole("button", { name: "Lagre stillingen", exact: true }).click();
 const dialog = page.getByRole("dialog");
 await dialog.getByRole("textbox", { name: "Navn på stillingen" }).fill(content.title);
 await dialog.getByRole("button", { name: "Lagre versjonen" }).click();
 await expect(page.getByRole("link", { name: "Lagret · Se mine stillinger" })).toBeVisible();
 expect(calls).toBe(1); expect(saves).toBe(1);
});

test("saved snapshots can be searched reopened and explicitly deleted on mobile in both languages", async ({ page }) => {
 let stored = [job]; let deletes = 0;
 await page.setViewportSize({ width: 390, height: 850 });
 await page.route("**/api/auth/session", r => r.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
 await page.route("**/api/profile/me/claims", r => r.fulfill({ json: [] }));
 await page.route("**/api/profile/me/jobs**", r => {
  if (r.request().url().endsWith("/match")) return r.fulfill({ json: null });
  if (r.request().method() === "DELETE") { deletes++; expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf"); stored = []; return r.fulfill({ status: 204 }); }
  return r.fulfill({ json: stored });
 });
 await page.goto("/jobs/saved");
 await expect(page.getByRole("heading", { name: job.content.title, exact: true })).toBeVisible();
 await page.getByRole("textbox", { name: "Søk i lagrede stillinger" }).fill("Bergen");
 await expect(page.getByText("Ingen stillinger passer søket.")).toBeVisible();
 await page.getByRole("textbox", { name: "Søk i lagrede stillinger" }).fill("Oslo");
 await page.getByRole("button", { name: "Åpne stilling", exact: true }).click();
 const sheet = page.getByRole("dialog");
 await expect(sheet.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
 await sheet.locator("summary").filter({ hasText: "Lagret annonsetekst" }).click();
 await expect(sheet.locator("pre")).toHaveText(text);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({ path: "/tmp/career-saved-job-mobile.png", fullPage: true });
 await sheet.getByRole("button", { name: "Lukk", exact: true }).click();
 await page.getByRole("combobox", { name: "Språk", exact: true }).selectOption("en");
 await page.getByRole("button", { name: "Open job", exact: true }).click();
 await page.getByRole("button", { name: "Delete saved job", exact: true }).click();
 const confirm = page.getByRole("dialog").filter({ hasText: "Delete this job snapshot?" });
 expect(deletes).toBe(0);
 await confirm.getByRole("button", { name: "Yes, delete job", exact: true }).click();
 await expect(page.getByRole("heading", { name: "Keep your next opportunity" })).toBeVisible();
 expect(deletes).toBe(1);
});

test("private saved-job proxies reject anonymous cross-origin spoofed owners and oversized snapshots", async ({ request }) => {
 const path = "/api/profile/me/jobs";
 expect((await request.get(path)).status()).toBe(401);
 expect((await request.post(path, { data: content, headers: { Origin: "https://unrelated.example" } })).status()).toBe(403);
 expect((await request.post(path, { data: { ...content, ownerId: id } })).status()).toBe(400);
 expect((await request.post(path, { data: { ...content, text: "x".repeat(15001) } })).status()).toBe(400);
 expect((await request.post(path, { data: { ...content, sourceUrl: "javascript:alert(1)" } })).status()).toBe(400);
});

test("saved overview shows current stale and missing matches with readable actions and responsive cards",async({page})=>{
 const second="62345678-1234-1234-1234-123456789abc",third="72345678-1234-1234-1234-123456789abc",claim="82345678-1234-1234-1234-123456789abc";
 const stored=[job,{...job,id:second,content:{...content,title:"Another developer"},createdAt:"2026-10-08T00:00:00Z"},{...job,id:third,content:{...content,title:"Unmatched developer"},createdAt:"2026-10-09T00:00:00Z"}];
 let writes=0;
 const match={id:claim,locale:"nb",createdAt:job.createdAt,provider:"Gemini",model:"gemini-3.5-flash-lite",automaticEvidence:true,stale:false,inputCharacters:100,omittedItems:0,claims:[{id:claim,revision:1,skill:"Kotlin",statement:"Built Kotlin APIs",context:"Example AS"}],assessments:[{requirementIndex:0,classification:"STRONG",reason:"Documented experience",evidence:[{claimId:claim,quote:"Built Kotlin APIs"}],question:""}]};
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me/jobs**",r=>{if(r.request().method()!=="GET")writes++;const url=r.request().url();return r.fulfill({json:url.endsWith("/match")?url.includes(third)?null:{...match,stale:url.includes(second)}:stored});});
 await page.goto("/jobs/saved");
 await expect(page.locator(".saved-job-card")).toHaveCount(3);
 const current=page.locator(".saved-job-card").filter({has:page.getByRole("heading",{name:content.title,exact:true})});
 await expect(current).toContainText("100% kravmatch");await expect(current).toContainText("Gemini · gemini-3.5-flash-lite");
 await expect(page.locator(".saved-job-card").filter({hasText:"Another developer"})).toContainText("Profilen er endret · vurder på nytt");
 await expect(page.locator(".saved-job-card").filter({hasText:"Unmatched developer"})).toContainText("Ikke matchet ennå");
 const apply=current.getByRole("link",{name:"Søk på stillingen"});
 const colors=await apply.evaluate(el=>{const s=getComputedStyle(el);return {color:s.color,background:s.backgroundColor};});
 expect(colors.color).toBe("rgb(255, 255, 255)");expect(colors.background).toBe("rgb(36, 88, 68)");
 await page.getByRole("combobox",{name:"Sorter stillinger"}).selectOption("OLDEST");
 await expect(page.locator(".saved-job-card").first()).toContainText(content.title);
 await page.screenshot({path:"/tmp/career-saved-overview-desktop.png",fullPage:true});
 await page.getByRole("textbox",{name:"Søk i lagrede stillinger"}).fill("Fictional");
 await expect(page.locator(".saved-job-card")).toHaveCount(1);
 await page.screenshot({path:"/tmp/career-saved-overview-single.png",fullPage:true});
 await page.setViewportSize({width:390,height:850});
 await expect(apply).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"/tmp/career-saved-overview-mobile.png",fullPage:true});
 await page.reload();await expect(page.locator(".saved-job-card").filter({hasText:content.title})).toContainText("100% kravmatch");expect(writes).toBe(0);
});
