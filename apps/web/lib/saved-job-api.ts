import { claimId } from "./claims";
import { isSavedContent, isSavedJob, isSavedJobs } from "./saved-jobs";
import { localRequest, privateBase, sessionHeaders, privateResponse, smallJson, mappedPrivateError } from "./private-api";
export async function savedJobProxy(request: Request, operation: "list" | "save" | "detail" | "delete", id?: string) {
 if (!localRequest(request)) return privateResponse({ code: "ACCESS_DENIED" }, undefined, 403);
 if (id !== undefined && !claimId.test(id)) return privateResponse({ code: "SAVED_JOB_INVALID" }, undefined, 400);
 const headers = sessionHeaders(request); let body: string | undefined;
 if (operation === "save") {
  try { const v = await smallJson(request, 100000); if (!isSavedContent(v) || Object.keys(v).sort().join(",") !== "facts,locale,omittedItems,requirements,retrievedAt,sourceType,sourceUrl,text,title") throw new Error("Invalid snapshot"); body = JSON.stringify(v); headers.set("Content-Type", "application/json"); }
  catch { return privateResponse({ code: "SAVED_JOB_INVALID" }, undefined, 400); }
 }
 try {
  const response = await fetch(`${privateBase()}/api/profile/me/jobs${id ? `/${id}` : ""}`, { method: operation === "save" ? "POST" : operation === "delete" ? "DELETE" : "GET", headers, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(15000) });
  if (operation === "delete" && response.status === 204) return privateResponse(null, response);
  const value: unknown = await response.json();
  if (!response.ok) return privateResponse(mappedPrivateError(value), response, [400,401,403,404,409,503].includes(response.status) ? response.status : 503);
  if (!(operation === "list" ? isSavedJobs(value) : isSavedJob(value))) throw new Error("Invalid response");
  return privateResponse(value, response);
 } catch { return privateResponse({ code: "SAVED_JOB_UNAVAILABLE" }); }
}
