export const analysisFailureReasons = ["PROVIDER_SCHEMA_MISMATCH", "OUTPUT_INCOMPLETE", "EMPTY_OUTPUT", "MALFORMED_JSON", "NO_SUPPORTED_ITEMS", "INVALID_STRUCTURE"] as const;
export type AnalysisFailureReason = typeof analysisFailureReasons[number];
export function safeAnalysisReason(value: unknown): AnalysisFailureReason | undefined { return analysisFailureReasons.includes(value as AnalysisFailureReason) ? value as AnalysisFailureReason : undefined; }

export type AnalysisStage = "source" | "wait" | "analysis";
export type StageState = "running" | "success" | "error" | "skipped" | "cancelled";
export type AnalysisPhase = AnalysisStage | "idle" | "done" | "error" | "cancelled";
export type DiagnosticEvent = {
  runId: string;
  elapsedMs: number;
  stage: AnalysisStage;
  state: StageState;
  details: {
    provider?: "Groq" | "Gemini";
    model?: string;
    endpoint?: "/api/jobs/import" | "/api/jobs/requirements";
    httpStatus?: number;
    durationMs?: number;
    characters?: number;
    sourceType?: "NAV_API" | "GROQ_BROWSER_EXCERPT" | "PASTED_TEXT";
    reused?: boolean;
    seconds?: number;
    code?: string;
    reason?: AnalysisFailureReason;
    requirements?: number;
    facts?: number;
    omittedItems?: number;
  };
};

// Public, build-time settings only. Never put a provider key in NEXT_PUBLIC_*.
const configuredDelay = Number(process.env.NEXT_PUBLIC_ANALYSIS_DELAY_SECONDS?.trim() || "10");
export const analysisDelaySeconds = Number.isFinite(configuredDelay)
  ? Math.min(120, Math.max(0, Math.ceil(configuredDelay))) : 10;
export const diagnosticsEnabled = process.env.NODE_ENV === "development"
  || process.env.NEXT_PUBLIC_JOB_DIAGNOSTICS === "true";

export function waitForAnalysis(seconds: number, signal: AbortSignal): Promise<boolean> {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(false); return; }
    const finish = (completed: boolean) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      resolve(completed);
    };
    const abort = () => finish(false);
    const timer = setTimeout(() => finish(true), seconds * 1000);
    signal.addEventListener("abort", abort, { once: true });
  });
}
