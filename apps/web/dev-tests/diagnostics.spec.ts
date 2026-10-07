import { expect, test } from "@playwright/test";
import type { DiagnosticEvent } from "../lib/analysis-workflow";

const url = "https://www.finn.no/job/ad/477265830";
const source = "PRIVATE_SOURCE_MARKER. Du må ha erfaring med Kotlin og PostgreSQL.";

test("right-side diagnostics show actual source, stages and sanitized console events", async ({ page }) => {
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
  await page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true }).click();
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
  await expect(page.getByRole("heading", { name: /Developer diagnostics/ })).toBeVisible();
  await page.getByRole("button", { name: "Close diagnostics", exact: true }).click();
  await expect(panel.locator(".diagnostic-body")).not.toBeVisible();
});

test("red diagnostic light retains HTTP error and cooldown without automatic retries", async ({ page }) => {
  let calls = 0;
  const failures: { type: string; event: DiagnosticEvent }[] = [];
  page.on("console", async message => {
    if (message.text().startsWith("[Career Agent]")) {
      const event = await message.args()[1].jsonValue() as DiagnosticEvent;
      if (event.state === "error") failures.push({ type: message.type(), event });
    }
  });
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.route("**/api/jobs/requirements", route => {
    calls++; return route.fulfill({ status: 429, headers: { "Retry-After": "16" }, json: { code: "AI_RATE_LIMITED", retryAfterSeconds: 16 } });
  });
  await page.goto("/");
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true }).click();
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  const panel = page.locator(".analysis-diagnostics");
  await expect(panel.locator('[data-stage="analysis"]')).toHaveAttribute("data-state", "error");
  await expect(panel).toContainText("HTTP 429"); await expect(panel).toContainText("AI_RATE_LIMITED");
  await expect.poll(() => failures.length).toBe(1);
  expect(failures[0].type).toBe("warning");
  expect(failures[0].event.details.code).toBe("AI_RATE_LIMITED");
  await expect(page.getByRole("button", { name: "Analyser", exact: true })).toBeDisabled();
  await page.clock.fastForward(16000);
  await expect(page.getByRole("button", { name: "Analyser", exact: true })).toBeEnabled();
  expect(calls).toBe(1);
});

test("failed URL retrieval is a warning with its actual code and preserves the link", async ({ page }) => {
  const failures: { type: string; code: string }[] = [];
  page.on("console", async message => {
    if (message.text().startsWith("[Career Agent]")) {
      const event = await message.args()[1].jsonValue() as DiagnosticEvent;
      if (event.state === "error") failures.push({ type: message.type(), code: event.details.code! });
    }
  });
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.route("**/api/jobs/import", route => route.fulfill({ status: 422, json: { code: "SOURCE_INVALID" } }));
  await page.goto("/");
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true }).click();
  const panel = page.locator(".analysis-diagnostics");
  await expect(panel.locator('[data-stage="source"]')).toHaveAttribute("data-state", "error");
  await expect(panel).toContainText("SOURCE_INVALID");
  await expect(panel).toContainText("HTTP 422");
  await expect(page.getByRole("textbox", { name: "Lenke til stillingsannonse" })).toHaveValue(url);
  await expect.poll(() => failures).toEqual([{ type: "warning", code: "SOURCE_INVALID" }]);
});

test("diagnostic edge tab supports keyboard opening, Escape and a narrow viewport", async ({ page }) => {
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const tab = page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true });
  await expect(tab).toBeVisible();
  const bounds = await tab.boundingBox();
  expect(bounds!.x + bounds!.width).toBe(390);
  await tab.focus(); await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog", { name: /Utviklerdiagnostikk/ });
  await expect(sheet).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(sheet).toHaveCSS("animation-name", "none");
  await page.keyboard.press("Escape");
  await expect(sheet).not.toBeVisible(); await expect(tab).toBeFocused();
});

test("analysis rejection shows its safe category and the received source without a runtime overlay", async ({ page }) => {
  const failures: DiagnosticEvent[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", async message => { if (message.text().startsWith("[Career Agent]") && message.type() === "warning") failures.push(await message.args()[1].jsonValue()); });
  await page.route("**/api/status", route => route.fulfill({ json: { status:"UP" } }));
  await page.route("**/api/jobs/requirements", route => route.fulfill({ status:502, json:{ code:"AI_INVALID_RESULT", reason:"NO_SUPPORTED_ITEMS", failed_generation:"PRIVATE_PROVIDER_PAYLOAD" } }));
  await page.goto("/");
  await page.getByRole("button", { name:"Lim inn tekst", exact:true }).click();
  await page.getByRole("textbox", { name:"Stillingsannonse", exact:true }).fill(source);
  await page.getByRole("button", { name:"Analyser", exact:true }).click();
  await expect(page.locator(".fallback-advertisement")).toHaveText(source);
  await page.getByRole("button", { name:"Utviklerdiagnostikk", exact:true }).click();
  await expect(page.locator(".analysis-diagnostics")).toContainText("NO_SUPPORTED_ITEMS");
  await expect.poll(() => failures.length).toBe(1);
  expect(failures[0].details.reason).toBe("NO_SUPPORTED_ITEMS");
  expect(JSON.stringify(failures)).not.toContain("PRIVATE_");
  expect(errors).toEqual([]);
});
