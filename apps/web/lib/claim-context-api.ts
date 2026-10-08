import { localRequest, privateBase, sessionHeaders, privateResponse, smallJson, mappedPrivateError } from "./private-api";
import { claimId } from "./claims";
import { isContextOverview, validContextCommand } from "./claim-contexts";
export async function contextProxy(request: Request, id: string, write = false) {
  if (!localRequest(request)) return privateResponse({ code: "ACCESS_DENIED" }, undefined, 403);
  if (!claimId.test(id)) return privateResponse({ code: "CONTEXT_INVALID" }, undefined, 400);
  let body: unknown;
  if (write) {
    try { body = await smallJson(request); if (!validContextCommand(body)) throw new Error("Invalid command"); }
    catch { return privateResponse({ code: "CONTEXT_INVALID" }, undefined, 400); }
  }
  try {
    const headers = sessionHeaders(request); if (write) headers.set("content-type", "application/json");
    const upstream = await fetch(`${privateBase()}/api/profile/me/claims/${id}/contexts`, { method: write ? "POST" : "GET", headers,
      ...(write ? { body: JSON.stringify(body) } : {}), cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(10000) });
    const value: unknown = await upstream.json();
    if (!upstream.ok) return privateResponse(mappedPrivateError(value), upstream, [400, 401, 403, 404, 409, 503].includes(upstream.status) ? upstream.status : 503);
    if (!isContextOverview(value)) throw new Error("Invalid response");
    return privateResponse(value, upstream);
  } catch { return privateResponse({ code: "CONTEXT_UNAVAILABLE" }); }
}
