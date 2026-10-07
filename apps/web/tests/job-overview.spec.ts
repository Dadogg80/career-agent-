import { expect, test } from "@playwright/test";
const text = "Example AS bygger tjenester. Du utvikler API-er. Du liker samarbeid. Vi tilbyr fleksibel arbeidstid. Kontakt Kari Test. Kotlin er nødvendig.";
const facts = [
  { kind: "COMPANY", label: "Bedrift", value: "AI paraphrase must not replace source", quote: "Example AS bygger tjenester." },
  { kind: "ROLE", label: "Rolle", value: "APIs", quote: "Du utvikler API-er." },
  { kind: "APPLICANT", label: "Søker", value: "Samarbeid", quote: "Du liker samarbeid." },
  { kind: "OFFER", label: "Tilbud", value: "Fleksibilitet", quote: "Vi tilbyr fleksibel arbeidstid." },
  { kind: "CONTACT", label: "Kontakt", value: "Kari Test", quote: "Kontakt Kari Test." },
];
for (const width of [1280, 390]) test(`source paragraphs and contact precede requirement cards at ${width}px`, async ({ page }) => {
  let calls = 0;
  await page.setViewportSize({ width, height: 900 });
  await page.route("**/api/jobs/requirements", route => { calls++; return route.fulfill({ json: { facts, requirements: [{ kind: "REQUIRED", label: "Kotlin", quote: "Kotlin er nødvendig." }] } }); });
  await page.goto("/");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(text);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  const overview = page.getByRole("region", { name: "Forstå stillingen" });
  await expect(overview.getByText("Example AS bygger tjenester.", { exact: true })).toBeVisible();
  await expect(page.getByText("AI paraphrase must not replace source")).toHaveCount(0);
  await expect(overview.getByText("Du utvikler API-er.", { exact: true })).toBeVisible();
  await expect(overview.getByText("Du liker samarbeid.", { exact: true })).toBeHidden();
  await overview.locator("summary").filter({ hasText: "Hvem de søker" }).click();
  await expect(overview.getByText("Du liker samarbeid.", { exact: true })).toBeVisible();
  await overview.locator("summary").filter({ hasText: "Dette tilbyr de" }).click();
  await expect(overview.getByText("Vi tilbyr fleksibel arbeidstid.", { exact: true })).toBeVisible();
  await expect(overview.getByText("Kontakt Kari Test.", { exact: true })).toBeVisible();
  const company = await overview.locator(".employer-card").boundingBox();
  const role = await overview.locator(".employer-sections").boundingBox();
  const metadata = await overview.locator(".job-facts").boundingBox();
  const requirements = await page.getByRole("heading", { name: "Kotlin", exact: true }).boundingBox();
  expect(width > 760 ? role!.x > company!.x : role!.y > company!.y).toBe(true);
  expect(requirements!.y).toBeGreaterThan(metadata!.y + metadata!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(calls).toBe(1);
  await page.screenshot({ path: `/tmp/career-overview-${width}.png`, fullPage: true });
});

test("analysis rejection still displays the received advertisement and permits a source-reusing retry", async ({ page }) => {
  let imports = 0; let analyses = 0;
  const url = "https://arbeidsplassen.nav.no/stillinger/stilling/12345678-1234-1234-1234-123456789abc";
  await page.route("**/api/jobs/import", route => { imports++; return route.fulfill({ json: { sourceUrl: url, title: "Example developer", text, retrievedAt: "2026-10-07T00:00:00Z" } }); });
  await page.route("**/api/jobs/requirements", route => { analyses++; return analyses === 1 ? route.fulfill({ status: 502, json: { code: "AI_INVALID_RESULT", reason: "NO_SUPPORTED_ITEMS" } }) : route.fulfill({ json: { facts, requirements: [] } }); });
  await page.goto("/");
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Example developer", exact: true })).toBeVisible();
  await expect(page.locator(".fallback-advertisement")).toHaveText(text);
  await expect(page.getByText("Kontaktperson ble ikke identifisert i analysen. Se annonseteksten eller originalannonsen for kontaktopplysninger.")).toBeVisible();
  await expect(page.locator(".empty-state")).toHaveCount(0);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(page.locator(".employer-card")).toContainText("Example AS bygger tjenester.");
  await expect(page.locator(".fallback-advertisement")).toHaveCount(0);
  expect(imports).toBe(1); expect(analyses).toBe(2);
  await page.getByRole("combobox", { name: "Språk", exact: true }).selectOption("en");
  await expect(page.getByRole("region", { name: "Understand the role" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact person", exact: true })).toBeVisible();
});
