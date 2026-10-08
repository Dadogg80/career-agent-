import { expect, test } from "@playwright/test";
const id = "12345678-1234-1234-1234-123456789abc";
const time = "2026-10-07T00:00:00Z";
const proposal = (prefix: string, skill: string) => ({ id: prefix + id.slice(1), skill, statement: `Implemented ${skill} in a fictional project.`, context: "Fictional project", sourceNote: "Synthetic CV", sourceDocumentId: id, sourceQuote: `Implemented ${skill}`, status: "UNVERIFIED", revision: 1, createdAt: time, updatedAt: time });
async function identity(page: import("@playwright/test").Page) {
 await page.route("**/api/auth/session", r => r.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-review-csrf" } }));
 await page.route("**/api/profile/me", r => r.fulfill({ json: { id, displayName: "Fictional Pilot", preferredLanguage: "nb", revision: 1 } }));
 await page.route("**/api/profile/me/documents", r => r.fulfill({ json: [] }));
}

test("guided review shows sources and requires one explicit decision per proposal while skip remains unconfirmed", async ({ page }) => {
 await identity(page); await page.setViewportSize({ width: 390, height: 844 });
 let claims = [proposal("1", "Kotlin"), proposal("2", "React"), proposal("3", "Docker")]; const writes: string[] = [];
 await page.route("**/api/profile/me/claims**", r => {
  if (r.request().method() === "GET") return r.fulfill({ json: claims });
  const input = r.request().postDataJSON(); const selected = claims.find(c => r.request().url().includes(c.id))!;
  expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-review-csrf"); expect(input.revision).toBe(selected.revision);
  writes.push(`${selected.skill}:${input.decision}`);
  claims = claims.map(c => c.id === selected.id ? { ...c, status: input.decision === "CONFIRM" ? "CONFIRMED" : "REJECTED", revision: c.revision + 1 } : c);
  return r.fulfill({ json: claims.find(c => c.id === selected.id) });
 });
 await page.goto("/career/profile"); await page.getByRole("button", { name: "Gjennomgå 3 forslag", exact: true }).click();
 const dialog = page.getByRole("dialog");
 await expect(dialog.locator("blockquote")).toHaveText("Implemented Kotlin"); expect(writes).toEqual([]);
 await dialog.getByRole("button", { name: "Stemmer · Bekreft min erfaring", exact: true }).click();
 await expect(dialog.getByRole("heading", { name: "React", exact: true })).toBeVisible();
 await expect(dialog.getByText("Forslag 2 / 3", { exact: true })).toBeVisible(); expect(writes).toEqual(["Kotlin:CONFIRM"]);
 await dialog.getByRole("button", { name: "Hopp over", exact: true }).click();
 await expect(dialog.getByRole("heading", { name: "Docker", exact: true })).toBeVisible();
 await dialog.getByRole("button", { name: "Stemmer ikke · Avvis", exact: true }).click();
 await expect(page.getByRole("dialog")).toHaveCount(0);
 await expect(page.getByText("Gjennomgangen er ferdig. Punkter du hoppet over, er fortsatt ubekreftet.", { exact: true })).toBeVisible();
 expect(writes).toEqual(["Kotlin:CONFIRM", "Docker:REJECT"]); expect(claims[1].status).toBe("UNVERIFIED");
 await expect(page.getByRole("button", { name: "Gjennomgå 1 forslag", exact: true })).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({ path: "/tmp/career-guided-review-mobile.png", fullPage: true });
});

test("review respects visible filtering and keeps a conflicting proposal open without retries", async ({ page }) => {
 await identity(page); let writes = 0;
 await page.route("**/api/profile/me/claims**", r => {
  if (r.request().method() === "GET") return r.fulfill({ json: [proposal("1", "Kotlin"), proposal("2", "React")] });
  writes++; return r.fulfill({ status: 409, json: { code: "CLAIM_CONFLICT" } });
 });
 await page.goto("/career/profile"); await page.getByRole("combobox", { name: "Språk", exact: true }).selectOption("en");
 await page.getByRole("textbox", { name: "Search competencies", exact: true }).fill("Kotlin");
 await page.getByRole("button", { name: "Review 1 proposals", exact: true }).click();
 const dialog = page.getByRole("dialog"); await expect(dialog.getByRole("heading", { name: "React", exact: true })).toHaveCount(0);
 await dialog.getByRole("button", { name: "Accurate · Confirm my experience", exact: true }).click();
 await expect(dialog.getByRole("alert")).toContainText("another tab");
 await expect(dialog.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible(); expect(writes).toBe(1);
 await dialog.getByRole("button", { name: "Cancel", exact: true }).click(); await expect(page.getByRole("dialog")).toHaveCount(0);
});
