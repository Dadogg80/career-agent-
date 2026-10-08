import { isAiConfiguration } from "../../../../lib/ai-configuration";
import { localRequest, privateBase, privateResponse } from "../../../../lib/private-api";

export async function GET(request: Request) {
  if (!localRequest(request)) return privateResponse({ code: "ACCESS_DENIED" }, undefined, 403);
  try {
    const upstream = await fetch(`${privateBase()}/api/ai/config`, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(5000) });
    const value = await upstream.json();
    if (!upstream.ok || !isAiConfiguration(value)) return privateResponse({ code: "AI_NOT_CONFIGURED" }, undefined, 503);
    return privateResponse(value, undefined, 200);
  } catch { return privateResponse({ code: "AI_NOT_CONFIGURED" }, undefined, 503); }
}
