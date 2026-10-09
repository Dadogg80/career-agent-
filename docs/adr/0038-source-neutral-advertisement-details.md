# ADR 0038: Source-neutral practical details and conservative importance

Status: Accepted for the local pilot, 2026-10-09.

## Decision

Read literal practical fields from received advertisement text independently of the provider and source hostname. Recognize Norwegian/English inline or next-line labels, contact endpoints, location, deadline and selected employment fields. Merge these with AI facts instead of allowing one partial AI contact to hide other endpoints. Preserve source quotations and the complete received text, including during AI failure, and include merged details in newly saved snapshots. Existing snapshots remain readable. Explicit standalone email/phone values can be used as mailto/tel links; no person-to-endpoint association is inferred.

Validate new requirement importance against explicit wording or immediately governing recognized qualification headings. Unspecified, conflicting or mixed-scope importance remains UNCLEAR; generic emphasis cannot establish mandatory status. The check is deliberately conservative and supports a bounded Norwegian/English vocabulary, not exhaustive linguistic inference. Invalid provider enums and unsupported quotations remain rejected. Deduplicate after importance validation so contradictory categories cannot duplicate an otherwise identical criterion.

Strengthen the extraction prompt to retain qualifiers, separate mixed criteria and prefer employer wording over generated platform summaries. Original source text is unchanged; this slice does not implement automatic platform-block stripping.

## Limits and consequences

No provider/model defaults, temperature, approval rules, retrieval allowlists or database schemas change. Direct URL retrieval still supports validated FINN and NAV URLs; received/pasted text from other employers uses the same processing. Broader URL adapters and source provenance need separate review.

The existing 20-detail saved-snapshot limit remains. All received text remains readable; if merged details exceed that limit, explain why saving is unavailable rather than silently dropping facts. No deadline or contact detail is invented when absent. Label/criterion recall can still vary, and successful citation checks do not prove semantic completeness. Caching and explicit analysis comparison are separate follow-ups.
