/** Shared numeric delay contract with the backend; long daily-quota waits must survive every proxy/UI. */
export function retryAfterSeconds(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && !/^\d+(?:\.\d+)?$/.test(value)) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(86400, Math.ceil(seconds)) : undefined;
}

export function retryWaitLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours ? `${hours} h` : "", minutes ? `${minutes} min` : "", remainder ? `${remainder} s` : ""].filter(Boolean).join(" ");
}
