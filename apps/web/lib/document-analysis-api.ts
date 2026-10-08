import { retryAfterSeconds as parseRetryAfter } from "./retry-after";
import { localRequest, privateBase, sessionHeaders, privateResponse, smallJson, mappedPrivateError } from "./private-api";
import { claimId } from "./claims";
import { isDocumentAnalysis } from "./document-analysis";
import { safeAnalysisReason } from "./analysis-workflow";
export async function documentAnalysisProxy(request: Request, id?: string) {
  if (!localRequest(request)) return privateResponse({ code:"ACCESS_DENIED" }, undefined, 403);
  if (id !== undefined && !claimId.test(id)) return privateResponse({ code:"DOCUMENT_INVALID" }, undefined, 400);
  const headers = sessionHeaders(request); let body: string | undefined;
  if (request.method === "POST") {
    try {
      const input = await smallJson(request, 73728) as Record<string, unknown>;
      if (!input || input.consent !== true || !["nb", "en"].includes(String(input.locale))) throw new Error("Invalid request");
      if (id === undefined) {
        if (Object.keys(input).sort().join(",") !== "consent,documents,locale" || !Array.isArray(input.documents) || input.documents.length < 1 || input.documents.length > 20) throw new Error("Invalid documents");
        let total = 0; const ids = new Set<string>();
        for (const doc of input.documents) {
          if (!doc || Object.keys(doc).sort().join(",") !== "documentId,text" || typeof doc.documentId !== "string" || !claimId.test(doc.documentId) || ids.has(doc.documentId) || typeof doc.text !== "string" || !doc.text.trim()) throw new Error("Invalid document");
          ids.add(doc.documentId); total += doc.text.length;
        }
        if (total < 40 || total > 12000) throw new Error("Invalid size");
      } else if (Object.keys(input).sort().join(",") !== "consent,locale,text" || typeof input.text !== "string" || input.text.trim().length < 40 || input.text.length > 12000) throw new Error("Invalid request");
      body = JSON.stringify(input); headers.set("Content-Type", "application/json");
    } catch { return privateResponse({ code:"DOCUMENT_AI_INPUT_INVALID" }, undefined, 400); }
  }
  try {
    const upstream = await fetch(`${privateBase()}/api/profile/me/documents${id ? `/${id}` : ""}/analysis`, { method:request.method, headers, body, cache:"no-store", redirect:"manual", signal:AbortSignal.timeout(30000) });
    let value: unknown = await upstream.json();
    if (!upstream.ok) {
      const reason = safeAnalysisReason(value && typeof value === "object" && "reason" in value ? value.reason : undefined);
      const retry = upstream.headers.get("retry-after");
      const response = privateResponse({ ...mappedPrivateError(value), ...(reason ? { reason } : {}) }, upstream, [400,401,403,404,409,429,502,503].includes(upstream.status) ? upstream.status : 503);
      if (upstream.status === 429 && parseRetryAfter(retry)) response.headers.set("Retry-After", String(parseRetryAfter(retry)));
      return response;
    }
    if (request.method === "GET") {
      if (!value || typeof value !== "object" || !("analysis" in value)) throw new Error("Invalid response");
      value = value.analysis;
    }
    if (!(value === null && request.method === "GET") && !isDocumentAnalysis(value)) throw new Error("Invalid response");
    return privateResponse(value, upstream);
  } catch { return privateResponse({ code:"DOCUMENT_UNAVAILABLE" }); }
}
