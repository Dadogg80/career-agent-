# PR handoff: Groq advertisement extraction

Base: `main`

Head: `feat/job-requirements`

Status: Prepared handoff; the user creates and merges the PR. No PR is created by this document.

## Title

feat: add Groq-backed job requirement extraction with bilingual UI

## Description

Users can paste a public job advertisement and extract up to 12 requirements with required/preferred/unclear categories and source quotations. The Norwegian-first interface supports English, retains input after errors, and marks results as outdated after the advertisement changes.

Add a Groq adapter behind AiModel, strict structured output, server-side quotation validation, input/output limits, a single in-flight inference, and a per-process attempt cap. The key stays on the backend. A loopback-only, same-origin Next.js route proxies the request and returns sanitized error codes.

Document resolved/open decisions, Docker recommendations, local test instructions, and the limits of this pilot. The development order intentionally tests public advertisement extraction before introducing private candidate storage.

Validation:

- Backend build and 14 tests passed with no failures or skips.
- Next.js production build and TypeScript checks passed.
- 8 browser tests passed: localization, cited output, stale results, error retention, invalid/oversized input, cross-origin rejection and a real missing-key backend flow.
- Authenticated Groq model listing and fictional Norwegian/English backend inference succeeded. A live browser-to-Groq check also passed with a fictional advertisement; the resulting screen was visually inspected.

No private candidate storage, matching score, CV processing, database, authentication or public deployment is included. Groq quotas are provider-controlled; there is no paid fallback. The 20-attempt default resets on backend restart and is not a durable billing cap. Source quotations establish provenance, not semantic correctness of labels/categories. GitHub Actions and execution on the user's Mac still need verification.
