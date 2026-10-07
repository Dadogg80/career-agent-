export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.CAREER_API_BASE_URL ?? "http://127.0.0.1:8080";

  try {
    const response = await fetch(`${base}/api/system/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error("Backend unavailable");
    const result: unknown = await response.json();
    if (
      typeof result !== "object" || result === null ||
      !("application" in result) || result.application !== "career-agent" ||
      !("status" in result) || result.status !== "UP"
    ) {
      throw new Error("Invalid backend response");
    }
    return Response.json({ status: "UP" });
  } catch {
    return Response.json({ status: "UNAVAILABLE" }, { status: 503 });
  }
}
