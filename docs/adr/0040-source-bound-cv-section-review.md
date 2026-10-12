# ADR 0040 — Source-bound CV sections and preliminary review plans

Status: accepted incremental continuation, 2026-10-12.

## Decision

Use the existing literal CV passages without changing segmentation or approved-text composition. Group them under conservatively recognized Norwegian/English standalone headings; preserve every passage exactly once in source order. Repeated headings remain separate source-bound sections. A passage with embedded/multiple recognized headings stays UNCLASSIFIED, rather than falsely assigning mixed content. IDs derive from the exact source snapshot and starting passage index: stable within that snapshot, intentionally changed by source edits. They are not a universal semantic identity across rewritten CVs.

Supply these sections to the existing recipient-approved CV_TAILORING call. Add one preliminary section plan per section: KEEP_UNCHANGED, PROPOSE_CHANGES or NEEDS_REVIEW; priority, reason and owned claim/criterion references. Explicit KEEP cannot coexist with a valid proposal in that section; PROPOSE requires a valid proposal and references. Missing/invalid/duplicate/conflicting plans become unassessed NEEDS_REVIEW. The twelve-proposal bound never limits the number of reviewed sections. Prompt version cv-section-wording-v2 is saved on new sessions.

Persist sections/plans as optional fields in existing immutable session JSON. No migration or write-on-read upgrade is introduced. Legacy sessions remain reviewable and explicitly disclose missing plans; no provider call is made merely to display them. Client validation checks full ordered passage membership and source/references when available. Preserve the existing exact source, ownership, match freshness and review revisions.

Add compact section navigation, priority/reason/source details and proposal filtering. Section navigation is local presentation; approval/edit/rejection remains the existing persisted wording review. Preserve selected section after a successful review save in the same session. Show source uncertainty and incomplete assessments separately from competence gaps or CV readiness.

## Limits

This is a preliminary review/priority plan produced alongside suggestions, not a separately approved strategy-before-generation workflow or a complete template editor. Heading recognition does not validate DOCX box structure, PDF reading order or semantic completeness. Malformed/unheaded content remains usable but unclassified. Source matching proves provenance, not semantic support of rewritten text. No new provider stage, model default, factual confirmation, generated file, final quality verdict or CV_READY is introduced. Structured template slots, deeper section-specific review and versioned standard artifacts remain next steps.
