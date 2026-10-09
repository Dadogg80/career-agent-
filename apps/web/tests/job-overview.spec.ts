import { expect, test } from "@playwright/test";
const text = "Example AS bygger tjenester.\nDu utvikler API-er.\nDu liker samarbeid.\nVi tilbyr fleksibel arbeidstid.\nKontakt Kari Test.\nArbeidssted: Oslo\nSøknadsfrist: 30.10.2026\nKotlin er nødvendig.";
const facts = [
  { kind: "COMPANY", label: "Bedrift", value: "AI paraphrase must not replace source", quote: "Example AS bygger tjenester." },
  { kind: "ROLE", label: "Rolle", value: "APIs", quote: "Du utvikler API-er." },
  { kind: "APPLICANT", label: "Søker", value: "Samarbeid", quote: "Du liker samarbeid." },
  { kind: "OFFER", label: "Tilbud", value: "Fleksibilitet", quote: "Vi tilbyr fleksibel arbeidstid." },
  { kind: "CONTACT", label: "Kontakt", value: "Kari Test", quote: "Kontakt Kari Test." },
];
for (const width of [1280, 390]) test(`employer overview precedes requirement cards at ${width}px`, async ({ page }) => {
  let calls = 0;
  await page.setViewportSize({ width, height: 900 });
  await page.route("**/api/jobs/requirements", route => { calls++; return route.fulfill({ json: { facts, requirements: [{ kind: "REQUIRED", label: "Kotlin", quote: "Kotlin er nødvendig." }] } }); });
  await page.goto("/jobs/analyze");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(text);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  const overview = page.getByRole("region", { name: "Forstå stillingen" });
  await expect(overview.locator(".job-overview-company .job-overview-preview")).toContainText("Example AS bygger tjenester.");
  await expect(page.getByText("AI paraphrase must not replace source")).toHaveCount(0);
  await expect(overview.locator(".job-overview-role .job-overview-preview")).toContainText("Du utvikler API-er.");
  await expect(overview.locator(".job-overview-applicant .job-overview-preview")).toContainText("Du liker samarbeid.");
  await expect(overview.locator(".job-overview-offer .job-overview-preview")).toContainText("Vi tilbyr fleksibel arbeidstid.");
  await expect(overview.locator(".job-fact-contact .fact-value")).toHaveText("Kari Test");
  await expect(overview.locator(".job-fact-location .fact-value")).toHaveText("Oslo");
  await expect(overview.locator(".job-fact-deadline .fact-value")).toHaveText("30.10.2026");
  const company = await overview.locator(".job-overview-company").boundingBox();
  const role = await overview.locator(".job-overview-role").boundingBox();
  const overviewBox = await overview.boundingBox();
  const requirements = await page.getByRole("heading", { name: "Kotlin", exact: true }).boundingBox();
  expect(width > 760 ? role!.x > company!.x : role!.y > company!.y).toBe(true);
  expect(requirements!.y).toBeGreaterThan(overviewBox!.y + overviewBox!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(calls).toBe(1);
  await page.screenshot({ path: `/tmp/career-overview-${width}.png`, fullPage: true });
});

test("analysis rejection still displays the received advertisement and permits a source-reusing retry", async ({ page }) => {
  let imports = 0; let analyses = 0;
  const url = "https://arbeidsplassen.nav.no/stillinger/stilling/12345678-1234-1234-1234-123456789abc";
  await page.route("**/api/jobs/import", route => { imports++; return route.fulfill({ json: { sourceUrl: url, title: "Example developer", text, retrievedAt: "2026-10-07T00:00:00Z" } }); });
  await page.route("**/api/jobs/requirements", route => { analyses++; return analyses === 1 ? route.fulfill({ status: 502, json: { code: "AI_INVALID_RESULT", reason: "NO_SUPPORTED_ITEMS" } }) : route.fulfill({ json: { facts, requirements: [] } }); });
  await page.goto("/jobs/analyze");
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Example developer", exact: true })).toBeVisible();
  await expect(page.locator(".fallback-advertisement")).toHaveText(text);
  await expect(page.locator(".job-fact-contact")).toContainText("Ikke identifisert i analysen. Se annonseteksten eller originalannonsen.");
  await expect(page.locator(".empty-state")).toHaveCount(0);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(page.locator(".employer-card")).toContainText("Example AS bygger tjenester.");
  await expect(page.locator(".fallback-advertisement")).toHaveCount(0);
  expect(imports).toBe(1); expect(analyses).toBe(2);
  await page.getByRole("combobox", { name: "Språk", exact: true }).selectOption("en");
  await expect(page.getByRole("region", { name: "Understand the role" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact person", exact: true })).toBeVisible();
});

test("overview previews source sections and the full reader preserves omitted detail without more AI calls", async ({ page }) => {
  const role = "Du utvikler API-er. Du følger løsningene fra idé til produksjon. Teamet samarbeider med kundene hver uke.";
  const company = "Example AS bygger tjenester. Vi er et fagmiljø med 45 kollegaer. Selskapet har kontorer i Oslo og Bergen.";
  const offer = "Vi tilbyr fleksibel arbeidstid. Du får tid til faglig utvikling, pensjon og trening i arbeidstiden.";
  const source = `# Utvikler\n\n## Om oss\n${company}\n\n## Om stillingen\n${role}\n\n## Vi tilbyr\n${offer}\n\n## Annen informasjon\nTilrettelegging avtales med rekrutteringsteamet.\nKotlin er nødvendig.`;
  let calls = 0;
  await page.route("**/api/jobs/requirements", route => { calls++; return route.fulfill({ json: { facts, requirements: [] } }); });
  await page.goto("/jobs/analyze");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  await expect(page.locator(".job-overview-company")).toContainText(company);
  await expect(page.locator(".job-overview-role")).toContainText(role);
  await expect(page.locator(".job-overview-offer")).toContainText(offer);
  await page.locator(".advertisement-reader summary").click();
  await expect(page.locator(".received-advertisement")).toContainText("Tilrettelegging avtales med rekrutteringsteamet.");
  await expect(page.locator(".received-advertisement")).toContainText(company);
  expect(calls).toBe(1);
});

test("an omitted AI detail can be reviewed and added manually with an exact source quote before saving", async ({ page }) => {
  const source = "Fictional employer seeks a backend engineer.\nArbeidssted: Oslo og Bergen\nSøknadsfrist: 30.10.2026\nKotlin experience is required for this role.";
  let analysisCalls = 0;
  let savedFacts: unknown;
  let savedOmissions = -1;
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
  await page.route("**/api/jobs/requirements", route => {
    analysisCalls++;
    return route.fulfill({ json: { facts: [], requirements: [{ kind: "REQUIRED", label: "Kotlin", quote: "Kotlin experience is required for this role." }], omittedItems: 8 } });
  });
  await page.route("**/api/profile/me/jobs", route => {
    const payload = route.request().postDataJSON();
    savedFacts = payload.facts;
    savedOmissions = payload.omittedItems;
    return route.fulfill({ json: { id: "52345678-1234-1234-1234-123456789abc", content: payload, createdAt: "2026-10-07T00:00:00Z" } });
  });
  await page.goto("/jobs/analyze");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse" }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  expect(analysisCalls).toBe(1);
  const omitted = page.locator(".analysis-quality-omissions");
  await expect(omitted.locator("summary")).toContainText("8 AI-forslag utelatt");
  await omitted.locator("summary").click();
  await expect(omitted).toContainText("manglet et kontrollerbart sitat");
  await omitted.getByLabel("Type opplysning").selectOption("LOCATION");
  await omitted.getByLabel("Opplysning", { exact: true }).fill("Oslo og Bergen");
  await omitted.getByLabel("Ordrett sitat fra annonsen").fill("Arbeidssted: Oslo og Bergen");
  await omitted.getByRole("button", { name: "Legg til opplysning" }).click();
  await expect(page.locator(".job-fact-location")).toContainText("Oslo og Bergen");
  await expect(page.locator(".job-fact-location")).toContainText("Manuelt lagt til");
  await expect(omitted.locator(".manual-fact-list")).toContainText("Arbeidssted: Oslo og Bergen");
  await omitted.getByRole("button", { name: "Gå til hele annonseteksten" }).click();
  await expect(page.locator("#received-advertisement")).toHaveAttribute("open", "");
  await page.getByRole("button", { name: "Lagre stillingen", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Lagre versjonen" }).click();
  await expect(page.getByRole("link", { name: "Lagret · Se mine stillinger" })).toBeVisible();
  expect(savedOmissions).toBe(8);
  expect(savedFacts).toEqual([{ kind: "LOCATION", label: "Manuelt fra annonsen", value: "Oslo og Bergen", quote: "Arbeidssted: Oslo og Bergen" }]);
  expect(analysisCalls).toBe(1);
});
