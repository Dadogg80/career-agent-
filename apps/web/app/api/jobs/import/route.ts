import { retryAfterSeconds as parseRetryAfter } from "../../../../lib/retry-after";
import { isImportedJob } from "../../../../lib/job-import";

export async function POST(request: Request) {
  // Next.js may canonicalize request.url to localhost even when the browser uses 127.0.0.1.
  // Compare against the incoming Host and limit this unauthenticated pilot to loopback hosts.
  const expected = new URL(request.url);
  expected.host = request.headers.get("host") ?? expected.host;
  const origin = request.headers.get("origin");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(expected.hostname) || (origin && origin !== expected.origin)) {
    return Response.json({ code: "INVALID_URL" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ code: "INVALID_URL" }, { status: 400 });
  }
  let input: { url: string };
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 10000) {
        await reader.cancel();
        return Response.json({ code: "INVALID_URL" }, { status: 413 });
      }
      chunks.push(part.value);
    }
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (typeof value.url !== "string" || value.url.length > 2048 || !value.url.trim()) throw new Error("Invalid URL");
    input = { url: value.url };

  } catch {
    return Response.json({ code: "INVALID_URL" }, { status: 400 });
  }
  try {
    const base = process.env.CAREER_API_BASE_URL ?? "http://127.0.0.1:8080";
    const response = await fetch(`${base}/api/jobs/import`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input), cache: "no-store", signal: AbortSignal.timeout(60000),
    });
    const value: unknown = await response.json();
    if (!response.ok) {
      const codes = ["INVALID_URL", "SOURCE_UNSUPPORTED", "SOURCE_NOT_AVAILABLE", "SOURCE_INVALID", "SOURCE_TOO_LARGE", "SOURCE_UNAVAILABLE", "SOURCE_BUSY", "SOURCE_AI_NOT_CONFIGURED", "SOURCE_ACCESS_DENIED", "SOURCE_RATE_LIMITED", "SOURCE_SEARCH_UNAVAILABLE", "SOURCE_SEARCH_DISABLED", "SOURCE_BUDGET_REACHED"];
      const code = value && typeof value === "object" && "code" in value && codes.includes(String(value.code)) ? value.code : "SOURCE_UNAVAILABLE";
      const seconds = Number(response.headers.get("retry-after"));
      const retryAfterSeconds = response.status === 429 ? parseRetryAfter(seconds) : undefined;
      return Response.json({ code, ...(retryAfterSeconds ? { retryAfterSeconds } : {}) }, { headers: { "Cache-Control": "no-store", ...(retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {}) }, status: [400, 404, 413, 429, 502, 503].includes(response.status) ? response.status : 503 });
    }
    if (!isImportedJob(value)) throw new Error("Invalid result");
    return Response.json(value, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ code: "SOURCE_UNAVAILABLE" }, { status: 503 });
  }
}
