import { localRequest, privateBase, sessionHeaders, privateResponse, mappedPrivateError } from "../../../../lib/private-api";
export async function POST(request: Request) {
  if (!localRequest(request)) return privateResponse({ code: "ACCESS_DENIED" }, undefined, 403);
  try {
    const upstream = await fetch(`${privateBase()}/api/auth/logout`, { method: "POST", headers: sessionHeaders(request), cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(10000) });
    if (upstream.status === 204) return privateResponse(null, upstream);
    return privateResponse(mappedPrivateError(await upstream.json()), upstream, [401, 403].includes(upstream.status) ? upstream.status : 503);
  } catch { return privateResponse({ code: "PROFILE_UNAVAILABLE" }); }
}
