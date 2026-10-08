# Document knowledge and deduplication

The local pilot accepts PDF, DOCX, UTF-8 TXT and Markdown (`.md`). Extraction is local; uploads do not trigger AI calls. Preserve/download originals, inspect extracted text and optionally reread it. TXT/Markdown are competency evidence, not master-CV candidates. Scanned PDFs can use explicitly requested local Tesseract OCR; encrypted PDFs, legacy DOC/RTF, images and ODT are not currently supported.

The legacy single-document or combined analysis API needs reviewed excerpts and explicit consent for each Groq call. The prompt covers skills, responsibilities, employment, projects, courses and certificates. The model selects numbered literal passages rather than generating statements or source quotes. The backend uses their original wording and requires the skill label to occur in its own quote. Employer/client/project context requires nearby, same-document header evidence without an intervening recognized section boundary; otherwise it is unknown. This conservative layout check still requires user review. A course is learning evidence, not production experience. Unknown context remains unknown. Each suggestion must quote text in both the approved input and the original extracted source. Invalid items are omitted; previous successful output/source remains available when the provider fails.

## Broader source coverage

A call sends at most 12,000 characters and returns up to 20 suggestions/3 summary items. Distributed excerpts cover start/middle/end. For sources over 4,000 characters, contiguous **Part** controls offer smaller 4,000-character detail selections; later windows include a literal opening excerpt to retain employer context. Choosing a part clears consent and does not call AI. Each next analysis requires new approval and follows provider quota/cooldown limits. Selecting a single part in combined mode excludes the other documents from that request and shows their selected character counts accordingly.

A new successful analysis replaces the latest proposal view; save useful reviewed drafts before analyzing another part. Saved competencies survive subsequent analyses. Input coverage is not a guarantee of exhaustive skill discovery. There is no automatic paid/provider retry, silent unlimited scan or guarantee that AI discovers every competency.

## One experience, multiple sources

Identical proposals normalize case/layout whitespace in skill, statement and context, and group supporting document quotations. Different employer/project contexts stay separate. Unknown contexts do not merge across different documents. Saving an unchanged grouped proposal attaches its validated supporting sources transactionally.

Claim creation uses the same conservative equality rule under the owner's lock. An existing claim reopens with its previous review status/revision; attaching an identical source never confirms, rewrites or resets experience. Both primary and additional document evidence can be inspected. Evidence stores the statement/context as it existed when attached; later edited wording may need fresh review.

Flyway V11 backfills existing primary evidence. Evidence records retain original filenames, quotes and attachment context after document deletion, with a deleted-original marker. Claim deletion removes its evidence records. Saved job-match/CV snapshots may retain previously selected statements independently; their deletion remains separate. Each claim supports up to 100 evidence records; excess new sources are rejected explicitly rather than silently discarded. A future retention/export workflow must account for all records.

This is conservative deduplication, not semantic equivalence detection. Paraphrases, aliases and different contributions using the same technology are not silently merged. Typed career history separately records formal employer, client and delivery role; document AI currently expresses the association in claim context, not a fully normalized employer graph.

## Local document check

**Check documents** opens a bilingual shadcn Sheet with one report per owned document. It compares original byte size/SHA-256 and fresh local extraction with stored text, then checks quotations in existing individual and combined analyses. It neither calls AI nor modifies files, text, claims or analyses. Missing originals and absent quotations are failures; OCR, changed/unavailable reading, partial coverage and missing analyses require attention. Inspect the original/text and approve a new excerpt yourself when useful. The timestamp describes this check, not ongoing monitoring.

Green checks establish file integrity, reproducible reading or quote existence only. They do not prove that an interpretation/company association is correct or that all skills were discovered. Source-only revalidation also applies when reopening older AI results; saved claims and their histories remain unchanged. See ADR 0023.

A mistaken model header ID can be recovered locally only when its literal context label occurs in the closest recognized preceding source section, within the bounded neighborhood, and that exact heading was included in the approved preview. An intervening project/skills/education heading or a redacted heading prevents recovery. A company name elsewhere in the document is insufficient.

## Resumed whole-document workflow

The production UI now processes full approved previews automatically through owned persisted portions; the earlier source-selected legacy API remains compatible. AI may draft editable descriptions and candidate summaries, while literal skill labels, company/project proof and exact quotations are checked separately. Explicit review imports claims/history. See [FULL_DOCUMENT_REVIEW.md](FULL_DOCUMENT_REVIEW.md) and ADR 0024 for the current flow, limits and model-quality gate.
