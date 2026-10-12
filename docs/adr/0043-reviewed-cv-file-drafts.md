# ADR 0043: Standard file drafts from reviewed CV wording

Status: Accepted, 2026-10-12

The approved CV process needs actual files to inspect before final document approval. Extend ADR 0041 with explicit owned POST /api/profile/me/cvs/{id}/files accepting only the current revision. Generate both formats from immutable reviewedSource.text using the existing standard renderer; profile metadata and empty typed collections must not replace the reviewed wording. Original layout is not reproduced.

Read both actual artifacts back with the separate document extractor before storing them. Compare ordered non-whitespace characters with the reviewed text. Reject missing, changed, reordered or added characters; this intentionally tolerates wrapping/spacing differences and does not certify typography, word boundaries, ATS suitability, factual accuracy or semantic relevance. Unsupported glyphs, oversize content/files and rendering failures fail closed, retaining the text draft. The preview path is bounded to 60,000 source characters, 20 PDF pages and 5 MB per file; no truncation is allowed.

Reuse cv_version.artifacts while retaining DRAFT and null approvedAt. Persist SHA-256, format and size; increment the version revision once. Recheck ownership, complete confirmed-claim revisions and original document text SHA under the owner lock after rendering. Already generated current-version files are returned unchanged. Existing version/source snapshots remain immutable; stale drafts cannot generate files but their previously stored files remain readable historical drafts. Existing cleanup handles deleting both objects.

Private reads/downloads remain authenticated, owned and no-store; mutations require CSRF and strict request schemas. The browser proxy accepts file-bearing reviewed drafts, but still rejects approved reviewed versions and file-bearing legacy drafts. No migration, external converter, provider call or new factual confirmation is introduced.

The existing approval path continues to reject reviewed-source versions with CV_FINAL_REVIEW_REQUIRED. Application CV_READY remains unavailable for them. Independent semantic/structural/visual review of actual DOCX and PDF, reviewed readiness decisions and supported original-template fidelity remain subsequent work. A passed character readback is only a generation-integrity check.
