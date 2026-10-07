# PR handoff: advertisement overview and AI-assisted document competencies

Base: `main`

Head: `feat/competency-claims`

Title: **Keep advertisements visible and add AI-assisted document competencies**

## Description

When source retrieval succeeds but AI structuring fails, display the received advertisement text, title and source link instead of an empty result. Manual retry reuses the source; unsupported AI output still cannot become supported facts. Reorganize results into employer source text, collapsible role/applicant/offers, practical metadata and compact requirement cards with safe diagnostic reasons.

Add owned competency statements with explicit review, revision conflicts, history and edit-to-unverified behavior. Add local DOCX/PDF upload, unchanged original downloads, master selection, text inspection and source-linked claims.

Add optional Groq competency summaries from individual documents or the combined readable CVs, attestations and certificates. Users review editable excerpts and explicitly approve each provider submission. One bounded structured call produces privately stored summaries and suggestions with exact source quotes and document attribution. Selected suggestions populate editable claim drafts; explicit saving creates UNVERIFIED statements, never automatic confirmation. Failed reanalysis retains prior summaries; source upload/deletion invalidates combined results.

Keep public advertisement routes and diagnostics separate from private sources. Reuse the existing provider abstraction/key, TanStack Query and shadcn/ui with Norwegian default and English support. No new runtime service, frontend dependency, paid fallback, browser tool or automatic AI retry. Update architecture/domain/security, flows/stories, roadmap, setup guides and ADRs 0014–0016.

## Validation

- 76 backend tests passed with no failures, errors or skips, including real PostgreSQL/Testcontainers ownership, CSRF, revisions, parsing, persisted analyses, collection source attribution and invalidation.
- Production frontend build and TypeScript checks passed.
- 42 production browser tests and 8 development-server tests passed; browser AI success responses are mocked.
- Actual synthetic Keycloak/browser/Next/Spring/PostgreSQL/local-files checks verified original retention, reviewed claims and persistence after restart in the earlier part of this branch.
- An actual combined Groq call through authenticated Next/Spring using two synthetic uploaded documents returned HTTP 200, two summary points and four source-backed competency suggestions with zero omitted items. Reopening the stored analysis made no model call; synthetic documents/results were cleaned up. This single smoke check is not a comprehensive model-quality guarantee.
- One earlier live structured analysis of the reported retrieved public FINN source succeeded. Synthetic mobile screenshots reviewed; private sources and provider payloads remain outside Git. GitHub Actions execution is not independently verified.

## Limits and testing after merge

A combined summary uses at most 20 selected documents and 12,000 submitted text characters in one call, up to three summary points and ten suggestions. Long files use editable excerpts and visibly partial coverage; unreadable scans are excluded. Quote membership establishes provenance, not semantic entailment. Confirmation remains human review. No OCR, exhaustive automatic chunking, adjacent-skill inference, personal matching or tailored CV generation.

Private reviewed excerpts intentionally reach Groq under the existing account's terms/settings. This single local opt-in does not establish GDPR compliance, zero retention or external deployment readiness. Production provider/privacy controls, backup/export/deletion and storage crash reconciliation remain outstanding.

Stop both servers before updating and rebuilding. Follow [RUNNING.md](RUNNING.md#update-and-restart-after-merging-this-branch) and [CV_IMPORT.md](CV_IMPORT.md). Retain existing passwords/keys, volumes and originals. Flyway applies V2–V4 automatically. Under Min profil upload documents, choose Oppsummer alle dokumentene med AI, review/approve excerpts, inspect source quotes and explicitly save/review a suggestion.
