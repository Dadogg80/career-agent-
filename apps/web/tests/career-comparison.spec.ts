import { expect, test } from "@playwright/test";
import { careerPeriodDifferences } from "../lib/career-comparison";
import { emptyEntry, type CareerEntry, type EntryContent } from "../lib/career-entries";

const time = "2026-10-09T00:00:00Z";
function entry(index: number, content: Partial<EntryContent> = {}): CareerEntry {
  return { id: `92345678-1234-1234-1234-${String(index).padStart(12, "0")}`, revision: 1,
    status: "CONFIRMED", createdAt: time, updatedAt: time,
    content: { ...emptyEntry, title: "Developer", organization: "Example AS", startMonth: "2020-01",
      endMonth: "2023-01", sourceNote: "Fictional document", ...content } };
}

test("period comparison preserves parallel roles, clients, unknown endpoints and rehires", () => {
  const a = entry(1);
  const b = entry(2, { endMonth: "2023-02" });
  expect(careerPeriodDifferences([a, b])).toHaveLength(1);
  for (const change of [
    { title: "Lead" }, { client: "Other client" }, { deliveryRole: "Tech lead" },
    { organization: "Example Digital AS" }, { kind: "PROJECT" as const },
    { startMonth: null }, { endMonth: null },
    { startMonth: "2024-01", endMonth: "2025-01" },
    { startMonth: "2020-01", endMonth: "2023-01" },
  ]) expect(careerPeriodDifferences([a, { ...b, content: { ...b.content, ...change } }])).toEqual([]);
  expect(careerPeriodDifferences([a, { ...b, status: "REJECTED" }])).toEqual([]);
  expect(careerPeriodDifferences([a, entry(3, { endMonth: null, ongoing: true })])).toHaveLength(1);
  expect(careerPeriodDifferences([a, entry(4, { title: " developer ", organization: "EXAMPLE  AS", endMonth: "2023-02" })])).toHaveLength(1);
});

test("career comparison loads both sources on demand, keeps facts untouched and correction clears a difference", async ({ page }) => {
  let entries = [entry(1), entry(2, { endMonth: "2023-02" }), entry(3, { title: "Lead" })];
  let sourceReads = 0, writes = 0;
  await page.route("**/api/auth/session", r => r.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
  await page.route("**/api/profile/me", r => r.fulfill({ json: { id: entries[0].id, displayName: "Fictional Pilot", preferredLanguage: "nb", revision: 1 } }));
  for (const path of ["claims", "documents"]) await page.route(`**/api/profile/me/${path}`, r => r.fulfill({ json: [] }));
  await page.route("**/api/profile/me/entries**", r => {
    const url = r.request().url();
    if (url.endsWith("/evidence")) {
      sourceReads++;
      const current = entries.find(item => url.includes(item.id))!;
      return r.fulfill({ json: [{ revision: 1, documentId: null, originalName: `Fictional-${current.id.slice(-1)}.pdf`, quote: "Developer at Example AS, 2020–2023.", periodText: "2020–2023" }] });
    }
    if (r.request().method() === "GET") return r.fulfill({ json: entries });
    expect(r.request().method()).toBe("PUT");
    expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");
    const input = r.request().postDataJSON(), index = entries.findIndex(item => url.endsWith(item.id));
    expect(input.revision).toBe(entries[index].revision);
    entries[index] = { ...entries[index], content: input.content, revision: 2, status: "UNVERIFIED" };
    writes++;
    return r.fulfill({ json: entries[index] });
  });
  await page.goto("/career/profile");
  await page.getByRole("button", { name: "Arbeid og utdanning", exact: true }).click();
  const panel = page.locator("#profile-career-history");
  await expect(panel.locator(".career-entry")).toHaveCount(3);
  await expect(panel.getByText("1 mulige periodeforskjeller", { exact: true })).toBeVisible();
  expect(sourceReads).toBe(0);
  await panel.getByRole("button", { name: "Sammenlign historikk", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Developer at Example AS, 2020–2023.", { exact: true })).toHaveCount(2);
  await expect(dialog.getByText("Importrevisjon 1 · 2020–2023 · originalen er slettet", { exact: true })).toHaveCount(2);
  expect(sourceReads).toBe(2); expect(writes).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/tmp/career-period-comparison-mobile.png" });
  await dialog.getByRole("button", { name: "Rett dette punktet", exact: true }).first().click();
  await page.getByRole("dialog").locator("#entry-end").fill("2023-02");
  await page.getByRole("dialog").getByRole("button", { name: "Lagre som ubekreftet", exact: true }).click();
  await expect(panel.getByText("1 mulige periodeforskjeller", { exact: true })).toHaveCount(0);
  await expect(panel.getByText("Ubekreftet", { exact: true })).toBeVisible();
  expect(entries).toHaveLength(3); expect(writes).toBe(1);
  await page.getByRole("combobox", { name: "Språk", exact: true }).selectOption("en");
  await panel.getByRole("button", { name: "Compare career entries", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Compare history and sources" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  expect(writes).toBe(1);
});

test("one unavailable source does not hide the other record and manual comparison supports distinct employers", async ({ page }) => {
  const entries = [entry(1), entry(2, { organization: "Other AS", title: "Technical lead" })];
  let reads = 0;
  await page.route("**/api/auth/session", r => r.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
  await page.route("**/api/profile/me", r => r.fulfill({ json: { id: entries[0].id, displayName: "Fictional Pilot", preferredLanguage: "nb", revision: 1 } }));
  for (const path of ["claims", "documents"]) await page.route(`**/api/profile/me/${path}`, r => r.fulfill({ json: [] }));
  await page.route("**/api/profile/me/entries**", r => {
    expect(r.request().method()).toBe("GET");
    if (!r.request().url().endsWith("/evidence")) return r.fulfill({ json: entries });
    reads++;
    if (r.request().url().includes(entries[0].id)) return r.fulfill({ status: 503, json: { code: "ENTRY_UNAVAILABLE" } });
    return r.fulfill({ json: [{ revision: 1, documentId: entries[1].id, originalName: "Fictional certificate.pdf", quote: "Technical lead at Other AS.", periodText: "2020–2023" }] });
  });
  await page.goto("/career/profile");
  await page.getByRole("button", { name: "Arbeid og utdanning", exact: true }).click();
  const panel = page.locator("#profile-career-history");
  await expect(panel.locator(".career-entry")).toHaveCount(2);
  await panel.getByRole("button", { name: "Sammenlign historikk", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("alert")).toContainText("Kildene kunne ikke hentes");
  await expect(dialog.getByText("Technical lead at Other AS.", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Developer", exact: true })).toBeVisible();
  expect(reads).toBe(2);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(reads).toBe(2);
});
