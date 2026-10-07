import { expect, test } from "@playwright/test";

const source = "Vi søker en utvikler. Du må ha erfaring med Kotlin. PostgreSQL er en fordel.";
const result = { requirements: [{ label: "Kotlin", kind: "REQUIRED", quote: "Du må ha erfaring med Kotlin." }] };

test("renders cited requirements and marks edited source as outdated", async ({ page }) => {
  await page.route("**/api/jobs/requirements", (route) => route.fulfill({ json: result }));
  await page.goto("/");
  await page.getByRole("textbox", { name: "Stillingsannonse" }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
  await expect(page.getByText("Må-krav", { exact: true })).toBeVisible();
  await expect(page.locator("blockquote")).toHaveText("Du må ha erfaring med Kotlin.");
  await page.getByRole("textbox", { name: "Stillingsannonse" }).fill(source + " Ny tekst.");
  await expect(page.getByRole("region", { name: "Analyser en stillingsannonse" }).getByRole("alert")).toContainText("Annonsen er endret");
});

test("English request and UI error retain the advertisement", async ({ page }) => {
  let requestedLocale = "";
  await page.route("**/api/jobs/requirements", (route) => {
    requestedLocale = route.request().postDataJSON().locale;
    return route.fulfill({ status: 429, json: { code: "AI_RATE_LIMITED" } });
  });
  await page.goto("/");
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await page.getByRole("textbox", { name: "Job advertisement" }).fill(source);
  await page.getByRole("button", { name: "Analyze", exact: true }).click();
  await expect(page.getByRole("region", { name: "Analyze a job advertisement" }).getByRole("alert")).toContainText("Groq quota");
  await expect(page.getByRole("textbox", { name: "Job advertisement" })).toHaveValue(source);
  expect(requestedLocale).toBe("en");
});

test("real proxy rejects invalid input without an AI call", async ({ request }) => {
  const response = await request.post("/api/jobs/requirements", { data: { text: "short", locale: "nb" } });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ code: "INVALID_INPUT" });
});

test("real browser proxy reaches the backend and reports missing configuration", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Stillingsannonse" }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  await expect(page.getByRole("region", { name: "Analyser en stillingsannonse" }).getByRole("alert")).toContainText("AI er ikke konfigurert");
  await expect(page.getByRole("textbox", { name: "Stillingsannonse" })).toHaveValue(source);
});

test("cross-origin and oversized requests are rejected", async ({ request }) => {
  const crossOrigin = await request.post("/api/jobs/requirements", {
    headers: { origin: "https://other.example" }, data: { text: source, locale: "nb" },
  });
  expect(crossOrigin.status()).toBe(403);
  const oversized = await request.post("/api/jobs/requirements", { data: { text: "x".repeat(100001), locale: "nb" } });
  expect(oversized.status()).toBe(413);
});
