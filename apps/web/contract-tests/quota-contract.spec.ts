import { expect, test } from "@playwright/test";
import { retryAfterSeconds, retryWaitLabel } from "../lib/retry-after";
import { POST as analyze } from "../app/api/jobs/requirements/route";
import { POST as importJob } from "../app/api/jobs/import/route";
import { personalMatchProxy } from "../lib/personal-match-api";
import { documentAnalysisProxy } from "../lib/document-analysis-api";
import { isExtraction } from "../lib/job-requirements";

test("long delays remain bounded without being shortened to five minutes", () => {
  expect(retryAfterSeconds("967.68")).toBe(968);
  expect(retryAfterSeconds("99999")).toBe(86400);
  for (const value of [null, undefined, "NaN", "Infinity", "-1", "bad", {}, 0]) expect(retryAfterSeconds(value)).toBeUndefined();
  expect(retryWaitLabel(968)).toBe("16 min 8 s");
  expect(isExtraction({ requirements: [], facts: [], omittedItems: 188 })).toBe(true);
  expect(isExtraction({ requirements: [], facts: [], omittedItems: -1 })).toBe(false);
});

test("advertisement matching and document proxies preserve daily quota delays without exposing provider details", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async input => {
    calls++;
    const code = String(input).endsWith("/import") ? "SOURCE_RATE_LIMITED" : "AI_RATE_LIMITED";
    return Response.json({ code, message: "PRIVATE PROVIDER ACCOUNT DETAILS" }, { status: 429, headers: { "Retry-After": "968" } });
  };
  const text = "Synthetic job advertisement: Kotlin experience is required for backend development.";
  const id = "52345678-1234-1234-1234-123456789abc";
  function request(path: string, body: unknown) {
    return new Request(`http://127.0.0.1:3000${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  try {
    const responses = [
      await analyze(request("/api/jobs/requirements", { text, locale: "nb" })),
      await importJob(request("/api/jobs/import", { url: "https://www.finn.no/job/ad/123456" })),
      await personalMatchProxy(request(`/api/profile/me/jobs/${id}/match`, { text, claims: [{ id, revision: 2 }], locale: "nb", consent: true }), id),
      await documentAnalysisProxy(request(`/api/profile/me/documents/${id}/analysis`, { text, locale: "nb", consent: true }), id),
    ];
    for (const response of responses) {
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("968");
      expect(await response.text()).not.toContain("PRIVATE PROVIDER ACCOUNT DETAILS");
    }
    expect(calls).toBe(4);
  } finally { globalThis.fetch = original; }
});
