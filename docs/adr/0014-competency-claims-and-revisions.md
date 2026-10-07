# ADR 0014: Owned competency statements and explicit revision review

Status: Accepted for the local pilot, 2026-10-07.

## Decision

Implement manual/source-selected competency claims in the existing profile module. A claim contains skill label, own contribution, prose project/employment context, source note, status and revision. Optional document evidence adds an owned document reference and exact source quote. All creation starts UNVERIFIED. CONFIRMED and REJECTED require a separate owner action against the current revision; content edits reset confirmation. INFERRED is reserved and has no creation path in this slice.

Serialize writes on the verified issuer+subject identity binding, compare revisions and record full snapshots with action/owner/timestamp in the same PostgreSQL transaction. Clients cannot supply ownership or confirmed status. Keep the last 20 history items in API responses, retaining all items until explicit permanent deletion. Document deletion detaches references while preserving existing quote/note evidence, as explained before deletion.

## Consequences

Confirmation is user attestation, not a probability or external verification. Project/employment context is prose for now; normalized Employment/Project domains remain future work. No private AI processing, event broker or agent runtime is needed. Privacy/export/account deletion and backup retention remain unresolved before external use.
