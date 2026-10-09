# ADR 0031 — Job-specific CV wording preparation

Status: accepted local-pilot slice, 2026-10-09.

## Decision

Add `/jobs/{jobId}/apply` and owned POST `/api/profile/me/jobs/{jobId}/tailoring`. Use TanStack Query and existing shadcn components. Require explicit CSRF-protected, task/recipient/model-bound approval, an owned readable base document and a current automatic full-confirmed-profile match. The backend derives all evidence from owned snapshots and compares exact current document text both before and after generation. Recheck match identity/staleness after generation.

Introduce `CV_TAILORING`, with independently configured provider/model, Gemini Flash Lite default and explicit alternatives. Make one bounded AI call, never automatic retry/fallback; serialize calls with a process-local permit and five-attempt budget. Receive the full supported 60,000-character base CV, saved ad and all supported confirmed claims. Split long paragraphs into literal numbered passages without sampling, respecting 500 passages. Refer to existing confirmed IDs and criterion indexes. Derive old text server-side, omit individually invalid/duplicate proposals, accept at most 12 and reject invalid roots.

The page presents readiness, source preview, an optional short guide and editable old/new proposals. Keep original proof with each result even after upstream changes. Processed wording leaves the pending queue; source/evidence/match changes disable current approval. Results and review decisions exist only in page memory, with explicit navigation/reload disclosure. No file/version, profile write, application submission or APPLICATION_READY state is created.

## Rationale and limitations

This connects the existing foundations without claiming a full visibility taxonomy or building another persisted workflow prematurely. Literal source/index validation proves reference integrity, not semantic truth of the new prose. Users must inspect factual wording; approval does not turn wording into confirmed knowledge. The current matching snapshot still contains at most 12 extracted criteria and supported confirmed claims, not every raw career/document fact. Richer cross-profession recall, formal barriers/transferability, durable review and export need separate tested increments.

No paid service, silent recipient change, new database migration, remote native file processing or arbitrary-layout reconstruction is introduced. Anonymous/foreign-owner/CSRF failures must happen before a provider call. Tests distinguish browser fixture behavior, real PostgreSQL ownership/storage and live provider quality.
