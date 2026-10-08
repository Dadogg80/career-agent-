import { expect, test } from "@playwright/test";
const session = { authenticated: false, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-entry-csrf" };
const id = "12345678-1234-1234-1234-123456789abc";
const profile = { id, displayName: "Fictional Pilot", preferredLanguage: "nb", revision: 1 };
const claim = { id, skill: "Kotlin", statement: "Built APIs using Kotlin", context: "Fictional project", sourceNote: "Own statement", status: "CONFIRMED", revision: 2, createdAt: "2026-10-07T00:00:00Z", updatedAt: "2026-10-07T00:00:00Z" };

test("landing explains the workflow and leads to guest analysis without private calls", async ({ page }) => {
 const errors: string[] = []; let privateCalls = 0; page.on("pageerror", error => errors.push(error.message));
 await page.route("**/api/profile/**", route => { privateCalls++; return route.fulfill({ status: 401, json: { code: "AUTH_REQUIRED" } }); });
 await page.goto("/");
 await expect(page.getByRole("heading", { level: 1 })).toHaveText("Din erfaring.Din neste mulighet.");
 await expect(page.getByRole("button", { name: "Analyser lenke" })).toHaveCount(0);
 await page.screenshot({ path: "/tmp/career-landing-desktop.png", fullPage: true });
 await page.getByRole("link", { name: "Prøv stillingsanalyse", exact: true }).click();
 await expect(page).toHaveURL(/\/jobs\/analyze$/);
 await expect(page.getByRole("button", { name: "Analyser lenke", exact: true })).toBeVisible();
 expect(privateCalls).toBe(0); expect(errors).toEqual([]);
});

test("mobile landing language persists through dedicated sign-in and missing setup is actionable", async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 });
 await page.goto("/");
 await expect(page.locator("html")).toHaveAttribute("lang", "nb");
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 await page.screenshot({ path: "/tmp/career-landing-mobile.png", fullPage: true });
 await page.getByRole("combobox", { name: "Språk", exact: true }).selectOption("en");
 await page.getByRole("link", { name: "Open your workspace" }).click();
 await expect(page).toHaveURL(/\/login$/);
 await expect(page.getByRole("heading", { name: "Sign in to Career Agent" })).toBeVisible();
 await expect(page.getByRole("heading", { name: "Local sign-in needs to be started" })).toBeVisible();
 await expect(page.getByRole("link", { name: "Continue to secure sign-in" })).toHaveCount(0);
 await page.reload(); await expect(page.locator("html")).toHaveAttribute("lang", "en");
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 await page.screenshot({ path: "/tmp/career-login-mobile.png", fullPage: true });
});

test("configured private entry routes lead to sign-in without loading private data", async ({ page }) => {
 let reads = 0; await page.route("**/api/auth/session", r => r.fulfill({ json: session }));
 await page.route("**/api/profile/**", r => { reads++; return r.fulfill({ status: 401, json: { code: "AUTH_REQUIRED" } }); });
 await page.goto("/career/profile");
 await expect(page).toHaveURL(/\/login$/);
 await expect(page.getByRole("link", { name: "Fortsett til sikker innlogging" })).toHaveAttribute("href", "/api/auth/login");
 await expect(page.getByRole("textbox", { name: "Navn", exact: true })).toHaveCount(0);
 expect(reads).toBe(0);
 await page.goto("/login?login=failed");
 await expect(page.locator("main").getByRole("alert")).toContainText("Innloggingen ble ikke fullført");
});

