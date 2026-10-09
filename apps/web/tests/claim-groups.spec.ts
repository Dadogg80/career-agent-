import { expect, test, type Page } from "@playwright/test";
import type { CompetencyClaim } from "../lib/claims";
const time = "2026-10-07T00:00:00Z";
const id = (n: number) => `${n}2345678-1234-1234-1234-123456789abc`;
const claim = (n: number, skill: string, statement: string, context: string, status: CompetencyClaim["status"] = "CONFIRMED"): CompetencyClaim => ({ id: id(n), skill, statement, context, status, confirmationBasis: status === "CONFIRMED" ? "USER" : "NONE", sourceNote: "Synthetic document", sourceQuote: statement, sourceDocumentId: id(1), revision: 2, createdAt: time, updatedAt: time });
async function identity(page: Page) {
  await page.route("**/api/auth/session", r => r.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
  await page.route("**/api/profile/me", r => r.fulfill({ json: { id: id(1), displayName: "Synthetic Pilot", preferredLanguage: "nb", revision: 1 } }));
  await page.route("**/api/profile/me/documents", r => r.fulfill({ json: [] }));
}

test("one skill card combines evidence across projects while drafts stay separate and edits affect one contribution", async ({ page }) => {
  await identity(page);
  let claims = [claim(1, "Next.js", "Built a patient portal.", "Example Health"), claim(2, "nextjs", "Built an emissions platform.", "Example Carbon"), claim(3, "NEXT.JS", "Built a patient portal.", "Example Clinic"), claim(4, "Next.js", "Prototyped a dashboard.", "Example Lab", "UNVERIFIED"), claim(5, "Next.js", "Incorrect legacy description.", "Example Old", "REJECTED"), claim(6, "React Native", "Built a mobile app.", "Example Mobile")];
  let writes = 0; let aiCalls = 0;
  await page.route("**/api/profile/me/claims**", r => {
    const request = r.request();
    if (request.url().endsWith("/evidence")) return r.fulfill({ json: [] });
    if (request.method() === "GET") return r.fulfill({ json: claims });
    const index = claims.findIndex(c => request.url().includes(c.id));
    const input = request.postDataJSON();
    expect(request.headers()["x-csrf-token"]).toBe("synthetic-csrf"); expect(input.revision).toBe(claims[index].revision);
    writes++;
    claims[index] = { ...claims[index], ...input, status: "UNVERIFIED", confirmationBasis: "NONE", revision: claims[index].revision + 1 };
    return r.fulfill({ json: claims[index] });
  });
  await page.route("**/api/**/match", r => { aiCalls++; return r.fulfill({ status: 500 }); });
  await page.route("**/api/**/workflow/**", r => { aiCalls++; return r.fulfill({ status: 500 }); });
  await page.goto("/career/profile"); await page.getByRole("button", { name: "Din kompetanse", exact: true }).click();
  const panel = page.locator("#profile-competencies");
  const card = panel.getByRole("article", { name: "Next.js", exact: true });
  await expect(panel.getByRole("article")).toHaveCount(2);
  await expect(card).toHaveCount(1);
  const combined = card.getByRole("region", { name: "Samlet forklaring: Next.js", exact: true });
  await expect(combined.getByText("Built a patient portal.", { exact: true })).toHaveCount(1);
  await expect(combined).toContainText("Example Health · Example Clinic");
  await expect(combined).toContainText("Built an emissions platform.");
  await expect(combined.getByRole("heading", { name: "Utkast · trenger gjennomgang", exact: true })).toBeVisible();
  await expect(combined).not.toContainText("Incorrect legacy description.");
  await panel.getByRole("textbox", { name: "Søk i kompetanse", exact: true }).fill("Example Carbon");
  await expect(panel.getByRole("article")).toHaveCount(1);
  await expect(combined).toContainText("Built a patient portal.");
  await panel.getByRole("textbox", { name: "Søk i kompetanse", exact: true }).fill("");
  await card.locator(".claim-group-contributions > summary").click();
  const contribution = card.locator(`[data-contribution-id="${id(2)}"]`);
  await contribution.locator("summary").click();
  await expect(contribution.locator("blockquote")).toHaveText("Built an emissions platform.");
  await contribution.getByRole("button", { name: "Rediger", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Hva gjorde du selv?", exact: true }).fill("Reviewed emissions implementation.");
  await dialog.getByRole("button", { name: "Lagre opplysning", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(card.locator('[data-group-status="CONFIRMED"]')).toHaveText("2 bekreftet av deg");
  await expect(card.locator('[data-group-status="DRAFT"]')).toHaveText("2 utkast");
  expect(claims[0].status).toBe("CONFIRMED"); expect(claims[2].status).toBe("CONFIRMED"); expect(writes).toBe(1); expect(aiCalls).toBe(0);
  await page.screenshot({ path: "/tmp/career-grouped-skills-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(card).toHaveCount(1);
  await page.screenshot({ path: "/tmp/career-grouped-skills-mobile.png", fullPage: true });
  await page.reload(); await page.getByRole("button", { name: "Din kompetanse", exact: true }).click();
  await expect(card).toHaveCount(1); await expect(card.getByRole("region")).toContainText("Reviewed emissions implementation."); expect(writes).toBe(1);
});

test("grouping keeps React Native and punctuation-sensitive C skills distinct", async ({ page }) => {
  await identity(page);
  const skills = ["React", "React Native", "C", "C++", "C#"];
  await page.route("**/api/profile/me/claims", r => r.fulfill({ json: skills.map((skill, n) => claim(n + 1, skill, `Used ${skill}.`, "Synthetic project")) }));
  await page.goto("/career/profile"); await page.getByRole("button", { name: "Din kompetanse", exact: true }).click();
  await expect(page.locator("#profile-competencies").getByRole("article")).toHaveCount(5);
  for (const skill of skills) await expect(page.getByRole("article", { name: skill, exact: true })).toHaveCount(1);
});
