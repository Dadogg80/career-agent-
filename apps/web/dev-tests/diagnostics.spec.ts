import { expect, test } from "@playwright/test";
import type { DiagnosticEvent } from "../lib/analysis-workflow";
import type { AiCallDiagnostic, AiCallDiagnosticsSnapshot } from "../lib/ai-call-diagnostics";
import { mockAiConfiguration } from "../tests/helpers/mock-ai-configuration";

test.beforeEach(async ({ page }) => { await mockAiConfiguration(page); });

function mockAiDiagnostics(page: import("@playwright/test").Page) {
  let capturing = false;
  let calls: AiCallDiagnostic[] = [];
  const snapshot = (): AiCallDiagnosticsSnapshot => ({ supported: true, capturing, retainedMinutes: 10, maxCalls: 200, calls });
  const ready = page.route("**/api/dev/ai-calls", async route => {
    if (route.request().method() === "POST") {
      capturing = (await route.request().postDataJSON()).capturing;
    } else if (route.request().method() === "DELETE") {
      calls = [];
    }
    await route.fulfill({ json: snapshot() });
  });
  return { ready, addCall: (call: AiCallDiagnostic) => { calls = [...calls, call]; } };
}

const url = "https://www.finn.no/job/ad/477265830";
const source = "PRIVATE_SOURCE_MARKER. Du må ha erfaring med Kotlin og PostgreSQL.";
const jobId = "52345678-1234-1234-1234-123456789abc";
const claimId = "62345678-1234-1234-1234-123456789abc";
const jobText = "Fictional employer seeks a Kotlin developer. Kotlin is required for this role.";
const savedJob = { id: jobId, createdAt: "2026-10-07T00:00:00Z", content: {
  title: "Fictional Kotlin developer", sourceUrl: null, sourceType: "PASTED_TEXT", text: jobText, locale: "nb",
  requirements: [{ label: "Kotlin", kind: "REQUIRED", quote: "Kotlin is required for this role." }],
  facts: [], omittedItems: 0, retrievedAt: null,
} };
const confirmedClaim = {
  id: claimId, skill: "Kotlin", statement: "Built Kotlin APIs.", context: "Fictional project",
  sourceNote: "Synthetic evidence", status: "CONFIRMED", revision: 2, createdAt: "2026-10-07T00:00:00Z", updatedAt: "2026-10-07T00:00:00Z",
};
const match = {
  id: "72345678-1234-1234-1234-123456789abc", locale: "nb", createdAt: "2026-10-07T00:00:00Z",
  assessments: [{ requirementIndex: 0, classification: "STRONG", reason: "Synthetic direct evidence.", evidence: [{ claimId, quote: confirmedClaim.statement }], question: "" }],
  claims: [{ id: claimId, revision: 2, skill: confirmedClaim.skill, statement: confirmedClaim.statement, context: confirmedClaim.context }],
  omittedItems: 0, inputCharacters: 120, stale: false, automaticEvidence: true, provider: "Groq", model: "openai/gpt-oss-20b",
};

test("right-side diagnostics show actual source, stages and sanitized console events", async ({ page }) => {
  await mockAiDiagnostics(page).ready;
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
  await page.goto("/jobs/analyze");
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
  await expect(panel.locator(".diagnostic-call-card").nth(0)).toContainText("/api/jobs/import");
  await expect(panel.locator(".diagnostic-call-card").nth(0)).toContainText("GROQ_BROWSER_EXCERPT");
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
  await expect(panel.locator(".diagnostic-call-card").nth(1)).toContainText("/api/jobs/requirements");
  await expect(panel.locator(".diagnostic-call-card").nth(1)).toContainText("1 / 0 / 0");
  await panel.getByRole("button", { name: "Lukk diagnostikk", exact: true }).click();
  await expect(panel).toBeHidden();
  const sourceNote = page.locator(".analysis-quality-source");
  await expect(sourceNote.locator("summary")).toContainText("Ubekreftet kildeutdrag");
  await sourceNote.locator("summary").click();
  await expect(sourceNote).toContainText("ikke en bekreftet komplett originalannonse");
  await expect.poll(() => logged.filter(event => event.state === "success").length).toBe(3);
  expect(logged.map(event => `${event.stage}:${event.state}`)).toEqual(["source:running", "source:success", "wait:running", "wait:success", "analysis:running", "analysis:success"]);
  expect(JSON.stringify(logged)).not.toContain("PRIVATE_");
  expect(JSON.stringify(logged)).not.toContain(url);
  expect(new Set(logged.map(event => event.runId)).size).toBe(1);
  await page.getByRole("combobox", { name: "Språk" }).selectOption("en");
  // Closed sheet contents may remain mounted briefly during their exit animation.
  // Reopen explicitly instead of asserting visibility inside a closed panel.
  await page.getByRole("button", { name: "Developer diagnostics", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: /Developer diagnostics/ })).toBeVisible();
});

