# Local CV import and competency review

Implemented local pilot scope: authenticated PDF/DOCX/UTF-8 TXT/Markdown upload, original retention/download, text inspection, declared Norwegian/English document language, master-CV selection and user-created source-linked unverified claims, plus optional AI summaries/proposals for single or multiple documents. Use [IDENTITY_SETUP.md](IDENTITY_SETUP.md) first. Public advertisement analysis remains usable without these services.

## Use the feature

1. Sign in and save the basic profile under **Min profil**.
2. Upload a PDF, DOCX, UTF-8 TXT or Markdown file under **CV og dokumenter** and choose its document language. The language is user-selected, not automatically detected.
3. Choose **Bruk som master-CV** if this is your preferred original/template source. This stores a selection; it never edits the file or promises layout-preserving generation.
4. Open **Se tekst og legg til kompetanse**, expand **Originaltekst og manuell registrering**, inspect the extracted text against the original, select an excerpt up to 1,000 characters and press **Bruk valgt tekst**. Alternatively paste an exact excerpt into the source-quote field.
5. Give the competency a label, describe your own contribution and enter its project/employment context. Saving creates an **UNVERIFIED** claim with the document reference and exact source quote, or attaches evidence to an identical existing claim without changing its reviewed status (layout whitespace differences are mapped back to the original substring).
6. In the competency panel, inspect and explicitly confirm, reject or edit the statement. Confirmation applies to that revision. Editing resets the statement to UNVERIFIED and preserves previous content/status/source in history.

Upload and extraction remain local. Optional AI analysis now sends only reviewed text excerpts to Groq after a separate per-run approval (ADR 0016). No claims are saved or confirmed automatically. Owned approved matching and reviewed standard PDF/DOCX export are implemented locally. Automatic CV rewriting and arbitrary imported-layout adaptation remain future work. See [DOCUMENT_KNOWLEDGE.md](DOCUMENT_KNOWLEDGE.md) and [CV_EXPORT.md](CV_EXPORT.md). This single local pilot does not establish production provider/privacy compliance.

## Storage and limits

PostgreSQL holds owner-scoped metadata, SHA-256, declared language, master selection and extracted text. The DocumentStorage port has a local filesystem adapter for this free pilot. `DOCUMENT_STORAGE_PATH` defaults to `local-data/documents` relative to the backend working directory, ignored by Git. Originals use server-generated UUID object names; user filenames are metadata, not paths. On POSIX filesystems the directory is 0700 and originals are 0600. Keep starting the backend from `apps/backend`, or configure an absolute storage path consistently.

Upload limits: 5 MiB/file, 20 documents/profile, 100 PDF pages, 60,000 extracted characters. DOCX ZIP processing bounds entries/expanded bytes and disables external entities/DTDs; no archive file is extracted to disk or embedded content executed. PDFBox 3.0.8 extracts text with visual-position sorting. Password-protected PDFs fail with a mapped code; a scanned PDF is retained with a visible empty-text state and an optional local OCR action. DOCX extraction includes the main body, Word tables/text boxes, headers and footers. Image-only text, complex columns and unusual Word drawing formats can still be missing or reordered. Always retain/check the original.

Original downloads require ownership and use no-store, attachment and nosniff headers. The local adapter supports compensation on ordinary upload/delete failures; filesystem and database operations are not a distributed transaction. A process crash can leave an orphan or a metadata/file mismatch. Reconciliation, backups, storage quotas across users, antivirus/sandboxed processing and a production object-store adapter remain necessary before an external document pilot. Do not expose this local environment publicly.

## Deletion and history

Deleting a document removes its current original bytes, extracted text and metadata. The confirmation dialog explicitly explains that created claims and revision source quotes remain. Their document references become null; source notes/quotes remain inspectable. Delete the relevant claims separately to remove their entire revision history. This is not account deletion or deletion from backups.

Manual claims are limited to 100/profile. The API returns the latest 20 revisions with a total count; all revisions remain stored until the claim is explicitly deleted. History is append-only through ordinary edit/review operations, except source-reference detachment on document deletion and explicit permanent deletion. A user confirmation is self-attestation, not external certification.

## Verify after merge

Upload a small original DOCX/PDF, reload, download and compare the original, select a master, create a quoted unverified claim, confirm it, then edit and check that confirmation resets. Restart the backend, sign in again and reopen the stored document and claim. Do not delete Docker volumes or the storage directory during restart. No new API key or paid infrastructure is required.

## AI summaries across CVs and competency documents

