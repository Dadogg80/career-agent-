import { expect, test, type Page } from "@playwright/test";
import type { CompetencyClaim, ClaimRevision } from "../lib/claims";
const id = "12345678-1234-1234-1234-123456789abc";
const initial: CompetencyClaim = { id, skill: "Webhooks", statement: "Jeg implementerte betalingsvarsler.", context: "Synthetic project", sourceNote: "Egen hukommelse", status: "UNVERIFIED", revision: 1, createdAt: "2026-10-07T00:00:00Z", updatedAt: "2026-10-07T00:00:00Z" };
async function profile(page: Page) {
  await page.route("**/api/profile/me/documents", route => route.fulfill({ json: [] }));
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
  await page.route("**/api/profile/me", route => route.fulfill({ json: { id, displayName: "Synthetic Pilot", preferredLanguage: "nb", revision: 1 } }));
}
test("manual entry, explicit review, edit reset, history and delete require separate user actions", async ({ page }) => {
  await profile(page);
  let stored: CompetencyClaim | null = null;
  const history: ClaimRevision[] = [];
  let writes = 0;
  await page.route("**/api/profile/me/claims**", route => {
    const method = route.request().method(); const url = route.request().url();
    if (method === "GET") return route.fulfill({ json: url.endsWith("/history") ? { items: [...history].reverse(), total: history.length } : stored ? [stored] : [] });
    expect(route.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");
    const body = route.request().postDataJSON(); expect(body.ownerId).toBeUndefined(); writes++;
    if (method === "DELETE") { expect(body.revision).toBe(stored!.revision); stored = null; history.length = 0; return route.fulfill({ status: 204 }); }
    const action = url.endsWith("/review") ? body.decision === "CONFIRM" ? "USER_CONFIRMATION" : "USER_REJECTION" : method === "PUT" ? "CONTENT_EDIT" : "MANUAL_ENTRY";
    if (stored) expect(body.revision).toBe(stored.revision);
    stored = { ...initial, ...(stored ?? {}), ...(url.endsWith("/review") ? {} : body), status: action === "USER_CONFIRMATION" ? "CONFIRMED" : action === "USER_REJECTION" ? "REJECTED" : "UNVERIFIED", revision: (stored?.revision ?? 0) + 1 };
    const snapshot = stored!;
    history.push({ ...snapshot, action, recordedAt: snapshot.updatedAt, recordedBy: "PROFILE_OWNER" });
    return route.fulfill({ json: stored });
  });
  await page.goto("/career/profile");
  await page.getByRole("button", { name: "Legg til kompetanse", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Kompetanse", exact: true }).fill(initial.skill);
  await dialog.getByRole("textbox", { name: "Hva gjorde du selv?", exact: true }).fill(initial.statement);
  await dialog.getByRole("textbox", { name: "Prosjekt eller arbeidsforhold", exact: true }).fill(initial.context);
  await dialog.getByRole("textbox", { name: "Grunnlag / kilde", exact: true }).fill(initial.sourceNote);
  await dialog.getByRole("button", { name: "Lagre opplysning", exact: true }).click();
  const card = page.getByRole("article", { name: "Webhooks", exact: true });
  await expect(card.locator('[data-claim-status="UNVERIFIED"]')).toBeVisible();
  await card.getByRole("button", { name: "Bekreft", exact: true }).click();
  await expect(dialog).toContainText(initial.statement); expect(writes).toBe(1);
  await dialog.getByRole("button", { name: "Ja, dette beskriver min erfaring", exact: true }).click();
  await expect(card.locator('[data-claim-status="CONFIRMED"]')).toBeVisible();
  await card.getByRole("button", { name: "Rediger", exact: true }).click();
  await dialog.getByRole("textbox", { name: "Hva gjorde du selv?", exact: true }).fill("Jeg implementerte og testet betalingsvarsler.");
  await dialog.getByRole("button", { name: "Lagre opplysning", exact: true }).click();
  await expect(card.locator('[data-claim-status="UNVERIFIED"]')).toBeVisible();
  await card.getByRole("button", { name: "Historikk", exact: true }).click();
  await expect(dialog.getByText(initial.statement, { exact: true })).toHaveCount(2);
  await expect(dialog.getByText("Bekreftet av deg", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Avbryt", exact: true }).click();
  await card.getByRole("button", { name: "Avvis", exact: true }).click();
  await dialog.getByRole("button", { name: "Avvis denne opplysningen", exact: true }).click();
  await expect(card.locator('[data-claim-status="REJECTED"]')).toBeVisible();
  await page.getByRole("combobox", { name: "Språk", exact: true }).selectOption("en");
  await card.getByRole("button", { name: "Delete", exact: true }).click(); expect(writes).toBe(4);
  await dialog.getByRole("button", { name: "Delete statement and history", exact: true }).click();
  await expect(page.getByText("No competencies recorded yet.", { exact: true })).toBeVisible();
  expect(writes).toBe(5);
});

test("stale edits preserve the draft and expired claim access closes the private workspace", async ({ page }) => {
  await profile(page); let expired = false;
  await page.route("**/api/profile/me/claims**", route => route.request().method() === "GET" ? route.fulfill({ json: [initial] }) : route.fulfill({ status: expired ? 401 : 409, json: { code: expired ? "AUTH_REQUIRED" : "CLAIM_CONFLICT" } }));
  await page.goto("/career/profile");
  await page.getByRole("article", { name: "Webhooks", exact: true }).getByRole("button", { name: "Rediger", exact: true }).click();
  const dialog = page.getByRole("dialog"); const field = dialog.getByRole("textbox", { name: "Hva gjorde du selv?", exact: true });
  await field.fill("My retained draft");
  await dialog.getByRole("button", { name: "Lagre opplysning", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Utkastet er beholdt");
  await expect(field).toHaveValue("My retained draft");
  expired = true;
  await dialog.getByRole("button", { name: "Lagre opplysning", exact: true }).click();
  await expect(page.getByRole("link", { name: "Logg inn", exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: "Webhooks", exact: true })).toHaveCount(0);
});

test("claim proxies reject spoofed status and ownership and require authentication", async ({ request }) => {
  expect((await request.get("/api/profile/me/claims")).status()).toBe(401);
  expect((await request.post("/api/profile/me/claims", { data: { skill: "Kotlin", statement: "Used Kotlin", context: "Synthetic", sourceNote: "Recollection", status: "CONFIRMED", ownerId: id } })).status()).toBe(400);
  expect((await request.post(`/api/profile/me/claims/${id}/review`, { data: { revision: 1, decision: "CONFIRM" }, headers: { Origin: "https://other.example" } })).status()).toBe(403);
  expect((await request.get("/api/profile/me/claims/not-a-uuid/history")).status()).toBe(400);
});