test("red diagnostic light retains HTTP error and cooldown without automatic retries", async ({ page }) => {
  await mockAiDiagnostics(page).ready;
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
  await page.goto("/jobs/analyze");
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true }).click();
  await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
  await page.getByRole("textbox", { name: "Stillingsannonse", exact: true }).fill(source);
  await page.getByRole("button", { name: "Analyser", exact: true }).click();
  const panel = page.locator(".analysis-diagnostics");
  await expect(panel.locator('[data-stage="analysis"]')).toHaveAttribute("data-state", "error");
  await expect(panel).toContainText("HTTP 429"); await expect(panel).toContainText("AI_RATE_LIMITED");
  await expect(panel.locator(".diagnostic-call-card").filter({ hasText: "/api/jobs/requirements" })).toContainText(`${source.length} tegn`);
  await expect.poll(() => failures.length).toBe(1);
  expect(failures[0].type).toBe("warning");
  expect(failures[0].event.details.code).toBe("AI_RATE_LIMITED");
  await expect(page.getByRole("button", { name: "Analyser", exact: true })).toBeDisabled();
  await page.clock.fastForward(16000);
  await expect(page.getByRole("button", { name: "Analyser", exact: true })).toBeEnabled();
  expect(calls).toBe(1);
});

test("failed URL retrieval is a warning with its actual code and preserves the link", async ({ page }) => {
  await mockAiDiagnostics(page).ready;
  const failures: { type: string; code: string }[] = [];
  page.on("console", async message => {
    if (message.text().startsWith("[Career Agent]")) {
      const event = await message.args()[1].jsonValue() as DiagnosticEvent;
      if (event.state === "error") failures.push({ type: message.type(), code: event.details.code! });
    }
  });
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.route("**/api/jobs/import", route => route.fulfill({ status: 422, json: { code: "SOURCE_INVALID" } }));
  await page.goto("/jobs/analyze");
  await page.getByRole("textbox", { name: "Lenke til stillingsannonse" }).fill(url);
  await page.getByRole("button", { name: "Analyser lenke", exact: true }).click();
  await page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true }).click();
  const panel = page.locator(".analysis-diagnostics");
  await expect(panel.locator('[data-stage="source"]')).toHaveAttribute("data-state", "error");
  await expect(panel).toContainText("SOURCE_INVALID");
  await expect(panel).toContainText("HTTP 422");
  await expect(panel.locator(".diagnostic-call-card").filter({ hasText: "/api/jobs/import" })).toContainText("SOURCE_INVALID");
  await expect(page.getByRole("textbox", { name: "Lenke til stillingsannonse" })).toHaveValue(url);
  await expect.poll(() => failures).toEqual([{ type: "warning", code: "SOURCE_INVALID" }]);
});

