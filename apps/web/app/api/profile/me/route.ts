import { localRequest, privateBase, sessionHeaders, privateResponse, smallJson, mappedPrivateError } from "../../../../lib/private-api";
import { isProfile } from "../../../../lib/profile";
async function proxy(request: Request, write: boolean) {
  if (!localRequest(request)) return privateResponse({ code: "ACCESS_DENIED" }, undefined, 403);
  let body: unknown;
  if (write) {
    try { body = await smallJson(request); } catch { return privateResponse({ code: "PROFILE_INVALID" }, undefined, 400); }
    if (!body || typeof body !== "object" || Object.keys(body).sort().join(",") !== "displayName,preferredLanguage,revision") return privateResponse({ code: "PROFILE_INVALID" }, undefined, 400);
  }
  try {
    const headers = sessionHeaders(request); if (write) headers.set("content-type", "application/json");
    const upstream = await fetch(`${privateBase()}/api/profile/me`, { method: write ? "PUT" : "GET", headers, ...(write ? { body: JSON.stringify(body) } : {}), cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(10000) });
    const value: unknown = await upstream.json();
    if (!upstream.ok) return privateResponse(mappedPrivateError(value), upstream, [400, 401, 403, 404, 409, 503].includes(upstream.status) ? upstream.status : 503);
    if (!isProfile(value)) throw new Error("Invalid response");
    return privateResponse(value, upstream);
  } catch { return privateResponse({ code: "PROFILE_UNAVAILABLE" }); }
}
export async function GET(request: Request) { return proxy(request, false); }
export async function PUT(request: Request) { return proxy(request, true); }
