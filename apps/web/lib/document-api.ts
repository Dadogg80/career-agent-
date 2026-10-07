import { localRequest, privateBase, sessionHeaders, privateResponse, smallJson, mappedPrivateError } from "./private-api";
import { claimId, isClaim } from "./claims";
import { isDocument, isDocumentList, isDocumentDetail } from "./documents";
type Operation = "list" | "upload" | "detail" | "original" | "master" | "claim" | "delete";
export async function documentProxy(request: Request, operation: Operation, id?: string) {
  if (!localRequest(request)) return privateResponse({ code: "ACCESS_DENIED" }, undefined, 403);
  if (id !== undefined && !claimId.test(id)) return privateResponse({ code: "DOCUMENT_INVALID" }, undefined, 400);
  const headers = sessionHeaders(request); let body: BodyInit | undefined;
  if (operation === "upload") {
    try {
      if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) throw new Error("Invalid upload");
      const reader = request.body?.getReader(); if (!reader) throw new Error("Missing upload");
      let size = 0; const parts: Uint8Array[] = [];
      while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 6291456) { await reader.cancel(); return privateResponse({ code: "DOCUMENT_TOO_LARGE" }, undefined, 413); } parts.push(part.value); }
      const form = await new Response(Buffer.concat(parts), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
      if ([...form.keys()].sort().join(",") !== "file,language") throw new Error("Invalid fields");
      const file = form.get("file"); const language = form.get("language");
      if (!(file instanceof File) || !["nb", "en"].includes(String(language)) || !/\.(docx|pdf)$/i.test(file.name)) throw new Error("Invalid file");
      if (file.size === 0 || file.size > 5242880) return privateResponse({ code: "DOCUMENT_TOO_LARGE" }, undefined, 413);
      const upload = new FormData(); upload.append("file", file); upload.append("language", String(language)); body = upload;
    } catch { return privateResponse({ code: "DOCUMENT_INVALID" }, undefined, 400); }
  }
  if (operation === "claim") {
    try {
      const value = await smallJson(request, 16384) as Record<string, unknown>;
      if (!value || !["context,quote,skill,statement", "analysisId,context,quote,skill,statement"].includes(Object.keys(value).sort().join(",")) || (value.analysisId !== undefined && (typeof value.analysisId !== "string" || !claimId.test(value.analysisId))) || !Object.entries({ skill:120, statement:1000, context:500, quote:1000 }).every(([key, max]) => typeof value[key] === "string" && value[key].trim().length > 0 && value[key].length <= max)) throw new Error("Invalid claim");
      headers.set("Content-Type", "application/json"); body = JSON.stringify(value);
    } catch { return privateResponse({ code: "DOCUMENT_INVALID" }, undefined, 400); }
  }
  try {
    const suffix = operation === "original" ? "/original" : operation === "master" ? "/master" : operation === "claim" ? "/claims" : "";
    const method = operation === "delete" ? "DELETE" : ["upload", "master", "claim"].includes(operation) ? "POST" : "GET";
    const upstream = await fetch(`${privateBase()}/api/profile/me/documents${id ? `/${id}` : ""}${suffix}`, { method, headers, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(30000) });
    if (upstream.status === 204 && operation === "delete") return privateResponse(null, upstream);
    if (upstream.ok && operation === "original") {
      const bytes = await upstream.arrayBuffer(); if (bytes.byteLength > 5242880) throw new Error("Invalid file");
      return new Response(bytes, { headers: { "Cache-Control": "no-store", "Content-Type": "application/octet-stream", "X-Content-Type-Options": "nosniff", "Content-Disposition": upstream.headers.get("content-disposition") ?? "attachment" } });
    }
    const value: unknown = await upstream.json();
    if (!upstream.ok) return privateResponse(mappedPrivateError(value), upstream, [400,401,403,404,409,413,429,503].includes(upstream.status) ? upstream.status : 503);
    const valid = operation === "list" ? isDocumentList(value) : operation === "detail" ? isDocumentDetail(value) : operation === "claim" ? isClaim(value) : isDocument(value);
    if (!valid) throw new Error("Invalid response");
    return privateResponse(value, upstream);
  } catch { return privateResponse({ code: "DOCUMENT_UNAVAILABLE" }); }
}
