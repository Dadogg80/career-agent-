import { claimId } from "./claims";
import { isPersonalMatch } from "./personal-match";
import { localRequest, privateBase, sessionHeaders, privateResponse, smallJson, mappedPrivateError } from "./private-api";
export async function personalMatchProxy(request: Request, id: string) {
 if (!localRequest(request)) return privateResponse({ code:"ACCESS_DENIED" }, undefined, 403);
 if (!claimId.test(id)) return privateResponse({ code:"MATCH_INPUT_INVALID" }, undefined, 400);
 const headers = sessionHeaders(request); let body: string | undefined;
 if (request.method === "POST") {
  try {
   const v = await smallJson(request, 73728) as Record<string,unknown>;
   if (!v || Object.keys(v).sort().join(",") !== "claims,consent,locale,text" || v.consent !== true || !["nb","en"].includes(String(v.locale)) || typeof v.text !== "string" || v.text.trim().length < 40 || v.text.length > 12000 || !Array.isArray(v.claims) || v.claims.length < 1 || v.claims.length > 30) throw new Error("Invalid input");
   const ids = new Set<string>();
   for (const c of v.claims) { if (!c || Object.keys(c).sort().join(",") !== "id,revision" || typeof c.id !== "string" || !claimId.test(c.id) || ids.has(c.id) || !Number.isSafeInteger(c.revision) || c.revision < 1) throw new Error("Invalid claim"); ids.add(c.id); }
   body = JSON.stringify(v); headers.set("Content-Type", "application/json");
  } catch { return privateResponse({ code:"MATCH_INPUT_INVALID" }, undefined, 400); }
 }
 try {
  const r = await fetch(`${privateBase()}/api/profile/me/jobs/${id}/match`, { method: request.method, headers, body, cache:"no-store", redirect:"manual", signal:AbortSignal.timeout(30000) });
  let v: unknown = await r.json();
  if (!r.ok) { const response = privateResponse(mappedPrivateError(v), r, [400,401,403,404,409,429,502,503].includes(r.status) ? r.status : 503); const retry = r.headers.get("retry-after"); if (r.status === 429 && retry && /^\d{1,3}$/.test(retry)) response.headers.set("Retry-After", String(Math.min(300, Math.max(1, Number(retry))))); return response; }
  if (request.method === "GET") { if (!v || typeof v !== "object" || !("analysis" in v)) throw new Error("Invalid response"); v = v.analysis; }
  if (!(v === null && request.method === "GET") && !isPersonalMatch(v)) throw new Error("Invalid response");
  return privateResponse(v, r);
 } catch { return privateResponse({ code:"MATCH_UNAVAILABLE" }); }
}
