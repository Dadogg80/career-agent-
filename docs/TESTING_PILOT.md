# Test the local career pilot

Status: the pilot foundation is merged through selectable AI models and per-model cooldowns. The ADR 0028 document coverage continuation is a separate PR. Check the actual GitHub PR/branch state before synchronizing; a Git operation does not restart local services. Use the repository's actual installed branch/version and [RUNNING.md](RUNNING.md) for startup; Codex credentials/installations are not copied to your Mac.

## Prerequisites

JDK 21, Node.js 24 (nvm is supported), npm and Docker for PostgreSQL/local Keycloak and backend integration tests. Start the existing Compose services with the ignored backend `.env`; keep local passwords/API keys out of Git/chat. Private workspaces require `persistence,identity`; public advertisement analysis can run independently. Optional local Tesseract enables OCR for scanned PDFs. See [identity setup](IDENTITY_SETUP.md), [PostgreSQL](POSTGRES_SETUP.md), [document import](CV_IMPORT.md).

Start the backend from `apps/backend` after loading its ignored `.env` and building `./gradlew test bootJar`. Start the frontend from `apps/web` using `npm ci` and `npm run dev -- --hostname 127.0.0.1`. Use separate terminals; stop old servers before replacing the jar or rebuilding Next. Homebrew Java may need `JAVA_HOME` and its `bin` directory on PATH as described in RUNNING.md. The landing page is at the root; sign-in is at `/login`, overview at `/dashboard`, ad analysis at `/jobs/analyze`, profile at `/career/profile`, saved jobs at `/jobs/saved`, CVs at `/cv` and application tracking at `/applications`.

## Walkthrough

1. Open the public landing page, switch Norwegian/English, then sign in through the dedicated entry. Verify real profile/competency/job counts and actual working navigation. A configured anonymous private entry leads to sign-in before loading private data.
2. Create a profile. Upload a CV and a supporting certificate/project document as PDF, DOCX, UTF-8 TXT or Markdown. Read the extracted text and download the unchanged original. A scan may need explicitly requested local OCR. TXT/Markdown are evidence, not master-CV candidates.
3. Open the document/profile analysis. Review the selected full source text, remove unnecessary personal data, choose the provider/model and approve this run. The system divides the text automatically and saves progress. New runs can check potentially missed passages, with at most four additional calls disclosed before approval. Inspect profile summary, employer/project context, source-backed proposals and the source-usage panel; its counts do not establish exhaustive discovery. Stop/reopen and resume without repeating committed calls. Older saved runs do not gain follow-up calls.
4. With automatic profile population enabled, literal sourced competencies are saved as document-backed; history and generated wording remain editable drafts. Approve, edit, save as draft or reject remaining contributions. Processed items leave the pending queue and its count updates. The profile shows one skill card across contributions without merging sources or review status. Review prefilled employment/projects/education and confirm separately. Reanalysis preserves established edits, rejections and deletions.
5. Analyze a public link or paste a fictional ad. Review employer/role/person/offers, practical details, requirement filters and source quotes. Open the full received text for extra details. On Groq failure, received text remains visible and explicit headings/fields can be sorted locally; unknown information is not invented. A FINN browser excerpt can still be partial/stale. DEV diagnostics show sanitized stages, never private CV/profile contents or credentials.
6. Save the job and reopen it without an AI call. Personal matching preselects relevant confirmed evidence; inspect or adjust the preview and approve the displayed provider/model. Check the explained weighted requirement-coverage percentage and answer clarification questions inline to save personal attestations. Missing documentation remains unknown, not automatically a skill gap.
7. Create a CV draft from chosen confirmed competencies/history. Review name/contact/your own introduction and the full preview. Approve DOCX/PDF generation, download both, and inspect the files. Edit via a revised draft; approved versions remain unchanged. Changed source revisions block stale draft approval. Originals remain unchanged.
8. Create/reopen an application case for the saved job. Add contact, notes and follow-up. Choose its approved/general CV. Submit externally yourself; then explicitly record the actual CV/date/application text. Confirm the archive preview. Those materials lock while status/interview/notes remain editable. This records your statement of submission, not an external acknowledgement.
9. Sign out and verify private pages cannot reload your data. Reload/restart with the same database/storage to confirm persisted content. Delete only disposable test records: case first, then referenced CV/job if needed; source quotations and independent snapshots have separate deletion behavior.

## Practical limits

No arbitrary imported-layout editing, automatic CV rewriting, external messaging/submission, discovery scheduling, interviews/academy/analytics or adviser sharing yet. Semantic deduplication is conservative; different employers/projects remain separate, and paraphrases may need manual review. Groq quotas/availability and source access cannot be guaranteed by a delay. Genuine authentication, storage and revision failures remain actionable; useful source information is retained whenever available. Online deployment still needs production identity, privacy/provider decisions, account export/deletion and backup/retention work.

Automated results are recorded in [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md). Mocked provider replies validate control flow and evidence rules; they do not establish live AI completeness or output quality. Renderer tests plus a real local identity/PostgreSQL/export smoke establish more than button-only tests, but do not establish rendering fidelity in every DOCX reader.

## Read-only evidence diagnostics

After uploading or reopening documents, choose **Check documents**. Verify original/text pass only when the actual checks succeed; an unanalyzed file stays unanalyzed, OCR needs visual review, and partial input stays partial. Open a source from the report and compare it with the unchanged original. Rerun checking with no AI quota consumption. A quoted technology still needs contextual review; the report never certifies exhaustive extraction. Keep actual CVs/provider responses out of Git and test artifacts intended for sharing.

## Whole-document review on the current feature branch

Follow [FULL_DOCUMENT_REVIEW.md](FULL_DOCUMENT_REVIEW.md). Start from Documents and AI profile, review one or all sources, approve once, and expect genuine waits between calls. Review/edit skill contributions and history fields before explicit confirmation. Stop/reopen a run, verify drafts remain and continuation needs approval. Check unsupported/read-only sources, source evidence, Norwegian/English and mobile navigation. Test data/AI controls are covered synthetically; real Groq extraction quality remains a separate quota-dependent check.

## Optional local original-document inventory audit

Keep originals and the independent expected-evidence JSON manifest outside Git. Each manifest array item contains `path` (absolute local original path), `expectedTerms` (independently checked literal phrases), `expectedListedSkills` (actual named list labels) and `minimumPassages` (conservative expected minimum). Run from `apps/backend` with JDK 21:

```bash
LOCAL_DOCUMENT_AUDIT_MANIFEST=/tmp/private-document-audit.json ./gradlew test --tests '*PrivateDocumentInventoryAuditTest'
```

This checks actual local reading, exact passage offsets and list recovery without provider calls. It is not a semantic AI recall benchmark. Keep any assertion output that includes expected private phrases outside shared artifacts.
