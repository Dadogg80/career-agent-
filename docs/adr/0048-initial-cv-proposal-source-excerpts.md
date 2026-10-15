# ADR 0048: Literal source excerpts in initial CV proposals

Status: Accepted incremental continuation, 2026-10-15.

## Context

Valid claim IDs and numerical guards do not establish that a proposed CV statement follows from its sources. Controlled generation repeatedly cited a broad profile claim for a tool documented elsewhere, or expanded assisted work into a specialist activity. The approved master specification requires traceable evidence without treating AI judgment as factual confirmation.

## Decision

Use `cv-section-wording-v8` for new source-unit generations. Supply every confirmed claim with its complete statement/context, ID, revision and separately identified navigation label. Separate advertisement requirements from candidate proof. Retain criterion-to-claim associations and relation/nature constraints for visibility, but omit previous match classifications, explanations and questions from the writing input. Full confirmed evidence inclusion remains unchanged.

Require `sourceEvidence` on each new proposal: 1–20 distinct `{claimId, quote}` excerpts, at most 1,000 UTF-16 units each, literally contained in that exact referenced claim's statement or context. Every proposal claim ID must have an excerpt. Neither another claim's text, skill metadata, the CV nor the advertisement substitutes for that proof. Preserve full sources and their qualifiers in input/snapshots; excerpts do not become an evidence-retrieval cutoff.

Validate before retaining a proposal. Malformed/foreign/missing excerpts omit that item while preserving valid siblings and leaving review coverage unfinished. Save validated excerpts additively with the immutable proposal/claim snapshot. Legacy proposals default to null and remain readable without regeneration or source/index migration. Existing ownership, consent, concurrency, revision, protected-unit and numerical checks remain. One approved generation call, current provider budgets/defaults and human decisions are unchanged.

## Consequences and limits

This is a provenance improvement, not semantic verification. A literal excerpt can still be irrelevant or too broad. The final live Lite sample still introduced unsupported specialist wording despite a valid quote; source links must not earn a verified badge or automatic approval. An edited wording review does not inherit semantic support from the original proposal's excerpts. The separate optional source opinion remains independently approved and reads full linked facts, not just selected excerpts.

Nine bounded development calls included a final identical-input project/match/whole-CV comparison on private real-document fixtures. Groq 20B failed project schema and large CV capacity; matching still varied, and Lite's group reasoning remained generic. No best-model/default change, semantic reliability claim, final-file readiness or full 27-page project-recall result follows. Prioritize independent factual-scope handling and useful section reasoning next; do not multiply advisory calls to disguise generation defects.
