# ADR 0024: Bounded whole-document career review

Status: Accepted delegated implementation decision for the resumed local pilot, 2026-10-08. Implemented on an unpublished feature branch.

## Problem

Manual document portions, generic technology-list descriptions and empty career-history forms impose work already represented in uploaded sources. Large blind requests also consume quota and can discard usable output. The owner requested automatic full-source processing, editable AI-prepared profile/history/skills, reliable provenance and compact review UI.

## Decision

Use the existing modular monolith, PostgreSQL and private document adapters. Add owned resumable run state with contiguous bounded portions, one synchronous provider call per optimistic step, a processing lease and explicit pacing. The client drives sequential steps after one reviewed-preview approval. Committed revision replay reuses progress; failures preserve drafts and require manual continuation. Completed portions are source-validated before persisting. No queue, Kafka or Temporal is introduced.

Use numbered source evidence and strict JSON to draft distinct explicit skill labels, supported candidate-summary kinds and typed career entries. Exact quotes are assembled/validated outside the model. AI descriptions remain editable and unverified. Import reuses existing claim/entry revision rules; explicit factual confirmation can accompany review. Add owner/revision-linked career-entry quotations, preserving existing document-deletion disclosures. Implement no wholesale catalog/context/conflict migration.

Use shadcn review Sheets/cards and TanStack queries with no automatic mutation retries. Profile sections expose upload, competency and history without a long stacked page. Sources remain inspectable and original-language evidence remains unchanged. Conservative equality combines supporting quotes without merging different delivery contexts.

Configure model selection by task with unchanged defaults until quality evaluation. Honor observed provider cooldown; do not switch models after quota rejection. Stable prefixes and safe usage logging support measured optimization.

## Consequences

The flow remains bounded: some proposals can be omitted, the final summary uses selected sourced snippets, PDF column/tracking handling is heuristic, and no text-coverage count proves semantic completeness. Several documents can take minutes because actual calls are paced. Process budgets and shared cooldown are not durable account quota prediction. Closing the UI stops dispatch, not already running backend work. Crashes before persistence can repeat provider work after lease expiry. Imported summary prose is a draft, never an authoritative private AI memory.

Synthetic browser/contract tests and real PostgreSQL tests cover control flow and ownership; private supplied files check local extraction. A live Groq comparison was blocked by quota, so extraction quality and new model defaults remain a separate gate. No paid services, external rollout or GitHub publication are implied.