1. Upload CVs, employment attestations, certificates or other competency evidence as PDF/DOCX/UTF-8 TXT/Markdown.
2. Choose **Oppsummer alle dokumentene med AI** for a combined overview. Alternatively open a document for its individual AI analysis.
3. Review the editable text previews, remove unnecessary names/contact/private information, and select relevant passages. Original files remain unchanged. Initial previews redistribute unused capacity from short documents and select passages from the start, middle and end of longer documents within a total 12,000-character budget; long collections are excerpts, not an exhaustive full reading. Files without readable text are explicitly excluded until local OCR succeeds. Emptying an excerpt excludes that document.
4. Approve sending the reviewed text and select **Oppsummer kompetansen med AI**. One structured Groq call selects numbered evidence passages for up to three source-backed summary points and twenty competency suggestions. Application code uses source wording rather than AI paraphrases; technology labels must occur in their quotations. Context needs nearby same-document header proof, shown separately; otherwise it is unknown. Individually invalid or excess items are omitted and counted while valid evidence remains visible; an empty context is explicitly labeled unknown. Invalid root JSON/schema and wholly unsupported results still fail without replacing the prior analysis. It uses the existing server-only GROQ_API_KEY and no browser search or other profile data.
5. Inspect each suggestion, source filename and exact source quote (layout whitespace differences are mapped back to the original substring). **Se gjennom dette forslaget** opens editable claim fields for the correct source document. Saving creates UNVERIFIED competence with an AI-assisted source note, or adds validated sources to an identical existing competency without changing its status; confirm only through the separate review action. Course/certificate evidence must not be treated as production experience.
6. The latest validated analysis is stored privately and can be reopened without another model call. Reanalysis replaces only this latest suggestion snapshot. Quota/invalid-result failures preserve previews and any previous summary; manual retry only. Uploading/deleting a document clears the combined summary so it can be regenerated against the changed collection.

The local process budget defaults to ten document-analysis attempts across both modes (DOCUMENT_AI_MAX_REQUESTS); provider cooldown/quota still applies. No new service, subscription or key is required. Local deletion removes stored analysis but cannot guarantee provider-side deletion. No adjacent-skill inference or automatic background discovery is included.

## Competency workspace and document recovery (ADR 0017)

Profile settings collapse after initial setup. The main workspace shows distinct active skill labels, confirmed statement counts, review counts, status filters and search over skill/contribution/context/source. These are recorded-data counts, not model confidence or skill levels. Individual statements retain provenance and revision controls; labels are not a normalized skill taxonomy. Documents show extracted character counts and TEXT/OCR provenance. A right-side shadcn Sheet separates reviewed input from AI results on desktop and stacks them on mobile. AI suggestions have their own search, source evidence and individual review action.

Use **Les originalen på nytt** to apply the improved reader to an already uploaded file without replacing its original. **Les skannet PDF med OCR** runs Tesseract locally only when explicitly chosen, and only on PDF pages without a text layer. The regular upload does not automatically run OCR or AI. OCR can misread text; compare it with the original before approving the AI preview. A partially readable page with both text and images is not automatically fully OCRed.

On the Mac backend machine, install the optional free helper:

```sh
brew install tesseract
```

Default OCR language is `eng`. For Norwegian and English recognition, install language data and add the configuration to your own ignored `apps/backend/.env`, then restart Java:

```sh
brew install tesseract-lang
# apps/backend/.env (non-secret setting):
DOCUMENT_OCR_LANGUAGES=nor+eng
```

Check `command -v tesseract` and `tesseract --list-langs` in the terminal that starts Java. The helper must be available on the backend PATH, not merely installed on the browser machine. Linux/cloud uses the same binary/language requirement; no external OCR API is called. No new JVM/npm dependency is introduced.

OCR limits: 10 PDF pages, 120 DPI, at most 10 million rendered pixels/page, 8 seconds/Tesseract page, 60,000 extracted characters and the existing 5 MiB upload cap. Private temporary files live in a 0700 directory and are cleaned after success/failure; subprocess output is discarded and its environment excludes provider/auth secrets. Missing helper/language data, timeout and oversized scans have dedicated recoverable messages. Split larger scans or use a text-based copy. This is bounded local pilot processing, not a production isolation sandbox or a guarantee that every PDF can be read.

V5 records the extraction method; text length is derived from the owned stored source. If rereading changes text, the individual and combined analyses are invalidated. Existing claims/revisions/quotes remain unchanged; the original file is immutable. In-flight analyses recheck their exact source snapshot before saving and fail with a conflict if it changed. Unchanged rereading retains the existing analysis. An empty reread cannot erase previously readable/OCR text. Reanalysis still replaces the latest suggestion snapshot; it does not accumulate exhaustive discoveries across excerpts. Focus one document or choose another consecutive part for a new reviewed attempt when important information is missing. Save useful suggestions before replacing the latest analysis. Each part requires a separate preview and approval; no automatic sequence of model calls runs. See [DOCUMENT_KNOWLEDGE.md](DOCUMENT_KNOWLEDGE.md) for conservative deduplication and multi-source evidence.

## Check actual saved documents

Choose **Kontroller dokumentene / Check documents** next to the document actions. This locally rereads your owned originals, checks their saved byte-size/hash and validates quotes in already stored analyses. It makes no Groq call and changes nothing. Review OCR/partial/missing-analysis states and use **Open document** to compare text and original or select another reviewed analysis part. A green light never promises complete skill extraction or correct interpretation. No files already saved on the Mac are assumed to exist in Codex's separate database/storage.
