import { localRequest, privateBase, sessionHeaders, privateResponse } from "../../../../lib/private-api";
import { isSession } from "../../../../lib/profile";
export async function GET(request: Request) {
  if (!localRequest(request)) return privateResponse({ code: "ACCESS_DENIED" }, undefined, 403);
  try {
    const upstream = await fetch(`${privateBase()}/api/auth/session`, { headers: sessionHeaders(request), cache: "no-store", signal: AbortSignal.timeout(10000) });
    const body: unknown = await upstream.json();
    if (!upstream.ok || !isSession(body)) throw new Error("Unavailable");
    return privateResponse(body, upstream);
  } catch { return privateResponse({ code: "PROFILE_UNAVAILABLE" }); }
}
