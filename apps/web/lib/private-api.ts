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
export async function smallJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Invalid body");
  const reader = request.body?.getReader(); if (!reader) throw new Error("Invalid body");
  const parts: Uint8Array[] = []; let bytes = 0;
  while (true) {
    const part = await reader.read(); if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > 4096) { await reader.cancel(); throw new Error("Invalid body"); }
    parts.push(part.value);
  }
  return JSON.parse(Buffer.concat(parts).toString("utf8"));
}
export function mappedPrivateError(body: unknown): { code: string } {
  const allowed = ["AUTH_REQUIRED", "ACCESS_DENIED", "PROFILE_INVALID", "PROFILE_CONFLICT", "PROFILE_NOT_CREATED", "PROFILE_DISABLED"];
  const code = body && typeof body === "object" && "code" in body && allowed.includes(String(body.code)) ? String(body.code) : "PROFILE_UNAVAILABLE";
  return { code };
}
