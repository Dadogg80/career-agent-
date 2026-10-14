export type AiCallDiagnostic = {
  id: string;
  groupId: string;
  groupLabel: string;
  sequence: number;
  task: string;
  provider: string;
  model: string;
  endpoint: string;
  startedAt: string;
  durationMs: number | null;
  status: "RUNNING" | "SUCCESS" | "ERROR";
  instructions: string;
  input: string;
  schema: string;
  response: string | null;
  errorCode: string | null;
  truncatedFields: string[];
  downstreamOutcome?: "VALIDATED" | "INVALID_RESULT" | "RECOVERED_INVALID_RESULT" | null;
};

export type AiCallDiagnosticsSnapshot = {
  supported: boolean;
  capturing: boolean;
  retainedMinutes: number;
  maxCalls: number;
  calls: AiCallDiagnostic[];
};

function isCall(value: unknown): value is AiCallDiagnostic {
  if (!value || typeof value !== "object") return false;
  const call = value as Record<string, unknown>;
  return typeof call.id === "string" && typeof call.groupId === "string"
    && typeof call.groupLabel === "string" && typeof call.sequence === "number"
    && typeof call.task === "string" && typeof call.provider === "string"
    && typeof call.model === "string" && typeof call.endpoint === "string"
    && typeof call.startedAt === "string" && (call.durationMs === null || typeof call.durationMs === "number")
    && ["RUNNING", "SUCCESS", "ERROR"].includes(String(call.status))
    && typeof call.instructions === "string" && typeof call.input === "string"
    && typeof call.schema === "string" && (call.response === null || typeof call.response === "string")
    && (call.errorCode === null || typeof call.errorCode === "string")
    && Array.isArray(call.truncatedFields) && call.truncatedFields.every(field => typeof field === "string")
    && (call.downstreamOutcome === undefined || call.downstreamOutcome === null || ["VALIDATED", "INVALID_RESULT", "RECOVERED_INVALID_RESULT"].includes(String(call.downstreamOutcome)));
}

export function isAiCallDiagnosticsSnapshot(value: unknown): value is AiCallDiagnosticsSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  return typeof snapshot.supported === "boolean" && typeof snapshot.capturing === "boolean"
    && typeof snapshot.retainedMinutes === "number" && typeof snapshot.maxCalls === "number"
    && Array.isArray(snapshot.calls) && snapshot.calls.length <= 200 && snapshot.calls.every(isCall);
}
