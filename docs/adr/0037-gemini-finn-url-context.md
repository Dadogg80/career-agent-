# ADR 0037: Separate Gemini 3.8 FINN URL Context retrieval

- Status: Accepted for the local pilot
- Date: 2026-10-09

## Context

The owner requested a choice of provider/model for retrieving a FINN advertisement independent of the model that analyzes its requirements. The existing Groq Browser Search route must remain available. A Gemini analysis choice must not be treated as consent to send a URL to Google or as evidence that URL retrieval is available.

## Decision

- Model `JOB_SOURCE_RETRIEVAL` separately from `JOB_ANALYSIS`. The backend exposes only bounded configured plans and opaque approval fingerprints; the web client never selects an arbitrary model or receives a provider key.
- Keep Groq Browser Search/Exa as an available retrieval plan. Add Gemini `gemini-3.8-flash` URL Context as a separately selectable plan for canonical public FINN job-ad URLs only. NAV links continue through NAV's API without an AI retrieval call. Pasted text bypasses retrieval.
- Require an explicit retrieval-plan fingerprint on the import request. Analysis uses its own independently selected fingerprint. Choosing either plan does not automatically change or approve the other, and errors never silently switch providers.
- Send the exact canonical FINN URL through the Interactions API URL Context tool. Accept a result only after a completed interaction, a successful URL Context result for that exact URL, and an output URL citation to the same URL. Do not relax these checks to suppress `SOURCE_NOT_AVAILABLE`.
- Mark Gemini output as `GEMINI_URL_CONTEXT_EXCERPT` and disclose that it is AI-prepared text, not the verified original page or a guarantee of completeness. Retain the original link and source-inspection affordance. The excerpt may be paraphrased, incomplete or stale.
- Keep backend-only API keys, one in-flight source request, the existing bounded per-process retrieval limit, provider-specific cooldowns and no automatic retries. No paid Search grounding, plan upgrade or infrastructure is enabled.

## Consequences and limits

The source model is visible independently of the analysis model. Successful model listing or backend key binding does not certify API capacity, account quota, source freshness or semantic completeness. A real Gemini 3.8 call and real FINN response are not part of routine tests; the new adapter is tested with synthetic Interactions responses. The earlier 3.8 generation attempt returned 503, so generation readiness remains unverified. Source terms, retention and public-advertisement reuse need separate production review.

See [Gemini setup](../GEMINI_SETUP.md), [ADR 0010](0010-finn-browser-search.md), [ADR 0025](0025-explicit-ai-providers-and-approval.md) and [ADR 0026](0026-approved-ai-provider-recovery.md).
