import type { Page } from "@playwright/test";
import type { AiConfiguration } from "../../lib/ai-configuration";

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
