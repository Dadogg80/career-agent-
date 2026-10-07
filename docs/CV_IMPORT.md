# Local CV import and competency review

Implemented local pilot scope: authenticated DOCX/PDF upload, original retention/download, text inspection, declared Norwegian/English document language, master-CV selection and user-created source-linked unverified claims. Use [IDENTITY_SETUP.md](IDENTITY_SETUP.md) first. Public advertisement analysis remains usable without these services.

## Use the feature

1. Sign in and save the basic profile under **Min profil**.
2. Upload a DOCX or PDF under **CV og dokumenter** and choose its document language. The language is user-selected, not automatically detected.
3. Choose **Bruk som master-CV** if this is your preferred original/template source. This stores a selection; it never edits the file or promises layout-preserving generation.
4. Open **Se tekst og legg til kompetanse**, inspect the extracted text against the original, select an excerpt up to 1,000 characters and press **Bruk valgt tekst**. Alternatively paste an exact excerpt into the source-quote field.
5. Give the competency a label, describe your own contribution and enter its project/employment context. Saving creates an **UNVERIFIED** claim with the document reference and exact quote.
6. In the competency panel, inspect and explicitly confirm, reject or edit the statement. Confirmation applies to that revision. Editing resets the statement to UNVERIFIED and preserves previous content/status/source in history.

This first import slice uses local text extraction and user selection. There is no automatic AI claim discovery, OCR, semantic matching, CV rewriting or PDF/DOCX generation. Private CV/competency material is not sent to Groq. An eventual private-AI feature needs a provider-data decision and explicit product controls; it must not silently inherit the public-ad flow.

## Storage and limits

PostgreSQL holds owner-scoped metadata, SHA-256, declared language, master selection and extracted text. The DocumentStorage port has a local filesystem adapter for this free pilot. `DOCUMENT_STORAGE_PATH` defaults to `local-data/documents` relative to the backend working directory, ignored by Git. Originals use server-generated UUID object names; user filenames are metadata, not paths. On POSIX filesystems the directory is 0700 and originals are 0600. Keep starting the backend from `apps/backend`, or configure an absolute storage path consistently.

Upload limits: 5 MiB/file, 20 documents/profile, 100 PDF pages, 60,000 extracted characters. DOCX ZIP processing bounds entries/expanded bytes and disables external entities/DTDs; no archive file is extracted to disk or embedded content executed. PDFBox 3.0.8 extracts text only. Password-protected PDFs fail with a mapped code; a scanned PDF can be retained with an honest empty-text/OCR-unavailable state. Extraction reads the DOCX main body; headers, drawings, text boxes and complex PDF reading order may be missing or reordered. Always retain/check the original.

Original downloads require ownership and use no-store, attachment and nosniff headers. The local adapter supports compensation on ordinary upload/delete failures; filesystem and database operations are not a distributed transaction. A process crash can leave an orphan or a metadata/file mismatch. Reconciliation, backups, storage quotas across users, antivirus/sandboxed processing and a production object-store adapter remain necessary before an external document pilot. Do not expose this local environment publicly.

## Deletion and history

Deleting a document removes its current original bytes, extracted text and metadata. The confirmation dialog explicitly explains that created claims and revision source quotes remain. Their document references become null; source notes/quotes remain inspectable. Delete the relevant claims separately to remove their entire revision history. This is not account deletion or deletion from backups.

Manual claims are limited to 100/profile. The API returns the latest 20 revisions with a total count; all revisions remain stored until the claim is explicitly deleted. History is append-only through ordinary edit/review operations, except source-reference detachment on document deletion and explicit permanent deletion. A user confirmation is self-attestation, not external certification.

## Verify after merge

Upload a small original DOCX/PDF, reload, download and compare the original, select a master, create a quoted unverified claim, confirm it, then edit and check that confirmation resets. Restart the backend, sign in again and reopen the stored document and claim. Do not delete Docker volumes or the storage directory during restart. No new API key or paid infrastructure is required.
