# ADR 0049: Explicit OpenAI Responses generation provider

Status: Accepted for implementation by the owner on 2026-10-15; live quality validation pending.

## Context

The FINN audit established retrieval omissions, summary-dominated analysis and local validation/grouping defects. The owner deferred those six improvements and requested an independent OpenAI baseline without changing prompts, input or parsers. Existing code already separates structured generation from advertisement retrieval and binds approval to task/provider/model selections.

## Decision

Add `OpenAiModel` behind `AiModel`, explicit routing/capabilities and existing selection/approval controls. Support `gpt-5.4-mini` and `gpt-5.4` through Responses API with strict JSON Schema, low reasoning, bounded output and `store: false`. Use the existing JDK HTTP/proxy approach rather than introducing an SDK or workflow framework. Preserve Groq/Gemini defaults and retrieval adapters. Extend shared frontend provider validation, including mixed document-run history, without weakening source or ownership checks.

Read `OPENAI_API_KEY`, with `CAREER_OPENAI_API_KEY` as a managed-cloud fallback because that environment reserves OPENAI-prefixed variable names. Record non-content usage and dated estimated cost, count cached input correctly and never add reasoning a second time. Do not claim billing accuracy, zero retention or factual validity from schema success.

## Consequences and verification

No migration, automatic fallback/retry, source-parser/prompt change, official release or six-point pipeline implementation is included. Existing saved Groq/Gemini results remain readable. Offline checks verify protocol/routing/UI compatibility; live tests are manual, owner-approved and budgeted. The initial experiment is blocked by Responses `invalid_api_key`, so no OpenAI model-quality recommendation is justified yet. See [OpenAI provider operations](../OPENAI_PROVIDER.md) for configuration, rates and current limits.
