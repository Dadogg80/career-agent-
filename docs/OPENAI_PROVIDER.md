# Optional OpenAI provider

OpenAI is an explicit third provider for structured generation through the existing `AiModel` contract. Existing Groq/Gemini defaults, advertisement retrieval, analysis prompts, source validators, consent and persisted facts remain unchanged. No OpenAI browsing, tools, automatic fallback, retries, file upload or conversation history is enabled.

## Configuration and privacy

- Ordinary local backend: set `OPENAI_API_KEY` in the ignored `apps/backend/.env` or a secret manager. Never commit it or use a `NEXT_PUBLIC_*` variable.
- Managed cloud environments that reserve `OPENAI_` names: configure the personal secret `CAREER_OPENAI_API_KEY`, sent only to `api.openai.com`. The backend accepts it when `OPENAI_API_KEY` is absent/blank. Never print either value. Preserve the session proxy and verified CA trust.
- Default **within OpenAI**: `gpt-5.4-mini`. Optional reference: `gpt-5.4`. Adding credentials does not change existing task defaults or authorize a call.
- Choose OpenAI in the existing task selector. Optional local overrides are `AI_JOB_PROVIDER=openai` and `OPENAI_JOB_MODEL=gpt-5.4-mini`; equivalent DOCUMENT, PROFILE, MATCH and TAILORING task overrides exist. `OPENAI_MODEL` is the OpenAI fallback. Unsupported models are not silently substituted.
- OpenAI is not a `JOB_SOURCE_RETRIEVAL` capability. If the global `AI_PROVIDER` is explicitly OpenAI, source retrieval remains separately configured and otherwise uses the existing Groq browser default. Select a supported Groq/Gemini source option independently.
- Every private run retains provider/model-bound approval. Changing the selection invalidates prior approval. Owned endpoints and existing downstream source/revision checks remain responsible for private data.
- Responses requests use `store: false`, no `previous_response_id`, and no hosted tools. This disables application-state storage for this integration; it is **not** a promise of zero retention. Provider abuse-monitoring policies still apply.
- Key presence means configured, not authenticated, funded, available or quality-tested.

## Transport and structured output

The adapter uses the existing JDK HTTP/proxy pattern at `POST https://api.openai.com/v1/responses`. Original system instructions are passed unchanged as `instructions`; original source text is a user `input_text`. The existing logical JSON Schema is sent unchanged under `text.format` with `type: json_schema` and `strict: true`. Service tier is explicitly `default` for standard-rate estimates. Reasoning effort defaults to `medium` (`OPENAI_REASONING_EFFORT=high` is also supported); unsupported temperature/seed assumptions are avoided.

Only completed assistant `output_text` containing a JSON object is accepted. Reasoning items are not treated as facts. Refusals, incomplete outputs and malformed JSON produce bounded errors. Existing task parsers still validate the returned JSON; strict syntax alone does not establish factual correctness or completeness. Errors and usage logs do not include keys, provider error messages, source text or model output.

## Usage and cost estimates

Logs include selected/returned model, duration, input/cached/output/reasoning/total tokens and estimated USD. Reasoning is already included in output tokens and must not be charged twice. Invalid/missing usage is unknown, not a fabricated zero. Usage from a successful exchange is recorded before application validation, including subsequently rejected output.

Standard text prices checked against official documentation on 2026-10-15, USD per million tokens:

| Model | Uncached input | Cached input | Output including reasoning |
| --- | ---: | ---: | ---: |
| gpt-5.4-mini | 0.75 | 0.075 | 4.50 |
| gpt-5.4 | 2.50 | 0.25 | 15.00 |

Estimate = `(input - cached) × input rate + cached × cache rate + output × output rate`, divided by 1,000,000. This estimate excludes taxes and account-specific/regional/service-tier differences. It is not an invoice, an account budget or a durable spending ledger. Recheck rates before later experiments; update the dated rate table explicitly if required.

## Verification and controlled comparison

Offline adapter tests exercise request fidelity, output budgets, response/error parsing, credential configuration, routing/approval isolation, no retries and token/cost accounting. Browser/contract tests use synthetic responses and disable all provider keys; they establish UI/data compatibility, not model quality. No live API test belongs in ordinary CI.

The owner approved a separate manual experiment capped at USD 0.50: three Mini analyses and one GPT-5.4 reference, using the frozen FINN source, original prompt/schema and existing validation. Private evidence and harnesses remain outside Git under `/workspace/reports`. Evaluate the pre-existing 17 semantic criteria, not just output item counts. Separate raw-model errors from retrieval omissions and local importance/source-validation effects. Do not implement the six proposed pipeline improvements during this baseline experiment.

Historical 2026-10-15 live status (superseded by the 2026-10-16 check below): authenticated analysis had **not** completed. Two generation attempts returned provider HTTP 401, mapped to `AI_ACCESS_DENIED`; a fresh-process retry after environment activation did not resolve it. An independent Responses authentication/schema diagnostic also returned `invalid_api_key`. Read-only model metadata returned HTTP 200 but is insufficient to establish Responses access. No OpenAI quality, latency, token or cost benchmark can be inferred from these failures. Further generation is paused pending a corrected secret binding; no automatic retry is scheduled.

Sources: [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [GPT-5.4](https://developers.openai.com/api/docs/models/gpt-5.4), [pricing](https://developers.openai.com/api/docs/pricing), [data controls](https://developers.openai.com/api/docs/guides/your-data).


## 2026-10-16 authentication and approved quality comparison

Direct local checks returned HTTP 200 for model metadata and for actual Mini Responses generation with validated JSON. The earlier 401 failure is not reproduced with the currently configured local credential. The owner subsequently approved private advertisement/document/match comparison across Groq, Gemini and OpenAI, including measured corrections, with an initial OpenAI ceiling of USD 2. This is a new experiment; it does not establish that the earlier environment/secret binding was repaired everywhere. Original private sources and output snapshots remain outside Git. No provider defaults or automatic fallback change.

## Configurable generation limits — 2026-10-16

OpenAI defaults to 32,768 output tokens for advertisement analysis, document extraction, matching and CV proposals; profile summaries default to 16,384. These budgets include reasoning tokens. `OPENAI_MAX_OUTPUT_TOKENS` overrides the task defaults, and `OPENAI_{JOB,DOCUMENT,PROFILE,MATCH,TAILORING}_MAX_OUTPUT_TOKENS` overrides the global value. Values must be integers from 1 through 65,536. Explicit smaller call budgets remain enforced.

`OPENAI_REQUEST_TIMEOUT_SECONDS` defaults to 300 and accepts 30–300 seconds. Each provider call has a maximum five-minute wait, without automatic retries or provider switching. A workflow containing several sequential calls can take longer overall. Invalid configuration fails before generation. Larger limits are ceilings, not requested answer lengths or account spending limits. Groq and Gemini budgets are unchanged.
