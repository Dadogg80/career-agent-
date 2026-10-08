export type AiSelection = { provider: "Groq" | "Gemini"; model: string };
export type AiApproval = { token: string; selections: AiSelection[] };
export type AiConfiguration = { tasks: Record<"JOB_ANALYSIS" | "DOCUMENT_EXTRACTION" | "PROFILE_SUMMARY" | "PERSONAL_MATCH", AiSelection>; documents: AiApproval; documentExcerpt: AiApproval; matching: AiApproval };
export function isAiConfiguration(value: unknown): value is AiConfiguration {
  if (!value || typeof value !== "object") return false;
  const v = value as AiConfiguration;
  const selection = (s: AiSelection) => !!s && ["Groq", "Gemini"].includes(s.provider) && typeof s.model === "string" && /^[A-Za-z0-9./_-]{1,100}$/.test(s.model);
  const approval = (a: AiApproval) => !!a && typeof a.token === "string" && /^[a-f0-9]{64}$/.test(a.token) && Array.isArray(a.selections) && a.selections.length > 0 && a.selections.length <= 2 && a.selections.every(selection);
  return !!v.tasks && ["JOB_ANALYSIS", "DOCUMENT_EXTRACTION", "PROFILE_SUMMARY", "PERSONAL_MATCH"].every(t => selection(v.tasks[t as keyof AiConfiguration["tasks"]])) && approval(v.documents) && approval(v.documentExcerpt) && approval(v.matching);
}
export function aiRecipients(approval?: AiApproval) {
  return approval?.selections.map(s => s.provider).filter((v,i,a) => a.indexOf(v) === i).join(" + ") ?? "AI";
}
export function validAiApprovalField(input: Record<string, unknown>) {
  return !Object.hasOwn(input, "aiApproval") || typeof input.aiApproval === "string" && /^[a-f0-9]{64}$/.test(input.aiApproval);
}
