import { expect, test, type Page } from "@playwright/test";
import type { CompetencyClaim } from "../lib/claims";
import type { CareerEntry } from "../lib/career-entries";
import type { ClaimContextOverview, ContextCommand } from "../lib/claim-contexts";
const id = "12345678-1234-1234-1234-123456789abc";
const entryId = "22345678-1234-1234-1234-123456789abc";
const time = "2026-10-07T00:00:00Z";
const claim: CompetencyClaim = { id, skill: "Next.js", statement: "Built a patient portal using Next.js.", context: "Example Health", sourceNote: "Synthetic document", sourceQuote: "Built a patient portal using Next.js.", sourceDocumentId: id, status: "CONFIRMED", confirmationBasis: "DOCUMENT", revision: 1, createdAt: time, updatedAt: time };
const entry: CareerEntry = { id: entryId, content: { kind: "PROJECT", title: "Patient portal", organization: "Example Health", client: "Example Clinic", deliveryRole: "Developer", startMonth: "2023-08", endMonth: "2026-01", ongoing: false, description: "Portal implementation", sourceNote: "Synthetic document" }, status: "UNVERIFIED", revision: 1, createdAt: time, updatedAt: time };
const initial = (): ClaimContextOverview => ({ claimRevision: 1, links: [{ entry, version: 1, state: "CURRENT", basis: "DOCUMENT", sourceDocumentId: id, sourceQuote: "Example Health\nBuilt a patient portal using Next.js." }] });
async function profile(page: Page) {
  await page.route("**/api/auth/session", r => r.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
  await page.route("**/api/profile/me", r => r.fulfill({ json: { id, displayName: "Synthetic Pilot", preferredLanguage: "nb", revision: 1 } }));
  await page.route("**/api/profile/me/documents", r => r.fulfill({ json: [] }));
  await page.route("**/api/profile/me/claims", r => r.fulfill({ json: [claim] }));
  await page.route("**/api/profile/me/entries", r => r.fulfill({ json: [entry] }));
  await page.goto("/career/profile"); await page.getByRole("button", { name: "Din kompetanse", exact: true }).click();
}

test("relationships load on demand, show source and draft status, and allow removal and explicit relinking without changing confirmation", async ({ page }) => {
  let reads = 0; const writes: ContextCommand[] = []; let stored = initial();
  await page.route(`**/api/profile/me/claims/${id}/contexts`, r => {
    if (r.request().method() === "GET") { reads++; return r.fulfill({ json: stored }); }
    expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");
    const body = r.request().postDataJSON() as ContextCommand; writes.push(body);
    expect(body.claimRevision).toBe(1); expect(body.entryRevision).toBe(1); expect(body.version).toBe(stored.links[0].version);
    stored = { ...stored, links: [{ ...stored.links[0], version: body.version + 1, state: body.decision === "UNLINK" ? "REMOVED" : "CURRENT", basis: "USER", sourceDocumentId: null, sourceQuote: null }] };
    return r.fulfill({ json: stored });
  });
  await profile(page);
  const card = page.getByRole("article", { name: "Next.js", exact: true });
  await expect(card).toBeVisible(); expect(reads).toBe(0);
  await card.getByRole("button", { name: "Arbeid og prosjekter", exact: true }).click();
  await expect(card.locator(".career-context-row")).toContainText("Example Health · Patient portal");
  await expect(card.locator(".career-context-row")).toContainText("historikk er utkast");
  await card.getByText("Kilde for koblingen", { exact: true }).click();
  await expect(card.locator(".career-context-row blockquote")).toContainText("Built a patient portal using Next.js.");
  await page.screenshot({ path: "/tmp/career-context-desktop.png", fullPage: true });
  await card.getByRole("button", { name: "Fjern kobling", exact: true }).click();
  await expect(card.locator(".career-context-row")).toHaveCount(0);
  await card.getByRole("button", { name: "Knytt til arbeid eller prosjekt", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Søk i karrierehistorikken", exact: true }).fill("Example Clinic");
  await expect(dialog.getByRole("button", { name: /Example Health · Patient portal/ })).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect.poll(async () => { const box = await dialog.boundingBox(); return !!box && box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 844; }).toBe(true);
  await page.screenshot({ path: "/tmp/career-context-picker-mobile.png", fullPage: false });
  await dialog.getByRole("button", { name: /Example Health · Patient portal/ }).click();
  await expect(dialog).toHaveCount(0);
  await expect(card.locator(".career-context-row")).toContainText("Valgt av deg");
  await expect(card.locator('[data-claim-status="CONFIRMED"]')).toHaveText("Dokumentert");
  expect(writes.map(x => x.decision)).toEqual(["UNLINK", "LINK"]);
  await page.reload(); await page.getByRole("button", { name: "Din kompetanse", exact: true }).click();
  await card.getByRole("button", { name: "Arbeid og prosjekter", exact: true }).click();
  await expect(card.locator(".career-context-row")).toContainText("Valgt av deg"); expect(writes).toHaveLength(2);
});

test("stale context asks for review, conflicts retain existing information, and retry requires a refreshed version", async ({ page }) => {
  const stored = initial(); stored.links[0] = { ...stored.links[0], state: "STALE", entry: { ...entry, revision: 2 } };
  let fail = true; let writes = 0;
  await page.route(`**/api/profile/me/claims/${id}/contexts`, r => {
    if (r.request().method() === "GET") return r.fulfill({ json: stored });
    writes++;
    if (fail) return r.fulfill({ status: 409, json: { code: "CONTEXT_CONFLICT" } });
    expect(r.request().postDataJSON().entryRevision).toBe(2);
    stored.links[0] = { ...stored.links[0], version: 2, state: "CURRENT", basis: "USER", sourceQuote: null, sourceDocumentId: null };
    return r.fulfill({ json: stored });
  });
  await profile(page); const card = page.getByRole("article", { name: "Next.js", exact: true });
  await card.getByRole("button", { name: "Arbeid og prosjekter", exact: true }).click();
  await expect(card.locator(".career-context-row")).toContainText("Gjennomgå på nytt");
  await card.getByRole("button", { name: "Bekreft tilknytningen", exact: true }).click();
  await expect(card.getByRole("status")).toContainText("Grunnlaget er endret");
  await expect(card.locator(".career-context-row")).toContainText("Example Health"); expect(writes).toBe(1);
  fail = false;
  await card.getByRole("button", { name: "Hent siste versjon", exact: true }).click();
  await card.getByRole("button", { name: "Bekreft tilknytningen", exact: true }).click();
  await expect(card.locator(".career-context-row")).toContainText("Valgt av deg"); expect(writes).toBe(2);
});

test("deleted originals retain proof and expired context access removes private profile content", async ({ page }) => {
  const stored = initial(); stored.links[0].sourceDocumentId = null; let expired = false;
  await page.route(`**/api/profile/me/claims/${id}/contexts`, r => expired ? r.fulfill({ status: 401, json: { code: "AUTH_REQUIRED" } }) : r.fulfill({ json: stored }));
  await profile(page); const card = page.getByRole("article", { name: "Next.js", exact: true });
  await card.getByRole("button", { name: "Arbeid og prosjekter", exact: true }).click();
  await card.getByText("Kilde for koblingen", { exact: true }).click();
  await expect(card).toContainText("Originalen er slettet; sitatet er bevart.");
  expired = true;
  await card.getByRole("button", { name: "Fjern kobling", exact: true }).click();
  await expect(page.getByRole("link", { name: "Logg inn", exact: true })).toBeVisible();
  await expect(card).toHaveCount(0);
});

test("real context proxy rejects ownership or documentary-basis injection, cross-origin writes, malformed IDs and unauthenticated access", async ({ request }) => {
  const path = `/api/profile/me/claims/${id}/contexts`;
  const body: ContextCommand = { entryId, claimRevision: 1, entryRevision: 1, version: 0, decision: "LINK" };
  expect((await request.get(path)).status()).toBe(401);
  // Missing CSRF is rejected before authentication on private writes.
  expect((await request.post(path, { data: body })).status()).toBe(403);
  expect((await request.post(path, { data: { ...body, basis: "DOCUMENT" } })).status()).toBe(400);
  expect((await request.post(path, { data: { ...body, ownerId: id } })).status()).toBe(400);
  expect((await request.post(path, { data: { ...body, version: -1 } })).status()).toBe(400);
  expect((await request.post(path, { data: body, headers: { Origin: "https://other.example" } })).status()).toBe(403);
  expect((await request.get("/api/profile/me/claims/not-a-uuid/contexts")).status()).toBe(400);
});
