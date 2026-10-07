# PR handoff: advertisement overview, competencies and CV sources

Base: `main`

Head: `feat/competency-claims`

Title: **Keep job advertisements visible and add reviewed CV competencies**

## Description

When source retrieval succeeds but AI structuring fails, the previous UI left the result area empty. This change displays the received advertisement text, title and source link with an honest analysis-failure notice. A manual retry reuses the source instead of repeating browser search; invalid AI output still cannot become supported facts.

Reorganize successful results into original-wording employer paragraphs on the left, collapsible role/applicant/offers on the right, practical location/contact/deadline metadata below, then the existing compact requirement cards. Add applicant/offer schema categories and safe diagnostic reasons for application validation failures even when Groq returned HTTP 200. Contact details use source evidence; unidentified details remain visibly unknown.

Add owned competency statements with explicit confirmation/rejection, revision conflicts, edit-to-unverified behavior, history and deletion. Add authenticated local DOCX/PDF upload, original downloads, document language/master selection, extracted-text inspection and exact-source creation of UNVERIFIED claims. Reuse TanStack Query and shadcn/ui with Norwegian default and English support.

Keep private CV/competency content out of public Groq endpoints and diagnostics. Apply issuer+subject ownership, CSRF, no-store responses, bounded parsing and PostgreSQL integrity constraints. Document storage is a local adapter for the free pilot. Document deletion retains existing claim quotes/history, as explained by the confirmation dialog.

Update roadmap, architecture/domain/security, user flows/stories, ADRs 0014/0015 and local setup/test instructions. Saved jobs, personal matching and automatic private-AI discovery remain separate future deliveries.

## Validation

- 69 backend tests passed, zero failures/errors/skips, including real PostgreSQL/Testcontainers migrations, ownership, CSRF, revision concurrency and document parsing/source integrity.
- Production frontend build and TypeScript checks passed.
- 38 production browser tests and 8 development-server tests passed. Browser AI success responses are mocked; responsive layout, failure fallback, source reuse and private proxy boundaries are exercised.
- Actual synthetic Keycloak/browser/Next/Spring/PostgreSQL/local-files smoke test verified original upload/download, master selection, source-linked unverified-to-confirmed claims, history, reopening after backend restart and cleanup. Private Groq processing was disabled.
- One live structured analysis of the previously retrieved reported public FINN source returned 10 requirements, 10 facts and zero omissions. This is not a separate fresh full URL-pipeline validation or a guarantee against future provider failures.
- Synthetic desktop/mobile screenshots reviewed. No private documents, credentials or raw provider payloads committed. GitHub Actions execution is not independently verified.

## Pilot limitations and testing after merge

CV import is local and user-assisted: no automatic AI claim discovery, OCR, matching, tailored document generation or arbitrary DOCX layout preservation. Filesystem/database operations compensate for ordinary errors but are not crash-atomic; reconciliation, backups and production privacy/storage controls remain outstanding before external rollout.

Stop both servers before updating and rebuilding the backend. Follow [RUNNING.md](RUNNING.md#update-and-restart-after-merging-this-branch) and [CV_IMPORT.md](CV_IMPORT.md). Existing passwords/provider keys and volumes should be retained. Flyway applies V2/V3 automatically. Test a URL analysis, then sign in under Min profil to upload a small CV, inspect its text, create and confirm a sourced competency, reload and reopen it.
