# ADR 0032 — Requirement coverage and persistent clarification review

Status: Accepted for implementation, 2026-10-09.

## Problem

The twelve-criterion limit could omit later responsibilities and formal qualifications before matching. Missing or invalid provider assessments were displayed as candidate clarifications, conflating incomplete AI output with unknown experience. The clarification UI did not reopen the existing personal answer and edited answers could create new contributions.

## Decision

Request every distinct explicit candidate criterion across the approved advertisement. Preserve literal evidence and mandatory/preferred wording, independently assessable compound criteria and explicit alternatives. Support 128 requirements end to end as a defensive payload bound, rather than a twelve-item selection. Exact repeated label/kind/quote triples are omitted; different independently assessable criteria sharing a quote remain. Input, output-token and request budgets are unchanged.

Persist `evaluated=false` on requirements without a valid provider assessment or excluded from the approved source preview. These remain unknown in the existing classification contract but have no candidate question; UI filters them separately as **Not assessed**. Weight coverage against all stored requirements and label incomplete results provisional. Older persisted assessments default to evaluated; old saved ads are not silently re-extracted.

Associate newly entered personal answers with saved job ID and criterion index in their existing source note. Matching includes a compact `userClarifications` index of approved current claim IDs, never extra unapproved source-note content. Recognize earlier title/skill notes where exact matching is possible. Prompt the model to consider existing literal answers and explain remaining scope; personal confirmation alone never establishes full requirement relevance. Do not preserve a previous model judgment as a new candidate fact or automatically promote a score.

Reopen the confirmed answer in the clarification UI. Edit the same claim with optimistic revision checks, then confirm. Retain the returned draft revision if confirmation fails, so explicit retry reviews it rather than creating or editing again. Exact repeated personal-answer creation reuses identity and never revives rejection. Ownership, revision, full confirmed evidence, CSRF and recipient/model-bound approval remain enforced. No new database migration or automatic AI retry.

Compact the document reader with consistent typography, counted tabs, helpful empty-queue next actions and supplementary help available by keyboard/touch. Missing-source passages use a searchable bounded semantic table with literal text. All original reading, OCR controls, consent disclosures and factual review actions remain. Source usage is not semantic completeness.

## Limits and next work

Provider reasoning can still vary. Linked personal answers improve attention, but do not guarantee STRONG classifications or eliminate semantic disagreements. Legacy renamed labels and generic pre-existing statements cannot always be associated automatically. Existing duplicate records are not destructively merged; their sources and independent review identities remain.

128 is a safety bound, not guaranteed recall. Truncation, source availability, output tokens, provider context and quota remain finite. The next slice measures requirement recall, explicit transferability and CV visibility. Tailoring retains twelve paragraph proposals and session-only decisions. Durable clarification relations, conflict reconciliation, durable writing review and broader onboarding remain separate increments.
