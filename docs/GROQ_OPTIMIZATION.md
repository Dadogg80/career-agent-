# Groq usage and task models

Reviewed against Groq's official documentation on 2026-10-08. Account screenshots are observations, not permanent quota guarantees. Changes described as implemented are on the current unpublished branch.

## Findings and decisions

| Official guidance | Product consequence |
| --- | --- |
| [Prompt caching](https://console.groq.com/docs/prompt-caching) matches exact prefixes; supported GPT OSS models use automatic caching. Cached tokens receive a discount and are deducted from quota after processing. | Keep task instructions/schema stable and variable source evidence last. Log `cached_tokens` to measure actual hits. Do not assume cache hits or available capacity when dispatching concurrent calls. Caching does not preserve application results. |
| [Rate limits](https://console.groq.com/docs/rate-limits) apply at organization level and include minute and daily limits. | Preserve Retry-After, share observed cooldown and reuse stored sources/results. A 10-second pause cannot solve daily exhaustion; switching models is not a guaranteed independent-quota solution. |
| Request rate headers describe daily requests; token headers describe minute tokens. | Usage logs distinguish `remainingDailyRequests` and `remainingMinuteTokens`. Do not present either as a remaining daily token balance. |
| [Structured outputs](https://console.groq.com/docs/structured-outputs) require a supported model and strict schema. | Allowlist documented 20B/120B/Qwen 3.8 text models for task overrides. Schema correctness does not prove evidence, completeness or experience. Keep independent source checks and explicit confirmation. |
| [Browser Search](https://console.groq.com/docs/tool-use/built-in-tools/browser-search) is incompatible with structured outputs. | Keep FINN retrieval and structured analysis separate. Reuse the received source for manual retries instead of searching again. A combined one-call strict-JSON browser flow is not supported. |
| [Reasoning](https://console.groq.com/docs/reasoning) allows low effort and controls returned reasoning. | Use low effort. Hide returned reasoning; hiding it alone does not eliminate reasoning token use. |
| [Batch](https://console.groq.com/docs/batch) requires the Developer plan and is asynchronous. | Defer it for this free interactive pilot. No plan upgrade is authorized. |

## Implemented configuration

All overrides default to empty, preserving `GROQ_MODEL=openai/gpt-oss-20b`.

| Task | Optional backend variable | Output cap |
| --- | --- | --- |
| Advertisement extraction | `GROQ_JOB_MODEL` | 3,500 tokens |
| Document extraction, including legacy analysis endpoints | `GROQ_DOCUMENT_MODEL` | 3,500 tokens |
| Final document-based candidate summary | `GROQ_PROFILE_MODEL` | 1,800 tokens |
| Approved personal matching | `GROQ_MATCH_MODEL` | 3,500 tokens |
| FINN Browser Search | Existing `GROQ_MODEL` | Existing 4,000-token cap |

Output limits bound completion work; they are not measured total usage or guarantees against truncation. Incomplete output is retained as a paused workflow issue, not accepted as facts. Task-level success logs contain model/task, input/output/cached counts and safe numeric rate headers. Logs never contain source text, private profile details, secrets or raw provider errors.

The full-document workflow uses contiguous portions of at most approximately 3,500 source characters with a bounded nearby header prefix. It performs one extraction call per portion and one final summary call over a round-robin selection of up to 30 sourced evidence snippets. Final synthesis is deliberately bounded: it does not reread every source or guarantee every fact is summarized. Successful portion results are stored; completed output can be reopened without inference. Revision replay prevents repeated committed steps from spending another call.

`DOCUMENT_AI_BATCH_DELAY_SECONDS=65` paces successful document steps. `DOCUMENT_AI_MAX_REQUESTS=40` is the workflow's process-local attempt budget. Legacy analysis has its own counter using the same setting, not a shared quota ledger. Neither protects against usage elsewhere in the account. Provider failures pause instead of automatically retrying or switching models. A crash between provider completion and transaction commit can require a repeated call after lease expiry; this is not provider exactly-once delivery.

## Quality gate and next optimizations

Request-body routing and limits have automated tests. The live extraction comparison on a supplied document received Groq 429, so neither relative model quality nor reliable end-to-end extraction has been established for the new prompts. Keep defaults until a bounded Norwegian/English benchmark passes. Candidate experiment: 20B for short ads, 120B for complex document extraction/matching, and compare 20B/120B/Qwen for summaries. Configure tasks deliberately; do not rotate models after rejection.

Next useful increments: collect measured usage/cache-hit rates, reduce repeated matching descriptions through sourced evidence selection, and add versioned result reuse only when input, source revisions, consent scope, prompt/schema and model match. A shared cross-process quota scheduler needs actual provider/account measurements first. Smaller prompts and fewer redundant calls matter more than a fixed animation or arbitrary pause.
