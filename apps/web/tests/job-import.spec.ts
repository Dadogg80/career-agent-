import { expect, test } from "@playwright/test";
const url = "https://arbeidsplassen.nav.no/stillinger/stilling/12345678-1234-1234-1234-123456789abc";
const text = "Utvikler\nDu må ha erfaring med Kotlin og PostgreSQL.";
test("URL analysis runs from one action and source evidence stays available", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/jobs/import", route => route.fulfill({ json: { sourceUrl: url, title: "Utvikler", text, retrievedAt: "2026-10-07T00:00:00Z" } }));
  await page.route("**/api/jobs/requirements", route => { calls++; return route.fulfill({ json: { facts: [], requirements: [{ label: "Kotlin", kind: "REQUIRED", quote: "Du må ha erfaring med Kotlin og PostgreSQL." }] } }); });
  await page.goto("/");
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Stillingsannonse", exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
  await page.getByText("Se kildegrunnlaget", { exact: true }).click();
  await expect(page.locator("pre")).toHaveText(text);
  expect(calls).toBe(1);
});
test("real unsupported source keeps URL and offers manual fallback in both languages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await page.getByRole("textbox", { name: "Job advertisement link" }).fill("https://other.example/job/ad/123");
  await page.getByRole("button", { name: "Analyze link", exact: true }).click();
  await expect(page.getByRole("region", { name: "Analyze a job advertisement" }).getByRole("alert")).toContainText("not supported");
  await expect(page.getByRole("textbox", { name: "Job advertisement link" })).toHaveValue("https://other.example/job/ad/123");
  await page.getByRole("button", { name: "Paste text", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Job advertisement" })).toBeVisible();
});
test("import proxy rejects cross-origin and oversized requests", async ({ request }) => {
  expect((await request.post("/api/jobs/import", { headers: { origin: "https://evil.example" }, data: { url } })).status()).toBe(403);
  expect((await request.post("/api/jobs/import", { data: { url: "x".repeat(10001) } })).status()).toBe(413);
});
test("mobile layout stays inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Analyser lenke", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("FINN direct analysis retains provenance in both languages", async ({ page }) => {
  const finn = "https://www.finn.no/job/ad/478077416";
  let analyzed = false;
  await page.route("**/api/jobs/import", route => route.fulfill({ json: { sourceUrl: finn, title: "Backend engineer", text, retrievedAt: "2026-10-07T00:00:00Z", sourceType: "GROQ_BROWSER_EXCERPT" } }));
  await page.route("**/api/jobs/requirements", route => { analyzed = true; return route.fulfill({ json: { facts: [], requirements: [] } }); });
  await page.goto("/");
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(finn);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(page.getByText(/Kildeutdrag via Groq/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Åpne originalannonsen" })).toHaveAttribute("href", finn);
  await expect(page.getByText("Ingen eksplisitte krav ble funnet.")).toBeVisible();
  expect(analyzed).toBe(true);
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await expect(page.getByText(/Source excerpt through Groq/)).toBeVisible();
  await expect(page.getByText("No explicit requirements were found.")).toBeVisible();
  await expect(page.getByText(/Source excerpt through Groq/)).toHaveCount(1);
});
test("real FINN import reaches Groq adapter and handles missing configuration", async ({ request }) => {
  const response = await request.post("/api/jobs/import", { data: { url: "https://www.finn.no/job/ad/478077416" } });
  expect(response.status()).toBe(503);
  expect(await response.json()).toEqual({ code: "SOURCE_AI_NOT_CONFIGURED" });
});
test("FINN import cannot label an excerpt as a direct NAV original", async ({ page }) => {
  await page.route("**/api/jobs/import", route => route.fulfill({ json: { sourceUrl: "https://www.finn.no/job/ad/478077416", title: "Engineer", text, retrievedAt: "2026-10-07T00:00:00Z", sourceType: "NAV_API" } }));
  await page.goto("/");
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill("https://www.finn.no/job/ad/478077416");
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(page.getByRole("region", { name: "Analyser en stillingsannonse" }).getByRole("alert")).toContainText("kunne ikke leses sikkert");
  await expect(page.getByRole("textbox", { name: "Stillingsannonse", exact: true })).toHaveCount(0);
});

test("overview shows variable sourced details without additional model calls", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/jobs/import", route => route.fulfill({ json: { sourceUrl: url, title: "Utvikler", text, retrievedAt: "2026-10-07T00:00:00Z" } }));
  await page.route("**/api/jobs/requirements", route => { calls++; return route.fulfill({ json: { requirements: [], facts: [
    { kind: "COMPANY", label: "Bedrift", value: "Example AS", quote: "Example AS" },
    { kind: "DEADLINE", label: "Søknadsfrist", value: "Snarest", quote: "Søknadsfrist: Snarest" },
    { kind: "CONTACT", label: "Kontakt", value: "Test Contact – contact@example.test", quote: "Test Contact – contact@example.test" }
  ] } }); });
  await page.goto("/");
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  const overview = page.getByRole("region", { name: "Om stillingen og arbeidsgiveren" });
  await expect(overview.getByText("Snarest", { exact: true })).toBeVisible();
  await overview.getByText("Sitat fra kilden", { exact: true }).first().click();
  await expect(overview.locator("blockquote").first()).toHaveText("Example AS");
  expect(calls).toBe(1);
});
test("failed automatic analysis keeps retrieved text for manual retry", async ({ page }) => {
  await page.route("**/api/jobs/import", route => route.fulfill({ json: { sourceUrl: url, title: "Utvikler", text, retrievedAt: "2026-10-07T00:00:00Z" } }));
  await page.route("**/api/jobs/requirements", route => route.fulfill({ status: 429, json: { code: "AI_RATE_LIMITED" } }));
  await page.goto("/");
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(page.getByRole("region", { name: "Analyser en stillingsannonse" }).getByRole("alert")).toContainText("Groq-kvoten");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Stillingsannonse", exact: true })).toHaveValue(text);
});
