export const aiProviders = ["Groq", "Gemini", "OpenAI"] as const;
export type AiProvider = typeof aiProviders[number];
export type AiProviderLabel = AiProvider | `${AiProvider} + ${AiProvider}` | `${AiProvider} + ${AiProvider} + ${AiProvider}`;
export function isAiProvider(value: unknown): value is AiProvider {
  return typeof value === "string" && (aiProviders as readonly string[]).includes(value);
}
export function isAiProviderLabel(value: unknown): value is AiProviderLabel {
  if (typeof value !== "string") return false;
  const providers = value.split(" + ");
  return providers.length >= 1 && providers.length <= aiProviders.length && new Set(providers).size === providers.length && providers.every(isAiProvider);
}
export type AiSelection = { provider: AiProvider; model: string };
export type AiApproval = { token: string; selections: AiSelection[] };
export type AiOption = { approval: AiApproval; available: boolean };
export type AiArea = "documents" | "documentExcerpt" | "matching" | "job" | "tailoring" | "sourceRetrieval";
export const aiFailureReasons=["OUTPUT_REFUSED","EMPTY_OUTPUT","MALFORMED_JSON","OUTPUT_INCOMPLETE","PROVIDER_SCHEMA_MISMATCH","DOCUMENT_RESULT_INVALID"] as const;
export type AiFailureReason=typeof aiFailureReasons[number];
export function isAiFailureReason(value:unknown):value is AiFailureReason {return typeof value==="string" && (aiFailureReasons as readonly string[]).includes(value);}
export type AiConfiguration = { tailoring?:AiApproval; sourceBrowser?:AiSelection; sourceRetrieval?:AiApproval; tasks: Record<"JOB_ANALYSIS" | "DOCUMENT_EXTRACTION" | "PROFILE_SUMMARY" | "PERSONAL_MATCH" | "CV_TAILORING", AiSelection>; documents: AiApproval; documentExcerpt: AiApproval; matching: AiApproval; job?:AiApproval; options?: Partial<Record<AiArea,AiOption[]>> };
export function isAiSelection(s: unknown): s is AiSelection {
  if(!s || typeof s!=="object")return false;
  const value=s as AiSelection;
  return isAiProvider(value.provider) && typeof value.model==="string" && /^[A-Za-z0-9./_-]{1,100}$/.test(value.model);
}
export function isAiConfiguration(value: unknown): value is AiConfiguration {
  if (!value || typeof value !== "object") return false;
  const v = value as AiConfiguration;
  if(v.sourceBrowser!==undefined && !isAiSelection(v.sourceBrowser))return false;
  const selection = isAiSelection;
  const approval = (a: AiApproval) => !!a && typeof a.token === "string" && /^[a-f0-9]{64}$/.test(a.token) && Array.isArray(a.selections) && a.selections.length > 0 && a.selections.length <= 2 && a.selections.every(selection);
  return (v.tailoring===undefined || approval(v.tailoring)) && (v.sourceRetrieval===undefined || approval(v.sourceRetrieval)) && (v.options?.tailoring===undefined || Array.isArray(v.options.tailoring) && v.options.tailoring.length<=10 && v.options.tailoring.every(o=>!!o && typeof o.available==="boolean" && approval(o.approval))) && (v.options?.sourceRetrieval===undefined || Array.isArray(v.options.sourceRetrieval) && v.options.sourceRetrieval.length<=16 && v.options.sourceRetrieval.every(o=>!!o && typeof o.available==="boolean" && approval(o.approval))) && (v.job===undefined || approval(v.job)) && (v.options===undefined || !!v.options && ["documents","documentExcerpt","matching","job"].every(k=>Array.isArray(v.options?.[k as AiArea]) && v.options[k as AiArea]!.length<=10 && v.options[k as AiArea]!.every(o=>!!o && typeof o.available==="boolean" && approval(o.approval)))) && !!v.tasks && ["JOB_ANALYSIS", "DOCUMENT_EXTRACTION", "PROFILE_SUMMARY", "PERSONAL_MATCH","CV_TAILORING"].every(t => selection(v.tasks[t as keyof AiConfiguration["tasks"]])) && approval(v.documents) && approval(v.documentExcerpt) && approval(v.matching);
}
export function aiRecipients(approval?: AiApproval) {
  return approval?.selections.map(s => s.provider).filter((v,i,a) => a.indexOf(v) === i).join(" + ") ?? "AI";
}
export function validAiApprovalField(input: Record<string, unknown>) {
  return !Object.hasOwn(input, "aiApproval") || typeof input.aiApproval === "string" && /^[a-f0-9]{64}$/.test(input.aiApproval);
}
