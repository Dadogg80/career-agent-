import { validAiApprovalField } from "../../../../lib/ai-configuration";
import { retryAfterSeconds as parseRetryAfter } from "../../../../lib/retry-after";
import { safeAnalysisReason } from "../../../../lib/analysis-workflow";
import { isExtraction } from "../../../../lib/job-requirements";

export async function POST(request: Request) {
  // Next.js may canonicalize request.url to localhost even when the browser uses 127.0.0.1.
  // Compare against the incoming Host and limit this unauthenticated pilot to loopback hosts.
  const expected = new URL(request.url);
  expected.host = request.headers.get("host") ?? expected.host;
  const origin = request.headers.get("origin");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(expected.hostname) || (origin && origin !== expected.origin)) {
    return Response.json({ code: "INVALID_INPUT" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ code: "INVALID_INPUT" }, { status: 400 });
  }
  let input: { text: string; locale: string; aiApproval?:string };
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 100000) {
        await reader.cancel();
        return Response.json({ code: "INVALID_INPUT" }, { status: 413 });
      }
      chunks.push(part.value);
    }
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if(!validAiApprovalField(value))throw new Error("Invalid selection");
    if (typeof value.text !== "string" || value.text.trim().length < 40 || value.text.length > 15000 || !["nb", "en"].includes(value.locale)) {
      throw new Error("Invalid input");
    }
    input = { text: value.text, locale: value.locale, ...(value.aiApproval?{aiApproval:value.aiApproval}:{}) };
  } catch {
    return Response.json({ code: "INVALID_INPUT" }, { status: 400 });
  }
  try {
    const base = process.env.CAREER_API_BASE_URL ?? "http://127.0.0.1:8080";
    const response = await fetch(`${base}/api/jobs/requirements`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input), cache: "no-store", signal: AbortSignal.timeout(30000),
    });
    const value: unknown = await response.json();
    if (!response.ok) {
      const codes = ["INVALID_INPUT", "AI_NOT_CONFIGURED", "AI_APPROVAL_CHANGED", "AI_ACCESS_DENIED", "AI_RATE_LIMITED", "AI_BUSY", "AI_BUDGET_REACHED", "AI_INVALID_RESULT", "AI_UNAVAILABLE"];
      const code = value && typeof value === "object" && "code" in value && codes.includes(String(value.code)) ? value.code : "AI_UNAVAILABLE";
      const seconds = Number(response.headers.get("retry-after"));
      const retryAfterSeconds = response.status === 429 ? parseRetryAfter(seconds) : undefined;
      const reason = value && typeof value === "object" && "reason" in value ? safeAnalysisReason(value.reason) : undefined;
      return Response.json({ code, ...(reason ? { reason } : {}), ...(retryAfterSeconds ? { retryAfterSeconds } : {}) }, { headers: { "Cache-Control": "no-store", ...(retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {}) }, status: [400,409,429,502,503].includes(response.status) ? response.status : 503 });
    }
    if (!isExtraction(value)) throw new Error("Invalid result");
    return Response.json(value, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ code: "AI_UNAVAILABLE" }, { status: 503 });
  }
}
