# ADR 0033: Evidence relations and qualification guidance

- Status: Accepted for this local-pilot slice
- Date: 2026-10-09
- Base: verified merged PR #29, main `8e88d1f0832b1ae673f7f01a110733b740b713da`

## Context

A literal quotation establishes provenance, not equivalence between capabilities. The saved methodology requires direct and transferable experience to remain distinct, and analogous practical work must not establish an authorization, degree or certification. Application preparation should explain what the saved match supports before proposing wording.

## Decision

New matching calls request per-criterion `evidenceRelation` (DIRECT, TRANSFERABLE, UNKNOWN) and `requirementNature` (FORMAL, PRACTICAL, OTHER). These are AI judgments about supplied sources, not new confirmed profile facts. FORMAL describes an explicit qualification, not every mandatory practical activity. The prompt preserves advertised qualification alternatives, such as degree OR relevant experience.

Keep literal owned claim/revision evidence validation. UNKNOWN or missing supported evidence becomes CLARIFY. TRANSFERABLE cannot receive STRONG: downgrade it to PARTIAL, or retain an existing CLARIFY. TRANSFERABLE with FORMAL becomes CLARIFY. The server does not independently verify a provider's DIRECT label semantically. Reasons and qualifications still require human review.

Persist nullable metadata in existing match JSON. Older results without metadata remain readable and are never retroactively labelled direct or formal. Accept the exact legacy response shape for compatibility; malformed or incomplete new metadata yields an unassessed item, not a new question about the candidate.

Show compact relation/qualification tags, supplementary help and unresolved mandatory qualification counts on saved cards. Application preparation derives three source-backed groups from the existing saved result: documented examples, transferable experience and mandatory qualifications needing review. Every qualifying criterion remains available in bounded scrollable lists. Show source quotation, referenced candidate contributions and stale assessment notice. No additional AI call is made for these groups.

Carry relation limits into the CV wording prompt. Preparation readiness labels incomplete assessment percentages provisional. This is application guidance from a match, not a completed base-CV visibility analysis, legal assessment, proven skill gap or hiring probability.

## Consequences and limits

No new migration, profile-status change, automatic provider retry/switch, default-model change or API approval scope is introduced. Existing full confirmed-evidence inclusion, consent, budgets, staleness and immutable originals remain. AI can misclassify the nature/relation or omit details; literal validation alone cannot prove semantics. Live model tests may conservatively request clarification of transferable experience instead of assigning partial credit.

Next: independently measure cross-profession criterion/relation quality and implement source-bound base-CV visibility outcomes. Durable writing changesets, exports, letters and submission remain separate deliveries.

## Owner-requested clarification review extension

Use the existing owned claim/review API for explicit answer rejection. Show associated confirmed, draft and rejected answers with accurate status; rejected statements are excluded from matching and remain visible for deliberate correction/reconfirmation. A separate rejection dialog, revision checks, failure retention and saved-identity reuse protect against accidental removal and duplicates. Success feedback is in the containing match panel so cache refresh does not erase the outcome. Personal/related-scope controls are writing aids; only entered wording becomes confirmed evidence. No new negative-competency taxonomy or automatic positive relevance is introduced.
