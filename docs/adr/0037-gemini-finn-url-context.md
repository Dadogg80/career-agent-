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

## Accepted extension — 2026-10-14

The owner requested every application-supported source model, especially Flash-Lite 3.5 and Flash 3.7. The bounded catalog now contains Gemini 3.5/3.1 Flash-Lite and regular Flash 3.5/3.6/3.7/3.8, plus Groq 20B/120B Browser Search. Existing source defaults, explicit overrides, separate task fingerprints and private-task menus are preserved. Configuration availability means a key is present, not current provider capacity. The frontend accepts a bounded larger source menu without relaxing private-task limits.

Additional Gemini models use `models/{selectedModel}:generateContent` with URL Context, a single candidate, low thinking and bounded output. Accept only STOP text and successful exact-requested-URL metadata on that same candidate. Ignore thought parts. Failed/missing/mismatched retrieval metadata, incomplete output and oversized text fail closed. Do not borrow retrieval proof from another candidate, model-written links or another response protocol. No automatic fallback or retry is added.

This explicitly extends the earlier output-citation requirement **only for the generateContent route**. A bounded public FINN probe using Flash-Lite 3.5 returned successful exact-URL metadata and text but no independent output citation. URL Context metadata proves provider-reported retrieval, not an output citation or complete/original advertisement. Keep `GEMINI_URL_CONTEXT_EXCERPT` and the original URL. The existing 3.8 Interactions route still requires completed interaction, successful exact-URL tool result and exact-URL output citation; those checks are unchanged.

Model listing confirms the selected IDs, not tool readiness or quality. Flash 3.7 returned 503 in two bounded tool probes; no successful retrieval or compatibility conclusion is claimed. Flash-Lite 3.1 was confirmed in the catalog with generateContent, without a live URL Context check. A separate Lite response returned HTTP 200/STOP with retrieval ERROR, demonstrating why HTTP success alone is insufficient. Public-source probes sent no private candidate material and enabled no paid services.
