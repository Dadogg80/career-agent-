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

`AI_PROVIDER` selects the default (`groq` or `gemini`). `AI_JOB_PROVIDER`, `AI_DOCUMENT_PROVIDER`, `AI_PROFILE_PROVIDER` and `AI_MATCH_PROVIDER` override it. Empty overrides use the default. Explicit `*_JOB_MODEL`, `*_DOCUMENT_MODEL`, `*_PROFILE_MODEL` and `*_MATCH_MODEL` overrides always win. Groq retains `GROQ_MODEL` as its fallback for all tasks. Gemini document extraction and profile synthesis default independently to `gemini-3.5-flash-lite`; the general `GEMINI_MODEL` applies to job analysis and personal matching, defaulting to `gemini-3.5-flash`. An existing general Flash setting therefore does not prevent the document/profile Lite defaults.

Example: keep Groq structured job analysis while testing Gemini document extraction and profile synthesis:

```dotenv
AI_PROVIDER=groq
AI_DOCUMENT_PROVIDER=gemini
AI_PROFILE_PROVIDER=gemini
GEMINI_MODEL=gemini-3.5-flash
```

Supported Gemini text models in this first adapter are stable Flash 3.5/3.6/3.7/3.8 and Flash-Lite 3.5/3.1. Availability in model listing is not generation readiness or quality certification. Both 3.5 Flash and 3.5 Flash-Lite have passed the actual synthetic document extraction/profile pipeline in this instance. The Flash-Lite check made two synthetic calls (1,952 total tokens), returned 11 competency proposals, two history drafts and six sourced profile sections, and excluded explicitly unsupported technologies. This is a small fixture check, not exhaustive real-CV validation or a rate-limit guarantee. 3.8 Flash generation returned 503. Gemini document/profile defaults now use 3.5 Flash-Lite; job/match retain 3.5 Flash. Groq defaults remain unchanged. No `latest` alias, Pro preview, paid Search grounding, explicit remote cache, uploaded remote files or native PDF/URL Context is enabled.

FINN retrieval still uses Groq Browser Search/Exa independently. Selecting Gemini analysis does not remove that source quota. Pasted text bypasses retrieval. When analysis uses Gemini, the frontend skips the Groq-to-Groq ten-second pacing pause. Document workflows use `DOCUMENT_GEMINI_BATCH_DELAY_SECONDS` (default 5, bounded 0..300) for the next Gemini step; Groq keeps `DOCUMENT_AI_BATCH_DELAY_SECONDS` (default 65). Neither delay guarantees capacity.

## Approval, evidence and recovery

`GET /api/ai/config` exposes only non-secret task selections and preview fingerprints. Private matching, document excerpts and whole-document runs send `aiApproval` with their explicit consent. The fingerprint covers tasks, recipients and models; it is a configuration snapshot, not authentication or a grant to read private data. OIDC ownership and CSRF remain required.

Changing recipient/model resets approval on the client and is checked again by the backend before sending. Workflow approval is persisted, so changing configuration cannot silently migrate a stored run to a new provider. Old clients/runs without a fingerprint may use their explicitly approved Groq recipient only; Gemini requires the current fingerprint. Existing sourced drafts remain available for review after a configuration change.

Generated wording remains unverified until the user explicitly confirms it. Optional documentary population can register literal source assertions with DOCUMENT basis under ADR 0027; that is distinct from personal USER confirmation. JSON Schema does not prove facts. Source passages, literal technologies, nearby employer/project evidence and exact quotation checks are unchanged. Broader responsibilities receive literal source labels and editable explanatory descriptions. Final synthesis includes career-history evidence and preserves already sourced profile sections when synthesis omits them.

Gemini uses the stateless `generateContent` endpoint with its key in a header, separate instructions/data, JSON Schema and low thinking. Output budgets include thinking and must leave room for complete structured results. Blocked, truncated, empty and malformed responses keep prior work. A 429 records the longest usable bounded header/RetryInfo wait in an application cooldown scoped to the selected Gemini model. A Flash cooldown therefore does not prevent an explicit Flash-Lite request, or vice versa. Google's project/account quotas may still apply across models. There are no retry loops or automatic provider switches. Invalid configuration, access denial, outages and rejected output stay distinct internally. UI recovery text explains preserved information.

Logs contain task/model, safe failure categories and input/output/thinking/cache token counts; never keys, prompts, files, profiles or raw error payloads. Usage is currently logged on the backend; no cumulative quota dashboard is implied. Cooldowns and request budgets are process-local.