test("diagnostic edge tab supports keyboard opening, Escape and a narrow viewport", async ({ page }) => {
  await mockAiDiagnostics(page).ready;
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/jobs/analyze");
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
  await mockAiDiagnostics(page).ready;
  const failures: DiagnosticEvent[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", async message => { if (message.text().startsWith("[Career Agent]") && message.type() === "warning") failures.push(await message.args()[1].jsonValue()); });
  await page.route("**/api/status", route => route.fulfill({ json: { status:"UP" } }));
  await page.route("**/api/jobs/requirements", route => route.fulfill({ status:502, json:{ code:"AI_INVALID_RESULT", reason:"NO_SUPPORTED_ITEMS", failed_generation:"PRIVATE_PROVIDER_PAYLOAD" } }));
  await page.goto("/jobs/analyze");
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

test("shared diagnostics explicitly capture and display model exchanges in document analysis", async ({ page }) => {
  const diagnostics = mockAiDiagnostics(page);
  await diagnostics.ready;
  const selection = { provider: "Groq", model: "openai/gpt-oss-20b" };
  const approval = { token: "c".repeat(64), selections: [selection] };
  const documentId = "92345678-1234-1234-1234-123456789abc";
  const document = {
    id: documentId, originalName: "Synthetic CV.txt", mediaType: "text/plain", byteSize: 60,
    sha256: "a".repeat(64), language: "nb", isMaster: true, createdAt: "2026-10-07T00:00:00Z", textCharacters: 60,
  };
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "test-token" } }));
  await page.route("**/api/ai/config", route => route.fulfill({ json: {
    tasks: { JOB_ANALYSIS: selection, DOCUMENT_EXTRACTION: selection, PROFILE_SUMMARY: selection, PERSONAL_MATCH: selection, CV_TAILORING: selection },
    documents: approval, documentExcerpt: approval, matching: approval, job: approval,
  } }));
  await page.route("**/api/profile/me", route => route.fulfill({ json: { id: "12345678-1234-1234-1234-123456789abc", displayName: "Synthetic Pilot", preferredLanguage: "nb", revision: 1 } }));
  await page.route("**/api/profile/me/documents", route => route.fulfill({ json: [document] }));
  await page.route(`**/api/profile/me/documents/${documentId}`, route => route.fulfill({
    json: { document, text: "Synthetic CV source with enough content to inspect during document analysis." },
  }));
  await page.route("**/api/profile/me/documents/workflow**", route => route.fulfill({ json: null }));
  await page.goto("/documents");
  await expect(page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Analyser dokumentet", exact: true }).click();
  const tab = page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true });
  await expect(tab).toBeVisible();
  await tab.click();
  const sheet = page.getByRole("dialog", { name: /Utviklerdiagnostikk/ });
  await expect(sheet).toContainText("Privat innhold");
  await expect(sheet).toContainText("10 minutter");
  await sheet.getByRole("button", { name: "Start innholdssporing" }).click();
  await expect(sheet.getByText("Midlertidig sporing er aktiv")).toBeVisible();

  diagnostics.addCall({
    id: "call-1", groupId: "document-workflow:pending", groupLabel: "Document workflow · pending",
    sequence: 2, task: "DOCUMENT_EXTRACTION", provider: "Gemini", model: "gemini-test",
    endpoint: "provider.test/generate", startedAt: new Date().toISOString(), durationMs: 125,
    status: "SUCCESS", instructions: "Use only the supplied private source.", input: "SYNTHETIC_INPUT",
    schema: "{\"type\":\"object\"}", response: "{\"claims\":[]}", errorCode: null, truncatedFields: [],
  });
  await expect(sheet.getByText("SYNTHETIC_INPUT", { exact: true })).toHaveCount(0);
  await sheet.getByText("Document workflow · pending").click();
  await sheet.getByText("Vis kallinnhold").click();
  await sheet.getByText("Inndata", { exact: true }).click();
  await expect(sheet.getByText("SYNTHETIC_INPUT", { exact: true })).toBeVisible({ timeout: 5000 });
  await expect(sheet).toContainText("Use only the supplied private source.");
  await expect(sheet).toContainText("gemini-test");
  await sheet.getByRole("button", { name: "Stopp sporing" }).click();
  await expect(sheet.getByText("Sporing er av")).toBeVisible();
  await sheet.getByRole("button", { name: "Slett innhold" }).click();
  await expect(sheet).toContainText("Ingen AI-kall er fanget ennå.");
});

