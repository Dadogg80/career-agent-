export type AiSelection = { provider: "Groq" | "Gemini"; model: string };
export type AiApproval = { token: string; selections: AiSelection[] };
export type AiOption = { approval: AiApproval; available: boolean };
export type AiArea = "documents" | "documentExcerpt" | "matching" | "job" | "tailoring" | "sourceRetrieval";
export type AiConfiguration = { tailoring?:AiApproval; sourceBrowser?:AiSelection; sourceRetrieval?:AiApproval; tasks: Record<"JOB_ANALYSIS" | "DOCUMENT_EXTRACTION" | "PROFILE_SUMMARY" | "PERSONAL_MATCH", AiSelection>; documents: AiApproval; documentExcerpt: AiApproval; matching: AiApproval; job?:AiApproval; options?: Partial<Record<AiArea,AiOption[]>> };
export function isAiSelection(s: unknown): s is AiSelection {
  if(!s || typeof s!=="object")return false;
  const value=s as AiSelection;
  return ["Groq","Gemini"].includes(value.provider) && typeof value.model==="string" && /^[A-Za-z0-9./_-]{1,100}$/.test(value.model);
}
export function isAiConfiguration(value: unknown): value is AiConfiguration {
  if (!value || typeof value !== "object") return false;
  const v = value as AiConfiguration;
  if(v.sourceBrowser!==undefined && !isAiSelection(v.sourceBrowser))return false;
  const selection = isAiSelection;
  const approval = (a: AiApproval) => !!a && typeof a.token === "string" && /^[a-f0-9]{64}$/.test(a.token) && Array.isArray(a.selections) && a.selections.length > 0 && a.selections.length <= 2 && a.selections.every(selection);
  return (v.tailoring===undefined || approval(v.tailoring)) && (v.sourceRetrieval===undefined || approval(v.sourceRetrieval)) && (v.options?.tailoring===undefined || Array.isArray(v.options.tailoring) && v.options.tailoring.length<=5 && v.options.tailoring.every(o=>!!o && typeof o.available==="boolean" && approval(o.approval))) && (v.options?.sourceRetrieval===undefined || Array.isArray(v.options.sourceRetrieval) && v.options.sourceRetrieval.length<=5 && v.options.sourceRetrieval.every(o=>!!o && typeof o.available==="boolean" && approval(o.approval))) && (v.job===undefined || approval(v.job)) && (v.options===undefined || !!v.options && ["documents","documentExcerpt","matching","job"].every(k=>Array.isArray(v.options?.[k as AiArea]) && v.options[k as AiArea]!.length<=5 && v.options[k as AiArea]!.every(o=>!!o && typeof o.available==="boolean" && approval(o.approval)))) && !!v.tasks && ["JOB_ANALYSIS", "DOCUMENT_EXTRACTION", "PROFILE_SUMMARY", "PERSONAL_MATCH"].every(t => selection(v.tasks[t as keyof AiConfiguration["tasks"]])) && approval(v.documents) && approval(v.documentExcerpt) && approval(v.matching);
}
export function aiRecipients(approval?: AiApproval) {
  return approval?.selections.map(s => s.provider).filter((v,i,a) => a.indexOf(v) === i).join(" + ") ?? "AI";
}
export function validAiApprovalField(input: Record<string, unknown>) {
  return !Object.hasOwn(input, "aiApproval") || typeof input.aiApproval === "string" && /^[a-f0-9]{64}$/.test(input.aiApproval);
}