test("signed-in login opens the dashboard with honest counts and review priorities", async ({ page }) => {
 let aiCalls = 0;
 await page.route("**/api/auth/session", r => r.fulfill({ json: { ...session, authenticated: true } }));
 await page.route("**/api/profile/me", r => r.fulfill({ json: profile }));
 await page.route("**/api/profile/me/claims", r => r.fulfill({ json: [claim, { ...claim, id: "22345678-1234-1234-1234-123456789abc", status: "UNVERIFIED", revision: 1 }] }));
 await page.route("**/api/profile/me/jobs", r => r.fulfill({ json: [] }));
 await page.route("**/api/jobs/**", r => { aiCalls++; return r.fulfill({ status: 503 }); });
 await page.goto("/login"); await expect(page).toHaveURL(/\/dashboard$/);
 await expect(page.getByRole("heading", { name: "Se gjennom kompetanseforslagene" })).toBeVisible();
 await expect(page.locator(".dashboard-stat").filter({ hasText: "Bekreftede kompetansepunkter" }).locator("strong")).toHaveText("1");
 await expect(page.locator(".dashboard-stat").filter({ hasText: "Lagrede stillinger" }).locator("strong")).toHaveText("0");
 await expect(page.locator(".workspace-navigation a[aria-current='page']")).toContainText("Oversikt");
 await page.screenshot({ path: "/tmp/career-dashboard-desktop.png", fullPage: true });
 expect(aiCalls).toBe(0);
 await page.route("**/api/profile/me/documents", r => r.fulfill({json:[]}));
 await page.route("**/api/profile/me/entries", r => r.fulfill({json:[]}));
 await page.getByRole("link", {name:"Gjennomgå kompetanse",exact:true}).click();
 await expect(page.getByRole("button", {name:"Din kompetanse",exact:true})).toHaveAttribute("aria-pressed","true");
 await expect(page.locator("#profile-competencies")).toBeVisible();
 await expect(page.locator("#profile-documents")).toBeHidden();
});

test("mobile navigation is keyboard accessible and sign-out clears the workspace", async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 }); let authenticated = true; let logoutCalls = 0;
 await page.route("**/api/auth/session", r => r.fulfill({ json: { ...session, authenticated } }));
 await page.route("**/api/profile/me", r => r.fulfill({ status: 404, json: { code: "PROFILE_NOT_CREATED" } }));
 await page.route("**/api/auth/logout", r => { expect(r.request().headers()["x-csrf-token"]).toBe(session.csrfToken); logoutCalls++; authenticated = false; return r.fulfill({ status: 204 }); });
 await page.goto("/dashboard");
 await expect(page.getByRole("heading", { name: "Start med din kandidatprofil" })).toBeVisible();
 await page.getByRole("button", { name: "Åpne meny" }).click();
 await expect(page.getByRole("dialog")).toBeVisible();
 await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0);
 await expect(page.getByRole("button", { name: "Åpne meny" })).toBeFocused();
 await page.getByRole("button", { name: "Åpne meny" }).click();
 await page.getByRole("dialog").getByRole("link", { name: "Stillingsanalyse", exact: false }).click();
 await expect(page).toHaveURL(/\/jobs\/analyze$/); await expect(page.getByRole("dialog")).toHaveCount(0);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 await page.getByRole("button", { name: "Logg ut av Career Agent", exact: true }).click();
 await expect(page).toHaveURL(/\/login$/); expect(logoutCalls).toBe(1);
 await page.goto("/dashboard"); await expect(page).toHaveURL(/\/login$/);
});

test("dashboard failures do not present missing data as zero or invent a next action", async ({ page }) => {
 await page.route("**/api/auth/session", r => r.fulfill({ json: { ...session, authenticated: true } }));
 await page.route("**/api/profile/me", r => r.fulfill({ json: profile }));
 await page.route("**/api/profile/me/claims", r => r.fulfill({ status: 503, json: { code: "CLAIM_UNAVAILABLE" } }));
 await page.route("**/api/profile/me/jobs", r => r.fulfill({ status: 503, json: { code: "SAVED_JOB_UNAVAILABLE" } }));
 await page.goto("/dashboard");
 await expect(page.locator("main").getByRole("alert")).toContainText("Noen tall kunne ikke hentes");
 await expect(page.locator(".dashboard-stat strong")).toHaveText(["—", "—", "—"]);
 await expect(page.getByRole("heading", { name: "Utforsk ditt arbeidsområde" })).toBeVisible();
});
