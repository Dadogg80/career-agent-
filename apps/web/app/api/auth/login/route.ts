import { localRequest, privateResponse } from "../../../../lib/private-api";
export async function GET(request: Request) {
  if (!localRequest(request)) return privateResponse({ code: "ACCESS_DENIED" }, undefined, 403);
  try {
    const base = new URL(process.env.BACKEND_PUBLIC_ORIGIN ?? "http://127.0.0.1:8080");
    if (!["127.0.0.1", "localhost"].includes(base.hostname) || !["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== "/") throw new Error("Invalid origin");
    return new Response(null, { status: 303, headers: { Location: `${base.origin}/oauth2/authorization/career`, "Cache-Control": "no-store" } });
  } catch { return privateResponse({ code: "PROFILE_UNAVAILABLE" }); }
}
