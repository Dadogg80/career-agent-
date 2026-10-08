import { localRequest, privateBase, sessionHeaders, privateResponse, smallJson, mappedPrivateError } from "./private-api";
import { claimId, isClaim, isClaimList, isClaimHistory, isClaimEvidence, validClaimContent } from "./claims";
type Operation = "list" | "create" | "edit" | "review" | "history" | "evidence" | "delete";
export async function claimProxy(request: Request, operation: Operation, id?: string) {
  if (!localRequest(request)) return privateResponse({ code: "ACCESS_DENIED" }, undefined, 403);
  if (id !== undefined && !claimId.test(id)) return privateResponse({ code: "CLAIM_INVALID" }, undefined, 400);
  const write = !["list", "history", "evidence"].includes(operation);
  let body: Record<string, unknown> | undefined;
  if (write) {
    try {
      const value = await smallJson(request, 12288);
      const expected = operation === "create" ? ["skill", "statement", "context", "sourceNote"] : operation === "edit" ? ["skill", "statement", "context", "sourceNote", "revision"] : operation === "review" ? ["revision", "decision"] : ["revision"];
      if (!value || typeof value !== "object" || Object.keys(value).sort().join(",") !== expected.sort().join(",")) throw new Error("Invalid body");
      body = value as Record<string, unknown>;
      if (["create", "edit"].includes(operation) && !validClaimContent(body)) throw new Error("Invalid content");
      if (operation !== "create" && (typeof body.revision !== "number" || !Number.isSafeInteger(body.revision) || body.revision < 1)) throw new Error("Invalid revision");
      if (operation === "review" && !["CONFIRM", "REJECT"].includes(String(body.decision))) throw new Error("Invalid decision");
    } catch { return privateResponse({ code: "CLAIM_INVALID" }, undefined, 400); }
  }
  try {
    const headers = sessionHeaders(request); if (write) headers.set("content-type", "application/json");
    const suffix = operation === "review" ? "/review" : operation === "history" ? "/history" : operation === "evidence" ? "/evidence" : "";
    const method = operation === "edit" ? "PUT" : operation === "delete" ? "DELETE" : write ? "POST" : "GET";
    const upstream = await fetch(`${privateBase()}/api/profile/me/claims${id ? `/${id}` : ""}${suffix}`, { method, headers, ...(write ? { body: JSON.stringify(body) } : {}), cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(10000) });
    if (operation === "delete" && upstream.status === 204) return privateResponse(null, upstream);
    const value: unknown = await upstream.json();
    if (!upstream.ok) return privateResponse(mappedPrivateError(value), upstream, [400, 401, 403, 404, 409, 503].includes(upstream.status) ? upstream.status : 503);
    const valid = operation === "list" ? isClaimList(value) : operation === "history" ? isClaimHistory(value) : operation === "evidence" ? isClaimEvidence(value) : isClaim(value);
    if (!valid) throw new Error("Invalid response");
    return privateResponse(value, upstream);
  } catch { return privateResponse({ code: "CLAIM_UNAVAILABLE" }); }
}
