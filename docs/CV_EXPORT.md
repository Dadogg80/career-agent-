# Reviewed standard CV export

Status: implemented on the unpublished local pilot branch. This is reviewed selection of existing experience, not automatic AI rewriting or reproduction of an uploaded layout.

## User flow

Open **My CVs**, create a draft, enter your name/contact details and optional personal introduction, then choose CONFIRMED competencies and typed career history. Optionally link the version to a saved advertisement. Saving opens a complete content preview and source inspection. A separate approval generates both DOCX and PDF using `standard-v1`. A revised draft copies editable header fields and only source selections whose confirmed revisions still match; it never changes the previous version.

Original uploads are retained. Drafts do not generate files. Changed/rejected/deleted source statements make a draft stale and prevent approval. Approval rechecks source revisions under the owner's database lock after rendering. Approved snapshots and files are immutable, including after later profile edits. Downloads verify stored byte size and SHA-256; they never regenerate a different CV under the same version ID.

## Boundaries

- No AI call or transmission of private profile data during CV construction/export.
- Header and introduction are user-entered wording; exported experience must reference current owned CONFIRMED records.
- Up to 30 versions, 30 competency selections, 20 career entries, 20,000 content characters, 20 PDF pages and 5 MB per artifact.
- Standard DOCX uses JDK XML/ZIP; PDF uses the existing PDFBox dependency and licensed embedded DejaVu fonts. Unsupported PDF glyphs leave the draft available rather than silently replacing a name.
- Source notes/quotes stay in the private snapshot and are excluded from exported CV content.
- Preview content and exports share selected facts; font metrics, section heading wording and pagination can differ between browser, DOCX and PDF. Word/LibreOffice-specific fidelity is not established by XML and PDF extraction tests.

## Storage and deletion

Flyway V9 stores owned CV snapshots/artifact metadata and a file-cleanup journal. Files use the existing private local document-storage adapter. Version deletion queues artifact removal transactionally; failed file deletion remains visible and can be retried through a CSRF-protected POST. The GET cleanup endpoint only reports pending files. A version referenced by an application cannot be deleted until that application is removed. A saved job referenced by a CV is also protected.

Ordinary generation failures attempt to remove newly written files. A process crash or simultaneous database/storage outage can leave unreferenced private files; a production reconciliation/retention job remains future work. Local filesystem storage and authentication are for the local pilot, not public hosting.