test("job-match diagnostics are absent from the saved-job list and scoped to the opened job", async ({ page }) => {
  const diagnostics = mockAiDiagnostics(page);
  await diagnostics.ready;
  const selection = { provider: "Groq", model: "openai/gpt-oss-20b" };
  const approval = { token: "a".repeat(64), selections: [selection] };
  const options = [{ approval, available: true }];
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
  await page.route("**/api/ai/config", route => route.fulfill({ json: {
    tasks: { JOB_ANALYSIS: selection, DOCUMENT_EXTRACTION: selection, PROFILE_SUMMARY: selection, PERSONAL_MATCH: selection, CV_TAILORING: selection },
    documents: approval, documentExcerpt: approval, matching: approval, job: approval, tailoring: approval,
    options: { documents: options, documentExcerpt: options, matching: options, job: options, tailoring: options },
  } }));
  await page.route("**/api/profile/me/claims", route => route.fulfill({ json: [confirmedClaim] }));
  await page.route("**/api/profile/me/jobs", route => route.fulfill({ json: [savedJob] }));
  await page.route(`**/api/profile/me/jobs/${jobId}/match`, async route => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      diagnostics.addCall({
        id: "other-job-call", groupId: "job-match:82345678-1234-1234-1234-123456789abc", groupLabel: "Personal match · 82345678",
        sequence: 1, task: "PERSONAL_MATCH", provider: "Gemini", model: "gemini-other",
        endpoint: "provider.test/match", startedAt: new Date().toISOString(), durationMs: 40,
        status: "SUCCESS", instructions: "Unrelated job prompt.", input: "UNRELATED_JOB_PAYLOAD",
        schema: "{}", response: "{}", errorCode: null, truncatedFields: [],
      });
      diagnostics.addCall({
        id: "match-call", groupId: `job-match:${jobId}`, groupLabel: `Personal match · ${jobId.slice(0, 8)}`,
        sequence: 1, task: "PERSONAL_MATCH", provider: "Groq", model: selection.model,
        endpoint: "api.groq.com/openai/v1/chat/completions", startedAt: new Date().toISOString(), durationMs: 80,
        status: "SUCCESS", instructions: "Compare the supplied advertisement and confirmed candidate evidence.",
        input: JSON.stringify(body), schema: "{\"type\":\"object\"}", response: JSON.stringify(match),
        errorCode: null, truncatedFields: [],
      });
      await route.fulfill({ json: match });
    } else {
      await route.fulfill({ json: null });
    }
  });

  await page.goto("/jobs/saved");
  await expect(page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Åpne stilling", exact: true }).click();
  const details = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: savedJob.content.title, exact: true }) });
  const dev = details.getByRole("button", { name: "Utviklerdiagnostikk", exact: true });
  await expect(dev).toBeVisible();
  await dev.click();
  const panel = page.getByRole("dialog", { name: /Utviklerdiagnostikk/ });
  await panel.getByRole("button", { name: "Start innholdssporing" }).click();
  await panel.getByRole("button", { name: "Lukk diagnostikk" }).click();

  await details.getByRole("button", { name: "Vurder personlig match", exact: true }).click();
  await details.getByRole("checkbox", { name: /Jeg godkjenner at dette grunnlaget/ }).check();
  await details.getByRole("button", { name: "Analyser personlig match", exact: true }).click();
  await expect(details.locator(".match-result")).toBeVisible();

  await details.getByRole("button", { name: "Utviklerdiagnostikk", exact: true }).click();
  await expect(panel).toContainText("PERSONAL MATCH");
  await expect(panel).toContainText("1/200");
  await expect(panel).not.toContainText("UNRELATED_JOB_PAYLOAD");
  await panel.getByText(`Personal match · ${jobId.slice(0, 8)}`).click();
  await panel.getByText("Vis kallinnhold", { exact: true }).click();
  await panel.getByText("Inndata", { exact: true }).click();
  await expect(panel).toContainText(jobText);
  await expect(panel).toContainText("Built Kotlin APIs.");
});

test("document overview has no DEV panel; opened document analysis does", async ({ page }) => {
  await mockAiDiagnostics(page).ready;
  const selection = { provider: "Groq", model: "openai/gpt-oss-20b" };
  const approval = { token: "b".repeat(64), selections: [selection] };
  const documentId = "92345678-1234-1234-1234-123456789abc";
  const document = {
    id: documentId, originalName: "Synthetic CV.txt", mediaType: "text/plain", byteSize: 60,
    sha256: "a".repeat(64), language: "nb", isMaster: true, createdAt: "2026-10-07T00:00:00Z", textCharacters: 60,
  };
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
  await page.route("**/api/ai/config", route => route.fulfill({ json: {
    tasks: { JOB_ANALYSIS: selection, DOCUMENT_EXTRACTION: selection, PROFILE_SUMMARY: selection, PERSONAL_MATCH: selection, CV_TAILORING: selection },
    documents: approval, documentExcerpt: approval, matching: approval, job: approval,
  } }));
  await page.route("**/api/profile/me", route => route.fulfill({ json: { id: "12345678-1234-1234-1234-123456789abc", displayName: "Synthetic Pilot", preferredLanguage: "nb", revision: 1 } }));
  await page.route("**/api/profile/me/documents", route => route.fulfill({ json: [document] }));
  await page.route(`**/api/profile/me/documents/${documentId}`, route => route.fulfill({
    json: { document, text: "Synthetic CV source with enough content to inspect during document analysis." },
  }));
  await page.route("**/api/profile/me/documents/workflow**", route => route.fulfill({ json: null }));

  await page.goto("/documents");
  await expect(page.getByRole("button", { name: "Utviklerdiagnostikk", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Analyser dokumentet", exact: true }).click();
  const analysis = page.getByRole("dialog");
  await expect(analysis.getByRole("button", { name: "Utviklerdiagnostikk", exact: true })).toBeVisible();
});
