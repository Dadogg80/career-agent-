# ADR 0029: Revision-aware competency and career relationships

Status: Accepted for the local pilot, 2026-10-08, within the owner-authorized incremental document/profile continuation.

## Problem

A competency contribution had a free-text context but no structured relationship to a saved employment, project or education entry. Repeated skill cards were already consolidated; this change preserves those independent contributions while making their career context inspectable and correctable.

## Decision

Add one append-only `claim_career_context` event table in Flyway V15. Owner-scoped foreign keys reference both exact claim and career-entry revisions. Commands require current claim/entry revisions and the expected relationship version, serialized under the existing owner lock. An identical replay returns the saved decision; conflicting decisions return 409. Each pair is bounded to 1,000 events. Unlink events remain tombstones until either target is deleted.

During approved profile population, automatically link only untouched revision-one DOCUMENT-confirmed facts to a unique untouched career entry. Both must have evidence from the same owned retained document. The entry quotation must contain the competency quotation and the literal context with word boundaries, match current career content, and still occur exactly in the document. The competency context must equal the entry's organization, client or title under NFC/case/whitespace normalization. Multiple supported entries, including reviewed entries with unchanged content, are ambiguous: do not select one. Prior relationship decisions block automatic relinking. No new provider call or permission is involved.

Owners may explicitly associate a contribution with an existing non-rejected career entry or remove its relationship. This records USER relationship basis; it does not attest the competency or career content and never updates their confirmation status. No inference from a nearby company label, filename or shared skill alone is sufficient for an automatic relationship.

Reads use one repeatable-read snapshot. Comparison with the recorded content yields CURRENT, STALE, INACTIVE or REMOVED. Status-only reviews preserve unchanged relationships; changed content requires review. Rejected unchanged targets are inactive. Deleted original documents clear document pointers while retaining existing quotation evidence under the pilot's established deletion policy. Deleting either target cascades its relationship events.

## UI and boundaries

Keep one profile card per skill. A compact Work and projects control opens relationships for an individual contribution, with organization/title, client, period, career draft status and expandable exact evidence. A searchable shadcn dialog chooses saved entries. Stale relationships offer explicit review; quota failures are irrelevant to these local operations. Requests are authenticated, CSRF-protected, same-origin and no-store. Private queries load on demand and are removed on logout; mutations have no automatic retry.

Existing records are not backfilled on startup, old job/CV snapshots are not rewritten, and current matching/export eligibility is unchanged. New completed processing can create supported relationships for still-untouched records. This is the first structured context slice, not the proposed normalized catalog, semantic aliases, clarification entity or conflict arbitration. Those remain future increments. Providers/models, approvals and AI budgets are unchanged; Flash Lite remains available for all supported analysis tasks.
