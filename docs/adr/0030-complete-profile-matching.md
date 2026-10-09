# ADR 0030: Complete confirmed-profile matching

Status: Accepted for the current continuation, pending review/merge.

## Context

Local lexical selection and the combined 30-claim/12,000-character limit can omit relevant documented experience. Manual skill checkboxes complicate the candidate's matching flow. The owner requested all available competency evidence and persisted percentages on job cards.

## Decision

Use every supported owned CONFIRMED contribution (the existing profile capacity is 500), with the complete saved advertisement by default. Retain inspectable preview and explicit recipient/model approval. Require exact equality between previewed and current confirmed revision sets; recheck the full set before publication. New results identify automatic evidence so subsequent additions invalidate them; legacy snapshots retain their existing semantics.

Pack repeated exact statement/context pairs into one passage dictionary. Every claim ID/revision/skill is retained and points to its original passage; validation and persisted snapshots retain their literal texts. Do not merge different companies or normalize prose. One provider call, existing budget/semaphore and explicit recovery remain. Gemini matching receives a longer bounded timeout, with a correspondingly longer proxy timeout.

Job cards use the private saved-assessment endpoint/TanStack cache to show deterministic weighted requirement coverage. Reads do not initiate AI; stale and unavailable results have honest states. Source/evidence readers are collapsible and bounded. No score is a hiring probability.

## Consequences and limits

The old match-specific contribution/character truncation is removed; finite profile, advertisement and request safety bounds remain. Large profiles may exceed provider context/token limits, especially on Groq. Packing reduces repeated text, not unique evidence or daily quota consumption. No automatic paid upgrade, silent fallback, uncontrolled multi-call workflow, new migration or raw-document transmission is introduced. Typed history and unreviewed proposals are not silently promoted to matching facts. Generalized conflict records and semantic completeness remain separate increments.
