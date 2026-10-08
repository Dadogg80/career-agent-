# ADR 0027: Documentary profile population and persistent review queue

Status: Accepted for the local pilot, 2026-10-08. Owner-directed continuation after PR #17.

## Problem

Full-document extraction still required re-entering known skills and career entries. A named technology list could be reduced to one label. The proposal grid mixed processed items with pending work, retained processed proposals on reload, and expanded into very tall equal-height cards. Matching required manual evidence selection and offered no explained coverage percentage or inline clarification.

## Decision

Keep the four claim statuses. Add an independent confirmation basis: NONE, DOCUMENT or USER. Automatic, explicitly enabled profile population may import an owned literal quotation containing the literal skill as CONFIRMED with DOCUMENT basis. This means a document declares the fact, not that its author has personally attested a generated interpretation. Generated competency prose, career-history descriptions and candidate presentation remain drafts. Reject negated/wished-for source statements from automatic population conservatively. Sources, provenance and current revisions remain inspectable; editing clears confirmation and personal review records USER basis.

Commit profile population with document progress under the owner's transaction/lock. Preserve original documents and period precision. An owned fingerprint ledger links analysis proposals to saved claims/entries, including manual review. Read-time decoration derives current proposal status from the target record. Deleted targets leave tombstones; a new analysis does not recreate them or overwrite reviewed/edited targets. Explicit review may link a newly saved record. Limits are 500 claims and 50 history entries; retain excess proposals for review and disclose limited population.

Recover missing individual labels from explicit technology/skills lists locally, with exact evidence and conservative source context. This recovery adds no provider call. It can preserve usable list facts after malformed structured output, but cannot repair arbitrary semantic omissions. Different contributions and unknown contexts stay distinct.

Default the compact competency queue to pending work. Approve, edit, save as draft or reject from the row. Move processed contributions to separate counted views, preserve all sources, and save decisions without AI calls. Editing uses the existing shadcn Sheet; completed source settings collapse and move below results. Group labels by context and skill while retaining each contribution and original backend index. The saved profile is authoritative after reopening.

For personal matching, preselect owned confirmed evidence locally within the existing request bounds, prioritizing requirement terms and deduplicating repeated passages. Users may adjust the selection. Explicit recipient/model-bound approval is still required. AI assesses the selected evidence; this slice does not send whole CV files in matching. Render deterministic documented requirement coverage: required weight 2, other criteria 1; strong supported relevance gets full weight, partial half, unknown zero documented coverage. Display the calculation and unresolved count; the percentage is not hiring probability. Inline clarification saves the user's own answer and explicitly confirms it through existing owned endpoints. Matching itself never confirms inferred experience.

Read the newest owned saved document synthesis for the profile presentation. New approved analyses refresh it, with actual provider/model attribution and expandable evidence. Rendering or uploading never starts an undisclosed summarization call.

## Consequences and limits

V13 migrates existing confirmed claims to USER basis, enforces action/basis combinations and adds owner-constrained ledger links. Legacy runs default to proposals-only. Existing reviewed facts, sources, job snapshots and deletion disclosures remain intact. The full knowledge graph, semantic alias/conflict reconciliation, complete responsibility inventory and bounded AI repair loop remain separate increments. Neither processed character coverage nor recovered labels guarantees discovery of every competency. Private documents and provider fixtures stay outside Git.
