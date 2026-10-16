import type { Page } from "@playwright/test";
import type { AiConfiguration, AiSelection } from "../../lib/ai-configuration";

// Browser scenarios mock AI results; the real test backend deliberately has no provider keys.
export async function mockAiConfiguration(page: Page) {
  const selection = { provider: "Groq", model: "openai/gpt-oss-20b" } as const;
  const approval = { token: "a".repeat(64), selections: [selection] };
  const options = [{ approval, available: true }];
  const configuration: AiConfiguration = {
    tasks: {
      JOB_ANALYSIS: selection,
      DOCUMENT_EXTRACTION: selection,
      PROFILE_SUMMARY: selection,
      PERSONAL_MATCH: selection,
      CV_TAILORING: selection,
    },
    documents: approval,
    documentExcerpt: approval,
    matching: approval,
    job: approval,
    tailoring: approval,
    sourceRetrieval: approval,
    options: { documents: options, documentExcerpt: options, matching: options, job: options,
      tailoring: options, sourceRetrieval: options },
  };
  await page.route("**/api/ai/config", route => route.fulfill({ json: configuration }));
}

// Full catalog fixture catches client limits that a single-option fixture cannot exercise.
export function syntheticStructuredConfiguration(): AiConfiguration {
  const selections: AiSelection[] = [
    ...["openai/gpt-oss-20b", "openai/gpt-oss-120b"].map(model => ({provider:"Groq" as const, model})),
    ...["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"].map(model => ({provider:"Gemini" as const, model})),
    ...["gpt-5.4-mini", "gpt-5.4", "gpt-6.1-sol", "gpt-6-luna"].map(model => ({provider:"OpenAI" as const, model})),
  ];
  const options = selections.map((selection,index) => ({approval:{token:index.toString(16).padStart(64,"0"),selections:[selection]},available:true}));
  const approval=options[0].approval, selection=selections[0];
  return {tasks:{JOB_ANALYSIS:selection,DOCUMENT_EXTRACTION:selection,PROFILE_SUMMARY:selection,PERSONAL_MATCH:selection,CV_TAILORING:selection},
    documents:approval,documentExcerpt:approval,matching:approval,job:approval,tailoring:approval,
    options:{documents:options,documentExcerpt:options,matching:options,job:options,tailoring:options}};
}
