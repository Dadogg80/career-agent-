import { test, expect } from "@playwright/test";

const source = `Example employer careers page — customer service adviser
Application deadline
As soon as possible
Work location: Remote / Oslo
Employment type: Permanent
Contact person: Alex Example
Phone: +1 202 555 0101
Email: alex@example.test
Kontaktperson: Kari Eksempel
Telefon: +1 202 555 0102
Spørsmål kan sendes til kari@example.test.
Vi tilbyr opplæring og pensjon.`;

for (const [width, failure] of [[1280, false], [390, true]] as const) {
  test(`source-neutral practical details survive partial AI and failure at ${width}px`, async ({ page }) => {
    let calls = 0;
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/status", r => r.fulfill({ json: { status: "UP" } }));
    await page.route("**/api/auth/session", r => r.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
    await page.route("**/api/jobs/requirements", r => {
      calls++;
      expect(r.request().postDataJSON().text).toBe(source);
      return failure ? r.fulfill({ status: 502, json: { code: "AI_INVALID_RESULT" } }) : r.fulfill({ json: {
        requirements: [], facts: [{ kind: "CONTACT", label: "Kontakt", value: "Alex Example", quote: "Contact person: Alex Example" }],
      } });
    });
    let saved: { facts: { value: string; quote: string }[]; text: string } | undefined;
    await page.route("**/api/profile/me/jobs", r => {
      saved = r.request().postDataJSON();
      return r.fulfill({ json: { id: "12345678-1234-1234-1234-123456789abc", content: r.request().postDataJSON(), createdAt: "2026-10-09T12:00:00Z" } });
    });
    await page.goto("/jobs/analyze");
    await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
    await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(source);
    await page.getByRole("button", { name: "Analyser", exact: true }).click();
    const overview = page.getByRole("region", { name: "Forstå stillingen" });
    await expect(overview.locator(".job-fact-deadline .fact-value")).toHaveText("As soon as possible");
    await expect(overview.locator(".job-fact-location .fact-value")).toHaveText("Remote / Oslo");
    for (const value of ["Alex Example", "Kari Eksempel", "+1 202 555 0101", "+1 202 555 0102", "alex@example.test", "kari@example.test"]) {
      await expect(overview.locator(".job-fact-contact")).toContainText(value);
    }
    await expect(overview.getByRole("link", { name: "alex@example.test", exact: true })).toHaveAttribute("href", "mailto:alex@example.test");
    await expect(overview.getByRole("link", { name: "+1 202 555 0101", exact: true })).toHaveAttribute("href", "tel:+12025550101");
    await page.getByRole("button", { name: "Lagre stillingen", exact: true }).click();
    await page.getByRole("button", { name: "Lagre versjonen", exact: true }).click();
    await expect(page.getByRole("link", { name: /Lagret · Se mine stillinger/ })).toBeVisible();
    expect(saved?.text).toBe(source);
    expect(saved?.facts.some(f => f.value === "kari@example.test")).toBe(true);
    expect(saved?.facts.every(f => source.replace(/\s+/g, " ").includes(f.quote.replace(/\s+/g, " ")))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(calls).toBe(1);
    await page.screenshot({ path: `/tmp/career-practical-details-${width}.png`, fullPage: true });
  });
}
