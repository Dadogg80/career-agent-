# ADR 0041: Immutable reviewed CV wording drafts

Status: Accepted, 2026-10-12

The approved process needs a durable handoff from reviewed wording to the CV library without treating wording acceptance as candidate confirmation or final document approval.

Create a separate owned DRAFT CvVersion using optional reviewedSource JSON content and templateVersion reviewed-text-v1. Use the persisted session/revision; accept no client-supplied CV text, evidence or identity. Recheck exact owned source, current automatic match and the complete confirmed revision set under the existing owner lock. Require all suggestions resolved and at least one accepted change; reapply the numerical review policy. Substitute accepted wording at exact source ranges, preserving all remaining text/whitespace. Record source hash, session revision and complete evidence references. Repeated creation for the same owner/session/revision returns the existing version.

Reuse existing list/read/delete behavior and source staleness, extending staleness to complete evidence references and original source text. Do not merge this content into profile facts or overwrite original documents. No schema migration or AI call is required.

This delivery stores wording only. Block the old approve/export path for reviewedSource content with CV_FINAL_REVIEW_REQUIRED; it cannot silently export an empty typed-profile CV or acquire APPROVED/CV_READY status. Legacy standard-v1 versions retain their existing behavior. Actual DOCX/PDF generation, immutable output provenance and independent semantic/structural/visual document review remain subsequent work.

The typed profile identity attached to the version is library metadata, not an inferred replacement for identity/contact text in the original source. The preview renders literal reviewedSource text. Original wording retained outside accepted changes is not newly fact-checked by this operation.
