# Test the local career pilot

Status: the pilot foundation is merged through selectable AI models and per-model cooldowns. Source coverage and structured career context are merged through PR #23. The expected-fact quality continuation is a separate PR. Check the actual GitHub PR/branch state before synchronizing; a Git operation does not restart local services. Use the repository's actual installed branch/version and [RUNNING.md](RUNNING.md) for startup; Codex credentials/installations are not copied to your Mac.

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

This checks actual local reading, exact passage offsets and whole-source versus automatic-portion list recovery without provider calls. It is not a semantic AI recall benchmark. Keep any assertion output that includes expected private phrases outside shared artifacts.

## Offline recorded-result benchmark

`DocumentExtractionBenchmark` is a developer test utility. It compares independently reviewed expectations with a recorded `DocumentAnalysis` JSON object (the `analysis` object in a saved workflow response, without the enclosing run). It makes no network request or database write. A successful provider HTTP response is not a passing benchmark. Missing expected facts, wrong context/fields and unsupported literal evidence fail the optional audit. Unlisted supported facts are not penalized. Generated descriptions still require semantic/user review.

Store originals, recorded analysis and the checklist **outside the repository**. Select expectations by reading the source independently, before inspecting model output. The manifest shape is:

```json
{
  "documents": [{"id": "00000000-0000-4000-8000-000000000001", "path": "/private/synthetic.md"}],
  "analysisPath": "/private/recorded-analysis.json",
  "expected": [{
    "id": "skill-1", "kind": "COMPETENCY",
    "documentId": "00000000-0000-4000-8000-000000000001",
    "quote": "Technology: Kotlin, PostgreSQL",
    "fields": {"skill": "Kotlin", "context": "Example AS", "category": "TECHNOLOGY"},
    "contextQuote": "Project: Example AS"
  }]
}
```

Use the actual recorded document IDs. Every expected quote must occur exactly in the freshly extracted source; choose the smallest excerpt that identifies the expected fact. For repeated wording, include the associated exact `contextQuote`. `fields` selects the structured values to require; whitespace/case normalize without removing punctuation.

- `COMPETENCY`: required `skill`; optional `context`, `category`. Labels must occur literally in expected evidence. Different responsibility labels need separate expectations even when they share a paragraph.
- `HISTORY`: required `kind`, `title`, `organization`; optional `client`, `deliveryRole`, `periodText`, `startMonth`, `endMonth`, `ongoing`. Use an empty string for an unknown month and preserve year-only precision. Title and organization must occur in expected evidence.
- `PROFILE`: required `kind` and nonempty `proseTerms` array of independently expected phrases in the output language. Evidence use alone cannot satisfy a substantive summary. This phrase check does not judge all generated meaning.

Run from `apps/backend` with JDK 21:

```bash
LOCAL_DOCUMENT_BENCHMARK_MANIFEST=/private/benchmark.json ./gradlew test --tests '*PrivateDocumentSemanticAuditTest'
```

The printed report contains aggregate counts, not document names, quotations or paths. Keep all private inputs and detailed test artifacts local. Passing recall applies only to the selected expectations; `unsupportedEvidence` validates literal source/label support, not every generated statement. The normal synthetic regression suite also demonstrates a fully cited paragraph with missing skills, wrong employers, cross-document borrowing, punctuation-sensitive labels, invented month precision and vague profile prose.

The existing explicitly enabled `GEMINI_LIVE_TEST=true` check additionally measures the synthetic expected-fact checklist against its selected `GEMINI_MODEL`; default tests skip it. Do not set either private manifest to an owner file for that live check: the live fixture is always synthetic. Real-document provider comparison requires separately approved recipient/model-bound analysis in the app, then local recorded-result evaluation.

In the managed proxy-backed cloud only, Java HTTPS may need the already trusted system CA store: append `-Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts` to inherited `JAVA_TOOL_OPTIONS` when that file exists. Keep TLS verification enabled and inherited proxy credentials intact. This is an environment runtime setting; do not copy it to a Mac without that truststore. A provider HTTP 503 leaves the optional live check failed/unverified even when offline regression tests pass.

## Complete-profile matching regression

With fictional confirmed evidence above 30 contributions, open a saved job and approve the automatically assembled full profile. Verify no skill checkboxes, full saved advertisement in the expandable preview, every ID/revision in the owned request, progress/provider identity, and the same saved coverage percentage in the assessment and job card. Reloading the library must never start AI. Confirm another competency and verify the new automatic result is stale. Original files/source notes are excluded from the matching payload.

Backend integration tests use real PostgreSQL and a mocked model for large profiles and ownership/revision checks; browser fixtures test 35 contributions. A separately gated `GEMINI_MATCH_LIVE_TEST=true` `GeminiMatchLiveTest` sends one fictional 35-contribution fixture to Flash Lite; normal tests skip it and never send owner documents. The fixture verifies use of evidence after position 30 and an unresolved undocumented requirement. This is a bounded quality check, not exhaustive model certification.

## Career comparison regression

Use fictional entries with the same formal title/employer/client/delivery role and overlapping unequal explicit periods. Verify the possible-difference count, then open the comparison: only two owned evidence reads, no AI or write. Correct one endpoint via the existing editor; verify UNVERIFIED status, refreshed count and both records retained. Compare different roles/companies manually without automatic contradiction labels. Unknown dates, distinct clients/roles, rejected entries and disjoint rehires must not enter the candidate list. Check deleted-original wording, one-source failure, English labels and 390px dialog/page overflow.