## Privacy and quality checks

First verification uses synthetic data only. No owner CV was sent to Google in this implementation. Real-document comparison still requires a reviewed preview and recipient-specific approval. Review current account terms before expansion. Google's terms distinguish EEA/Switzerland/UK data usage: paid-service data-use rules also apply to unpaid services there. This is not a promise of zero retention, EU-only hosting or production GDPR completion.

Normal automated tests do not call live providers. The explicit synthetic live test is gated:

```bash
GEMINI_LIVE_TEST=true GEMINI_MODEL=gemini-3.5-flash-lite ./gradlew test --tests '*GeminiLiveTest'
```

It makes at most two model calls, checks explicit technologies/responsibilities, excludes unsupported Kafka/Kubernetes/Spring/idempotency, verifies source quotes/history and synthesizes the candidate profile. It is not an exhaustive semantic audit of real documents or a Groq-vs-Gemini benchmark.

Official references checked on 2026-10-08: [models](https://ai.google.dev/gemini-api/docs/models), [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [thinking](https://ai.google.dev/gemini-api/docs/thinking), [keys](https://ai.google.dev/gemini-api/docs/api-key), [pricing](https://ai.google.dev/gemini-api/docs/pricing), [terms](https://ai.google.dev/gemini-api/terms).

## In-app recovery without restarting

Keep `GROQ_API_KEY` and `GEMINI_API_KEY` in the ignored backend `.env`. `AI_PROVIDER` and task/model variables still set defaults. With both keys loaded into the backend process, the UI offers configured alternatives in **Change**, plus **Try with Gemini** after a recoverable Groq failure. Model choices are served by the backend at `/api/ai/config`; restart the backend after updating its code or adding a key, then reload the web app to see the current choices.

For documents and personal matching, selecting another provider resets approval. Review the same private preview and approve the newly displayed recipient before continuing. Document recovery resumes the saved run at its next unfinished portion. The old result is retained and carries its original model metadata. The alternate provider can also be quota-limited; switching does not reset pilot budgets or promise success.

FINN search still uses Groq/Exa. Gemini recovery applies to analysis of already received advertisement text, document extraction/profile synthesis and personal matching, not to fetching a FINN URL. No key is sent to the browser. Older saved results without model metadata show “model not recorded”.


## Default Flash-Lite task split

The owner approved Lite as the default where suitable after bounded synthetic validation:

| Gemini task | Default model | Explicit override |
| --- | --- | --- |
| Document extraction | `gemini-3.5-flash-lite` | `GEMINI_DOCUMENT_MODEL` |
| Candidate profile summary | `gemini-3.5-flash-lite` | `GEMINI_PROFILE_MODEL` |
| Job analysis | `gemini-3.5-flash` | `GEMINI_JOB_MODEL` |
| Personal matching | `gemini-3.5-flash` | `GEMINI_MATCH_MODEL` |

Job/match fall back to `GEMINI_MODEL` when configured; documents/profile deliberately have independent defaults. To retain Flash for either document task, explicitly set that task override to `gemini-3.5-flash`. To route only document/profile tasks to Gemini while keeping other providers unchanged, use:

```dotenv
AI_DOCUMENT_PROVIDER=gemini
AI_PROFILE_PROVIDER=gemini
```

Provider selection is unchanged; an unset provider still uses Groq. No ignored `.env` is modified by this change. Restart after updating the application or configuration. An existing approved run does not silently change model: inspect and approve the displayed new selection before further private processing. Saved results retain actual original model attribution.

Active project/tier/model quotas must be checked in AI Studio; model splitting cannot guarantee capacity. Antigravity is not a generateContent model ID and cannot be substituted into these variables. See [Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

## CV wording suggestions

`CV_TAILORING` has independent `AI_TAILORING_PROVIDER`, `GEMINI_TAILORING_MODEL` and `GROQ_TAILORING_MODEL` overrides. Unset provider still uses the general provider (Groq if unset); Gemini defaults independently to `gemini-3.5-flash-lite`. The same explicit Flash/Lite options and recipient/model fingerprints apply. Configure `TAILORING_AI_MAX_REQUESTS` (default 5 attempts per backend process) separately from matching. One request sends complete supported base text, advertisement and all confirmed match claims; source checks and quotas still apply. No automatic fallback, remote file upload or new CV artifact is introduced.
