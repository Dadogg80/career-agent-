import { expect, test } from "@playwright/test";
const text = "Example AS builds public services. Kotlin experience is required. The office is in Oslo.";
test("failed refresh retains supported facts and requirements while explaining partial processing without a red error", async ({ page }) => {
 let calls = 0;
 await page.route("**/api/jobs/requirements", r => { calls++; return calls === 1 ? r.fulfill({ json: { requirements: [{ label: "Kotlin", kind: "REQUIRED", quote: "Kotlin experience is required." }], facts: [{ kind: "LOCATION", label: "Arbeidssted", value: "Oslo", quote: "The office is in Oslo." }], omittedItems: 0 } }) : r.fulfill({ status: 502, json: { code: "AI_INVALID_RESULT", reason: "INVALID_STRUCTURE", failed_generation: "PRIVATE_PAYLOAD" } }); });
 await page.goto("/jobs/analyze"); await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
 await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(text);
 await page.getByRole("button", { name: "Analyser", exact: true }).click();
 await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
 await page.getByRole("button", { name: "Analyser", exact: true }).click();
 await expect(page.locator(".workflow-notice")).toContainText("Den tidligere analysen er beholdt");
 await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
 await expect(page.locator(".fact-value").filter({ hasText: "Oslo" })).toBeVisible();
 await expect(page.locator(".workspace [role='alert']")).toHaveCount(0);
 await expect(page.getByRole("textbox", { name: "Stillingsannonse", exact: true })).toHaveValue(text);
 await expect(page.locator("body")).not.toContainText("PRIVATE_PAYLOAD"); expect(calls).toBe(2);
});

test("unavailable retrieval offers paste recovery and keeps the URL without fabricated advertisement content", async ({ page }) => {
 const url = "https://www.finn.no/job/ad/477055359"; let imports = 0; let analyses = 0;
 await page.route("**/api/jobs/import", r => { imports++; return r.fulfill({ status: 404, json: { code: "SOURCE_NOT_AVAILABLE" } }); });
 await page.route("**/api/jobs/requirements", r => { analyses++; return r.fulfill({ status: 503, json: { code: "AI_UNAVAILABLE" } }); });
 await page.goto("/jobs/analyze"); await page.getByRole("textbox", { name: "Lenke til stillingsannonse", exact: true }).fill(url);
 await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
 await expect(page.locator(".workflow-notice")).toContainText("Vi har ikke fått et lesbart utdrag");
 await expect(page.locator(".fallback-advertisement")).toHaveCount(0); await expect(page.locator(".workspace [role='alert']")).toHaveCount(0);
 await page.getByRole("button", { name: "Lim inn annonsetekst", exact: true }).click();
 await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(text); await page.getByRole("button", { name: "Analyser", exact: true }).click();
 await expect(page.locator(".fallback-advertisement")).toHaveText(text);
 await expect(page.locator(".workflow-notice")).toContainText("Annonsen er klar til å lese");
 await page.getByRole("button", { name: "Bruk lenke", exact: true }).click(); await expect(page.getByRole("textbox", { name: "Lenke til stillingsannonse", exact: true })).toHaveValue(url);
 expect(imports).toBe(1); expect(analyses).toBe(1);
});

test("local fallback organizes explicit advertisement sections and practical fields without AI interpretation",async({page})=>{
 const source="## Om oss\nExample AS utvikler tjenester for kommuner. Vi er et team med 30 kollegaer.\n\n## Arbeidsoppgaver\nDu lager integrasjoner og følger dem i produksjon.\n\n## Vi tilbyr\nFleksibel arbeidstid og faglig utvikling.\n\n## Praktisk informasjon\nArbeidssted: Oslo\nKontaktperson: Kari Test, kari@example.test\nSøknadsfrist: Snarest\nAnnen tekst vi ikke skal miste.";
 let calls=0;
 await page.route("**/api/jobs/requirements",r=>{calls++;return r.fulfill({status:502,json:{code:"AI_INVALID_RESULT"}});});
 await page.goto("/jobs/analyze");await page.getByRole("button",{name:"Lim inn tekst",exact:true}).click();await page.getByRole("textbox",{name:"Stillingsannonse",exact:true}).fill(source);await page.getByRole("button",{name:"Analyser",exact:true}).click();
 await expect(page.locator(".employer-card")).toContainText("Vi er et team med 30 kollegaer.");
 await expect(page.locator(".employer-sections")).toContainText("Du lager integrasjoner og følger dem i produksjon.");
 await expect(page.locator(".job-facts")).toContainText("Kari Test, kari@example.test");await expect(page.locator(".job-facts")).toContainText("Snarest");
 await expect(page.getByText("Teksten er sortert lokalt etter tydelige overskrifter og felt.",{exact:false})).toBeVisible();await page.locator(".advertisement-reader summary").click();await expect(page.locator(".received-advertisement")).toContainText("Annen tekst vi ikke skal miste.");expect(calls).toBe(1);
});
