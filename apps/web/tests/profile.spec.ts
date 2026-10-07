import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/profile/me/documents", route => route.fulfill({ json: [] }));
  await page.route("**/api/profile/me/claims", route => route.fulfill({ json: [] }));
});

const id = "12345678-1234-1234-1234-123456789abc";
test("profile save uses the session CSRF token, reopens persisted data and supports English", async ({ page }) => {
  let stored: { id: string; displayName: string; preferredLanguage: string; revision: number } | null = null;
  let reads = 0;
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf-token" } }));
  await page.route("**/api/profile/me", route => {
    if (route.request().method() === "GET") {
      reads++; return stored ? route.fulfill({ json: stored }) : route.fulfill({ status: 404, json: { code: "PROFILE_NOT_CREATED" } });
    }
    expect(route.request().headers()["x-csrf-token"]).toBe("synthetic-csrf-token");
    const body = route.request().postDataJSON();
    expect(Object.keys(body).sort()).toEqual(["displayName", "preferredLanguage", "revision"]);
    expect(body.revision).toBe(stored?.revision ?? 0);
    stored = { id, displayName: body.displayName.trim(), preferredLanguage: body.preferredLanguage, revision: (stored?.revision ?? 0) + 1 };
    return route.fulfill({ json: stored });
  });
  await page.goto("/career/profile");
  await page.getByRole("textbox", { name: "Navn", exact: true }).fill(" Synthetic Pilot ");
  await page.getByRole("button", { name: "Lagre profil", exact: true }).click();
  await expect(page.getByText("Profilen er lagret.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Navn", exact: true })).toHaveValue("Synthetic Pilot");
  expect(reads).toBe(2);
  await page.getByRole("combobox", { name: "Språk", exact: true }).selectOption("en");
  await page.getByRole("combobox", { name: "Preferred profile language", exact: true }).selectOption("en");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  expect(stored!.preferredLanguage).toBe("en"); expect(stored!.revision).toBe(2);
});

test("profile conflicts preserve the draft until explicitly loading the saved version", async ({ page }) => {
  let stored = { id, displayName: "Original", preferredLanguage: "nb", revision: 1 };
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic" } }));
  await page.route("**/api/profile/me", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: stored });
    stored = { ...stored, displayName: "Changed elsewhere", revision: 2 };
    return route.fulfill({ status: 409, json: { code: "PROFILE_CONFLICT" } });
  });
  await page.goto("/career/profile");
  await page.getByRole("textbox", { name: "Navn", exact: true }).fill("My draft");
  await page.getByRole("button", { name: "Lagre profil", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "annen fane" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Navn", exact: true })).toHaveValue("My draft");
  await page.getByRole("button", { name: "Hent lagret versjon", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Navn", exact: true })).toHaveValue("Changed elsewhere");
});

test("unconfigured identity shows honest availability without exposing a profile form", async ({ page }) => {
  await page.goto("/career/profile");
  await expect(page.getByText("Profilinnlogging er ikke aktivert i dette miljøet ennå.", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Navn", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Logg inn", exact: true })).toHaveCount(0);
});

test("an expired save session offers sign-in and stops presenting a writable profile", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic" } }));
  await page.route("**/api/profile/me", route => route.request().method() === "GET"
    ? route.fulfill({ json: { id, displayName: "Synthetic Pilot", preferredLanguage: "nb", revision: 1 } })
    : route.fulfill({ status: 401, json: { code: "AUTH_REQUIRED" } }));
  await page.goto("/career/profile");
  await page.getByRole("button", { name: "Lagre profil", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Sesjonen er utløpt" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Logg inn", exact: true })).toHaveAttribute("href", "/api/auth/login");
  await expect(page.getByRole("textbox", { name: "Navn", exact: true })).toHaveCount(0);
});

test("private proxies reject cross-origin, spoofed ownership and oversized input and require login", async ({ request }) => {
  expect((await request.get("/api/profile/me")).status()).toBe(401);
  expect((await request.get("/api/auth/session", { headers: { Origin: "https://other.example" } })).status()).toBe(403);
  expect((await request.put("/api/profile/me", { headers: { Origin: "https://other.example" }, data: { displayName: "Blocked", preferredLanguage: "nb", revision: 0 } })).status()).toBe(403);
  expect((await request.put("/api/profile/me", { data: { displayName: "Blocked", preferredLanguage: "nb", revision: 0, ownerId: id } })).status()).toBe(400);
  expect((await request.put("/api/profile/me", { data: { displayName: "x".repeat(10000), preferredLanguage: "nb", revision: 0 } })).status()).toBe(400);
  const session = await request.get("/api/auth/session");
  expect(session.headers()["cache-control"]).toBe("no-store");
  const cookie = session.headers()["set-cookie"];
  expect(cookie).toContain("CAREER_SESSION="); expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=Lax");
  expect((await request.post("/api/auth/logout")).status()).toBe(403);
});
