# Gemini setup and task routing

Status: opt-in local-pilot integration. Groq remains the default when `AI_PROVIDER` is unset. No paid account, billing upgrade, automatic fallback or key rotation is created.

## Local configuration

Add to the existing ignored `apps/backend/.env`; preserve existing database and Groq settings:

```dotenv
GEMINI_API_KEY="your-key"
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-3.5-flash
```

From the repository root, load the file into the terminal that starts the backend:

```bash
cd apps/backend
set -a
source .env
set +a
./gradlew test bootJar
java -jar build/libs/career-agent-backend.jar
```

Spring does not automatically load this arbitrary `.env`. Never put keys into frontend files, `NEXT_PUBLIC_*`, source control, chat or browser storage. Restrict the Google key to the Generative Language API. The cloud environment declares `GEMINI_API_KEY` as a proxy-bound secret for `generativelanguage.googleapis.com`; use environment settings for its value. A saved configuration draft is not runtime activation.

## Explicit task selection

`AI_PROVIDER` selects the default (`groq` or `gemini`). `AI_JOB_PROVIDER`, `AI_DOCUMENT_PROVIDER`, `AI_PROFILE_PROVIDER` and `AI_MATCH_PROVIDER` override it. Empty overrides use the default. Each selected provider uses its existing `GROQ_MODEL` or `GEMINI_MODEL`, with optional `*_JOB_MODEL`, `*_DOCUMENT_MODEL`, `*_PROFILE_MODEL`, `*_MATCH_MODEL` overrides.

Example: keep Groq structured job analysis while testing Gemini document extraction and profile synthesis:

```dotenv
AI_PROVIDER=groq
AI_DOCUMENT_PROVIDER=gemini
AI_PROFILE_PROVIDER=gemini
GEMINI_MODEL=gemini-3.5-flash
```

Supported Gemini text models in this first adapter are stable Flash 3.5/3.6/3.7/3.8 and Flash-Lite 3.5/3.1. Availability in model listing is not generation readiness or quality certification. Only 3.5 Flash has passed the actual synthetic document extraction/profile pipeline in this instance. 3.8 Flash generation returned 503, so the Gemini-specific default is 3.5 Flash. Groq defaults remain unchanged. No `latest` alias, Pro preview, paid Search grounding, explicit remote cache, uploaded remote files or native PDF/URL Context is enabled.

FINN retrieval still uses Groq Browser Search/Exa independently. Selecting Gemini analysis does not remove that source quota. Pasted text bypasses retrieval. When analysis uses Gemini, the frontend skips the Groq-to-Groq ten-second pacing pause. Document workflows use `DOCUMENT_GEMINI_BATCH_DELAY_SECONDS` (default 5, bounded 0..300) for the next Gemini step; Groq keeps `DOCUMENT_AI_BATCH_DELAY_SECONDS` (default 65). Neither delay guarantees capacity.

## Approval, evidence and recovery

`GET /api/ai/config` exposes only non-secret task selections and preview fingerprints. Private matching, document excerpts and whole-document runs send `aiApproval` with their explicit consent. The fingerprint covers tasks, recipients and models; it is a configuration snapshot, not authentication or a grant to read private data. OIDC ownership and CSRF remain required.

Changing recipient/model resets approval on the client and is checked again by the backend before sending. Workflow approval is persisted, so changing configuration cannot silently migrate a stored run to a new provider. Old clients/runs without a fingerprint may use their explicitly approved Groq recipient only; Gemini requires the current fingerprint. Existing sourced drafts remain available for review after a configuration change.

All output remains unverified until the user explicitly confirms it. JSON Schema does not prove facts. Source passages, literal technologies, nearby employer/project evidence and exact quotation checks are unchanged. Broader responsibilities receive literal source labels and editable explanatory descriptions. Final synthesis includes career-history evidence and preserves already sourced profile sections when synthesis omits them.

Gemini uses the stateless `generateContent` endpoint with its key in a header, separate instructions/data, JSON Schema and low thinking. Output budgets include thinking and must leave room for complete structured results. Blocked, truncated, empty and malformed responses keep prior work. 429 records the longest usable bounded header/RetryInfo wait in a Gemini-specific cooldown, without retry loops or provider switching. Invalid configuration, access denial, outages and rejected output stay distinct internally. UI recovery text explains preserved information.

Logs contain task/model, safe failure categories and input/output/thinking/cache token counts; never keys, prompts, files, profiles or raw error payloads. Usage is currently logged on the backend; no cumulative quota dashboard is implied. Cooldowns and request budgets are process-local.

## Privacy and quality checks

First verification uses synthetic data only. No owner CV was sent to Google in this implementation. Real-document comparison still requires a reviewed preview and recipient-specific approval. Review current account terms before expansion. Google's terms distinguish EEA/Switzerland/UK data usage: paid-service data-use rules also apply to unpaid services there. This is not a promise of zero retention, EU-only hosting or production GDPR completion.

Normal automated tests do not call live providers. The explicit synthetic live test is gated:

```bash
GEMINI_LIVE_TEST=true GEMINI_MODEL=gemini-3.5-flash ./gradlew test --tests '*GeminiLiveTest'
```

It makes at most two model calls, checks explicit technologies/responsibilities, excludes unsupported Kafka/Kubernetes/Spring/idempotency, verifies source quotes/history and synthesizes the candidate profile. It is not an exhaustive semantic audit of real documents or a Groq-vs-Gemini benchmark.

Official references checked on 2026-10-08: [models](https://ai.google.dev/gemini-api/docs/models), [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [thinking](https://ai.google.dev/gemini-api/docs/thinking), [keys](https://ai.google.dev/gemini-api/docs/api-key), [pricing](https://ai.google.dev/gemini-api/docs/pricing), [terms](https://ai.google.dev/gemini-api/terms).

## In-app recovery without restarting

Keep `GROQ_API_KEY` and `GEMINI_API_KEY` in the ignored backend `.env`. `AI_PROVIDER` and task/model variables still set defaults. With both keys loaded into the backend process, the UI offers configured alternatives in **Change**, plus **Try with Gemini** after a recoverable Groq failure. Adding a key for the first time still requires restarting the backend.

For documents and personal matching, selecting another provider resets approval. Review the same private preview and approve the newly displayed recipient before continuing. Document recovery resumes the saved run at its next unfinished portion. The old result is retained and carries its original model metadata. The alternate provider can also be quota-limited; switching does not reset pilot budgets or promise success.

FINN search still uses Groq/Exa. Gemini recovery applies to analysis of already received advertisement text, document extraction/profile synthesis and personal matching, not to fetching a FINN URL. No key is sent to the browser. Older saved results without model metadata show “model not recorded”.
