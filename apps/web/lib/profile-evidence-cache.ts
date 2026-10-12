import type { QueryClient } from "@tanstack/react-query";

/** Refresh owned evidence and saved match freshness, never initiate AI analysis. */
export async function refreshProfileEvidence(cache: QueryClient): Promise<void> {
  await Promise.all([
    cache.invalidateQueries({ queryKey: ["private-claims"] }),
    cache.invalidateQueries({ queryKey: ["private-job-match"] }),
  ]);
}
