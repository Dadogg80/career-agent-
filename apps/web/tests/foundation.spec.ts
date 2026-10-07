import { expect, test } from "@playwright/test";

test("Norwegian is the default and the real backend is reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Forstå din neste mulighet.");
  await expect(page.locator("html")).toHaveAttribute("lang", "nb");
  await expect(page.getByRole("status")).toHaveText("Tjenesten er tilgjengelig");
});

test("English selection translates the page and survives reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Understand your next opportunity.");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("status")).toHaveText("The service is available");
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Understand your next opportunity.");
});

test("an unavailable service shows an error and retry can recover", async ({ page }) => {
  await page.route("**/api/status", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"status":"UNAVAILABLE"}' }));
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Tjenesten er ikke tilgjengelig akkurat nå");
  await page.unroute("**/api/status");
  await page.getByRole("button", { name: "Prøv igjen" }).click();
  await expect(page.getByRole("status")).toHaveText("Tjenesten er tilgjengelig");
});
