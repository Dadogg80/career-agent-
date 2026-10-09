import { expect, test } from "@playwright/test";

const url = "https://www.finn.no/job/ad/477265830";
const text = "Vi søker en utvikler. Du må ha erfaring med Kotlin og PostgreSQL.";

test("FINN waits ten seconds before analysis and does not duplicate requests", async ({ page }) => {
  let imports = 0;
  let analyses = 0;
  await page.route("**/api/jobs/import", route => { imports++; return route.fulfill({ json: { sourceUrl: url, title: "Utvikler", text, retrievedAt: "2026-10-07T00:00:00Z", sourceType: "GROQ_BROWSER_EXCERPT" } }); });
  await page.route("**/api/jobs/requirements", route => { analyses++; return route.fulfill({ json: { facts: [], requirements: [{ label: "Kotlin", kind: "REQUIRED", quote: "Du må ha erfaring med Kotlin og PostgreSQL." }] } }); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/jobs/analyze");
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(page.getByText("Annonsen er hentet. Analysen starter om 10 sekunder.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator(".sorting-document")).toHaveCSS("animation-name", "none");
  await expect(page.getByRole("button", { name: "Lim inn tekst", exact: true })).toBeDisabled();
  await page.clock.fastForward(9000);
  await expect(page.getByText("Annonsen er hentet. Analysen starter om 1 sekunder.")).toBeVisible();
  expect(analyses).toBe(0);
  await page.clock.fastForward(1000);
  await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
  expect(imports).toBe(1); expect(analyses).toBe(1);
  const diagnostics = page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true });
  if (await diagnostics.count()) await expect(page.locator(".diagnostic-sheet")).not.toBeVisible();
});

test("stopping a pause preserves the source and a retry respects the remaining pause", async ({ page }) => {
  let imports = 0;
  let analyses = 0;
  await page.route("**/api/jobs/import", route => { imports++; return route.fulfill({ json: { sourceUrl: url, title: "Utvikler", text, retrievedAt: "2026-10-07T00:00:00Z", sourceType: "GROQ_BROWSER_EXCERPT" } }); });
  await page.route("**/api/jobs/requirements", route => { analyses++; return route.fulfill({ json: { facts: [], requirements: [] } }); });
  await page.goto("/jobs/analyze");
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await page.getByRole("textbox", { name: "Job advertisement link" }).fill(url);
  await page.getByRole("button", { name: "Analyze link", exact: true }).click();
  await expect(page.getByText("Advertisement fetched. Analysis starts in 10 seconds.")).toBeVisible();
  await page.clock.fastForward(3000);
  await page.getByRole("button", { name: "Stop before analysis" }).click();
  await expect(page.getByText(/Analysis stopped/)).toBeVisible();
  expect(analyses).toBe(0);
  await page.getByRole("button", { name: "Analyze link", exact: true }).click();
  await expect(page.getByText("Advertisement fetched. Analysis starts in 7 seconds.")).toBeVisible();
  expect(imports).toBe(1); expect(analyses).toBe(0);
  await page.clock.fastForward(7000);
  await expect(page.getByText("No explicit requirements were found.")).toBeVisible();
  expect(imports).toBe(1); expect(analyses).toBe(1);
});

test("failed retrieval never schedules analysis", async ({ page }) => {
  let analyses = 0;
  await page.route("**/api/jobs/import", route => route.fulfill({ status: 502, json: { code: "SOURCE_NOT_AVAILABLE" } }));
  await page.route("**/api/jobs/requirements", route => { analyses++; return route.fulfill({ json: { facts: [], requirements: [] } }); });
  await page.goto("/jobs/analyze");
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(page.locator(".workflow-notice")).toContainText("Vi har ikke fått et lesbart utdrag");
  await page.clock.fastForward(60000);
  expect(analyses).toBe(0);
});
