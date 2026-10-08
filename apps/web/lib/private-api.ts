// Server-side proxy boundary for session/profile routes. Never log cookies or bodies.
export function localRequest(request: Request): boolean {
  const expected = new URL(request.url);
  expected.host = request.headers.get("host") ?? expected.host;
  return ["127.0.0.1", "localhost", "[::1]"].includes(expected.hostname)
    && (!request.headers.get("origin") || request.headers.get("origin") === expected.origin);
}
export function privateBase(): string {
  const base = new URL(process.env.CAREER_API_BASE_URL ?? "http://127.0.0.1:8080");
  if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname) || !["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== "/") throw new Error("Invalid backend origin");
  return base.origin;
}
export function sessionHeaders(request: Request): Headers {
  const headers = new Headers();
  const cookie = request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => /^CAREER_SESSION=[A-Za-z0-9._-]{1,256}$/.test(value));
  if (cookie) headers.set("cookie", cookie);
  const csrf = request.headers.get("x-csrf-token");
  if (csrf && csrf.length <= 512 && !/[\r\n]/.test(csrf)) headers.set("x-csrf-token", csrf);
  return headers;
}
export function privateResponse(body: unknown, upstream?: Response, status = upstream?.status ?? 503): Response {
  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const cookie of upstream?.headers.getSetCookie() ?? []) {
    if (cookie.startsWith("CAREER_SESSION=") && cookie.length <= 4096) headers.append("set-cookie", cookie);
  }
  return status === 204 ? new Response(null, { status, headers }) : Response.json(body, { status, headers });
}
export async function smallJson(request: Request, maxBytes = 4096): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Invalid body");
  const reader = request.body?.getReader(); if (!reader) throw new Error("Invalid body");
  const parts: Uint8Array[] = []; let bytes = 0;
  while (true) {
    const part = await reader.read(); if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > maxBytes) { await reader.cancel(); throw new Error("Invalid body"); }
    parts.push(part.value);
  }
  return JSON.parse(Buffer.concat(parts).toString("utf8"));
}
export function mappedPrivateError(body: unknown): { code: string } {
  const allowed = ["CONTEXT_INVALID", "CONTEXT_CONFLICT", "CONTEXT_UNAVAILABLE", "CONTEXT_LIMIT", "AI_APPROVAL_CHANGED", "CLAIM_EVIDENCE_LIMIT", "APPLICATION_INVALID", "APPLICATION_NOT_FOUND", "APPLICATION_CONFLICT", "APPLICATION_MATERIALS_REQUIRED", "APPLICATION_MATERIALS_LOCKED", "APPLICATION_SOURCE_CONFLICT", "APPLICATION_LIMIT", "APPLICATION_HISTORY_LIMIT", "APPLICATION_UNAVAILABLE", "CV_INVALID", "CV_APPROVAL_REQUIRED", "CV_NOT_FOUND", "CV_CONFLICT", "CV_SOURCE_CONFLICT", "CV_LIMIT", "CV_CONTENT_LIMIT", "CV_CHARACTER_UNSUPPORTED", "CV_EXPORT_FAILED", "CV_BUSY", "CV_IN_USE", "CV_UNAVAILABLE", "SAVED_JOB_IN_USE", "ENTRY_INVALID", "ENTRY_NOT_FOUND", "ENTRY_CONFLICT", "ENTRY_LIMIT", "ENTRY_UNAVAILABLE", "MATCH_INPUT_INVALID", "MATCH_CONSENT_REQUIRED", "MATCH_NO_REQUIREMENTS", "MATCH_CONFLICT", "MATCH_UNAVAILABLE", "SAVED_JOB_INVALID", "SAVED_JOB_NOT_FOUND", "SAVED_JOB_LIMIT", "SAVED_JOB_UNAVAILABLE", "AUTH_REQUIRED", "ACCESS_DENIED", "PROFILE_INVALID", "PROFILE_CONFLICT", "PROFILE_NOT_CREATED", "PROFILE_DISABLED", "CLAIM_INVALID", "CLAIM_CONFLICT", "CLAIM_NOT_FOUND", "CLAIM_LIMIT", "CLAIM_REVIEW_INVALID", "DOCUMENT_INVALID", "DOCUMENT_TYPE", "DOCUMENT_TOO_LARGE", "DOCUMENT_ENCRYPTED", "DOCUMENT_NOT_FOUND", "DOCUMENT_LIMIT", "DOCUMENT_BUSY", "DOCUMENT_QUOTE_INVALID", "DOCUMENT_AI_OUTPUT_TOO_LARGE", "DOCUMENT_AI_INPUT_INVALID", "DOCUMENT_AI_CONSENT_REQUIRED", "DOCUMENT_AI_NO_TEXT", "DOCUMENT_ANALYSIS_CONFLICT", "DOCUMENT_OCR_UNAVAILABLE", "DOCUMENT_OCR_TIMEOUT", "DOCUMENT_OCR_TOO_LARGE", "AI_NOT_CONFIGURED", "AI_ACCESS_DENIED", "AI_RATE_LIMITED", "AI_BUSY", "AI_BUDGET_REACHED", "AI_INVALID_RESULT", "AI_UNAVAILABLE"];
  const code = body && typeof body === "object" && "code" in body && allowed.includes(String(body.code)) ? String(body.code) : "PROFILE_UNAVAILABLE";
  return { code };
}
