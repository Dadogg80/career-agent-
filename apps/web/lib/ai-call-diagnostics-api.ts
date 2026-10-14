import { localRequest, privateBase, privateResponse, smallJson } from "./private-api";
import { isAiCallDiagnosticsSnapshot } from "./ai-call-diagnostics";

export async function aiCallDiagnosticsProxy(request: Request): Promise<Response> {
  if (!localRequest(request)) return privateResponse({ code: "ACCESS_DENIED" }, undefined, 403);

  let body: string | undefined;
  if (request.method === "POST") {
    try {
      const value = await smallJson(request, 128);
      if (!value || typeof value !== "object" || Object.keys(value).length !== 1
        || !("capturing" in value) || typeof value.capturing !== "boolean") throw new Error("Invalid request");
      body = JSON.stringify(value);
    } catch {
      return privateResponse({ code: "AI_DIAGNOSTICS_INVALID" }, undefined, 400);
    }
  }

  try {
    const response = await fetch(`${privateBase()}/api/dev/ai-calls`, {
      method: request.method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      ...(body ? { body } : {}),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    const value: unknown = await response.json();
    if (response.status === 409) return privateResponse(value, undefined, 409);
    if (!response.ok) return privateResponse({ code: "AI_DIAGNOSTICS_UNAVAILABLE" }, undefined, 503);
    if (!isAiCallDiagnosticsSnapshot(value)) throw new Error("Invalid diagnostics response");
    return privateResponse(value, undefined, 200);
  } catch {
    return privateResponse({ code: "AI_DIAGNOSTICS_UNAVAILABLE" }, undefined, 503);
  }
}
