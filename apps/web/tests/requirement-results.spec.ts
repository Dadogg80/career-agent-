import { expect, test } from "@playwright/test";
const source = "Vi bygger integrasjoner i et produktteam. Kotlin er nødvendig. PostgreSQL er en fordel. Vi bruker skyplattformer.";
const requirements = [
  { label: "Kotlin", kind: "REQUIRED", quote: "Kotlin er nødvendig." },
  { label: "PostgreSQL", kind: "PREFERRED", quote: "PostgreSQL er en fordel." },
  { label: "Skyplattformer", kind: "UNCLEAR", quote: "Vi bruker skyplattformer." },
];
test("compact filters expose source context and keyboard-accessible details without more AI calls", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/jobs/requirements", route => { calls++; return route.fulfill({ json: { facts: [], requirements } }); });
  await page.goto("/");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  const preferred = page.getByRole("button", { name: "Ønsket 1", exact: true });
  await preferred.click();
  await expect(preferred).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Se detaljer: Kotlin", exact: true })).toHaveCount(0);
  const trigger = page.getByRole("button", { name: "Se detaljer: PostgreSQL", exact: true });
  await trigger.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("blockquote")).toHaveText("PostgreSQL er en fordel.");
  await expect(dialog.locator(".quote-context")).toHaveText(source);
  await expect(dialog).toContainText("ønsket kompetanse");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await page.getByRole("button", { name: "View details: PostgreSQL", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Source quotation");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  expect(calls).toBe(1);
});
test("long requirement titles and the detail dialog fit on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const label = "Praktisk erfaring med backend-utvikling, API-design, integrasjoner og skalerbare tjenestearkitekturer i produksjon";
  await page.route("**/api/jobs/requirements", route => route.fulfill({ json: { facts: [], requirements: [{ ...requirements[0], label }] } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  await page.getByRole("button", { name: `Se detaljer: ${label}`, exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: label, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Lukk", exact: true }).click();
  await page.getByRole("button", { name: "Ønsket 0", exact: true }).click();
  await expect(page.getByText("Ingen krav i denne kategorien.")).toBeVisible();
});
