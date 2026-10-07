import { expect, test } from "@playwright/test";
const url = "https://arbeidsplassen.nav.no/stillinger/stilling/12345678-1234-1234-1234-123456789abc";
const text = "Utvikler\nDu må ha erfaring med Kotlin og PostgreSQL.";
test("URL import is reviewed before AI analysis and source evidence stays available", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/jobs/import", route => route.fulfill({ json: { sourceUrl: url, title: "Utvikler", text, retrievedAt: "2026-10-07T00:00:00Z" } }));
  await page.route("**/api/jobs/requirements", route => { calls++; return route.fulfill({ json: { requirements: [{ label: "Kotlin", kind: "REQUIRED", quote: "Du må ha erfaring med Kotlin og PostgreSQL." }] } }); });
  await page.goto("/");
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Hent annonse", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Stillingsannonse", exact: true })).toHaveValue(text);
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
  await page.getByText("Se kildegrunnlaget", { exact: true }).click();
  await expect(page.locator("pre")).toHaveText(text);
  expect(calls).toBe(1);
});
test("real unsupported source keeps URL and offers manual fallback in both languages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await page.getByRole("textbox", { name: "Job advertisement link" }).fill("https://www.finn.no/job/ad/123");
  await page.getByRole("button", { name: "Fetch advertisement", exact: true }).click();
  await expect(page.getByRole("region", { name: "Analyze a job advertisement" }).getByRole("alert")).toContainText("not supported");
  await expect(page.getByRole("textbox", { name: "Job advertisement link" })).toHaveValue("https://www.finn.no/job/ad/123");
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
  await expect(page.getByRole("button", { name: "Hent annonse", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
