import { expect, test } from "@playwright/test";
import type { DiagnosticEvent } from "../lib/analysis-workflow";

const url = "https://www.finn.no/job/ad/477265830";
const source = "PRIVATE_SOURCE_MARKER. Du må ha erfaring med Kotlin og PostgreSQL.";

test("collapsible diagnostics show actual source, stages and sanitized console events", async ({ page }) => {
  const logged: DiagnosticEvent[] = [];
  page.on("console", async message => {
    if (message.text().startsWith("[Career Agent]")) logged.push(await message.args()[1].jsonValue());
  });
  let releaseSource!: () => void;
  const sourceGate = new Promise<void>(resolve => { releaseSource = resolve; });
  let releaseAnalysis!: () => void;
  const analysisGate = new Promise<void>(resolve => { releaseAnalysis = resolve; });
  let analyses = 0;
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.route("**/api/jobs/import", async route => {
    await sourceGate;
    await route.fulfill({ json: { sourceUrl: url, title: "PRIVATE_TITLE_MARKER", text: source, retrievedAt: "2026-10-07T00:00:00Z", sourceType: "GROQ_BROWSER_EXCERPT" } });
  });
  await page.route("**/api/jobs/requirements", async route => {
    analyses++; await analysisGate;
    await route.fulfill({ json: { facts: [], requirements: [{ label: "Kotlin", kind: "REQUIRED", quote: "Du må ha erfaring med Kotlin og PostgreSQL." }] } });
  });
  await page.goto("/");
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
  const panel = page.locator(".analysis-diagnostics");
  await expect(panel.locator(".diagnostic-body")).not.toBeVisible();
  await page.getByText("Utviklerdiagnostikk", { exact: true }).click();
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await expect(panel.locator('[data-stage="source"]')).toHaveAttribute("data-state", "running");
  releaseSource();
  await expect(panel.locator('[data-stage="source"]')).toHaveAttribute("data-state", "success");
  await expect(panel.locator('[data-stage="wait"]')).toHaveAttribute("data-state", "running");
  await page.getByText("Se teksten som faktisk ble hentet", { exact: true }).click();
  await expect(panel.locator("pre")).toHaveText(source);
  await expect(panel).toContainText(`${source.length} tegn`);
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({ path: "/tmp/career-agent-paced-loading.png", fullPage: true, animations: "disabled" });
  expect(analyses).toBe(0);
  await page.clock.fastForward(10000);
  await expect(panel.locator('[data-stage="analysis"]')).toHaveAttribute("data-state", "running");
  releaseAnalysis();
  await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible();
  await expect(panel.locator('[data-stage="analysis"]')).toHaveAttribute("data-state", "success");
  await expect.poll(() => logged.filter(event => event.state === "success").length).toBe(3);
  expect(logged.map(event => `${event.stage}:${event.state}`)).toEqual(["source:running", "source:success", "wait:running", "wait:success", "analysis:running", "analysis:success"]);
  expect(JSON.stringify(logged)).not.toContain("PRIVATE_");
  expect(JSON.stringify(logged)).not.toContain(url);
  expect(new Set(logged.map(event => event.runId)).size).toBe(1);
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  await expect(page.getByText("Developer diagnostics", { exact: true })).toBeVisible();
  await page.getByText("Developer diagnostics", { exact: true }).click();
  await expect(panel.locator(".diagnostic-body")).not.toBeVisible();
});

test("red diagnostic light retains HTTP error and cooldown without automatic retries", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.route("**/api/jobs/requirements", route => {
    calls++; return route.fulfill({ status: 429, headers: { "Retry-After": "16" }, json: { code: "AI_RATE_LIMITED", retryAfterSeconds: 16 } });
  });
  await page.goto("/");
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByText("Utviklerdiagnostikk", { exact: true }).click();
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  const panel = page.locator(".analysis-diagnostics");
  await expect(panel.locator('[data-stage="analysis"]')).toHaveAttribute("data-state", "error");
  await expect(panel).toContainText("HTTP 429"); await expect(panel).toContainText("AI_RATE_LIMITED");
  await expect(page.getByRole("button", { name: "Analyser", exact: true })).toBeDisabled();
  await page.clock.fastForward(16000);
  await expect(page.getByRole("button", { name: "Analyser", exact: true })).toBeEnabled();
  expect(calls).toBe(1);
});
