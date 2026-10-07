# ADR 0016: Opt-in source-backed document competency analysis

Status: Accepted for the single local pilot, 2026-10-07; explicitly requested by the product owner before merging the CV branch.

Implementation extension: [ADR 0017](0017-competency-workspace-and-local-reading.md) adds twenty-proposal limits, whitespace-only evidence recovery, distributed excerpts, partial-item validation and optional explicit local OCR. The original decision below records the initial delivery.

## Decision

Extend the local import of ADR 0015 with optional Groq summarization of one document or all selected readable documents together. Upload and text extraction remain local. The user reviews/edits bounded text previews and approves each provider submission. Use the existing server-only Groq adapter without browser tools, profile injection, a new provider, a paid upgrade or automatic retries.

Generate up to three source-backed summary points and ten competency suggestions in Norwegian or English. Every quote must appear exactly in the submitted preview and the specified owned original extraction. Collection output identifies its source document; mismatched sources are omitted. Quote membership proves provenance, not semantic entailment. The user still reviews their own contribution. Adjacent inferred skills and confirmation are excluded.

Store the latest validated result per document and one latest combined result per owner in PostgreSQL. Store source attribution/coverage, not the full provider request/response. Successful reanalysis replaces suggestions, never saved claims. Failed reanalysis preserves the previous result. Creating/deleting a document invalidates the combined result; deleting a document cascades its individual result. Imported suggestion drafts retain AI-assisted source notes and enter the claim module only through an explicit user save as UNVERIFIED. Confirmation is separate.

## Bounds and consequences

At most 20 selected documents and 12,000 submitted text characters in one provider call. The UI distributes initial excerpts across readable documents and permits user editing; it shows skipped scans, actual sources and partial coverage. This is a bounded combined summary, not exhaustive full-document processing of arbitrarily long collections. There is no OCR or automatic multi-call chunking. A process semaphore and default ten attempts across both document analysis modes bound this local pilot; shared provider cooldown and manual retries handle quota rejection without guaranteeing account-wide token availability.

Private text now intentionally reaches Groq only through authenticated, CSRF-protected, same-origin private endpoints following explicit preview approval. Public advertisement routes and DEV diagnostics remain separate. No private content or raw provider errors are logged. Existing Groq account terms/settings apply; this pilot decision is not a GDPR compliance, EU residency or zero-retention claim. External users still require provider/data-processing/transfer, privacy, retention/deletion and deployment decisions.

This supersedes ADR 0015's deferral of private AI for the authorized local pilot only. Its original-storage, local extraction, deletion and production limitations remain in force. Background discovery, normalized employment/projects, matching, OCR and CV generation remain later increments.
