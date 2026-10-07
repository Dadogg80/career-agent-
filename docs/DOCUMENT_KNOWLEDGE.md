# Document knowledge and deduplication

The local pilot accepts PDF, DOCX, UTF-8 TXT and Markdown (`.md`). Extraction is local; uploads do not trigger AI calls. Preserve/download originals, inspect extracted text and optionally reread it. TXT/Markdown are competency evidence, not master-CV candidates. Scanned PDFs can use explicitly requested local Tesseract OCR; encrypted PDFs, legacy DOC/RTF, images and ODT are not currently supported.

Single-document or combined analysis needs reviewed excerpts and explicit consent for each Groq call. The prompt covers skills, responsibilities, employment, projects, courses and certificates, preserving employer/client/project context where stated. A course is learning evidence, not production experience. Unknown context remains unknown. Each suggestion must quote text in both the approved input and the original extracted source. Invalid items are omitted; previous successful output/source remains available when the provider fails.

## Broader source coverage

A call sends at most 12,000 characters and returns up to 20 suggestions/3 summary items. Distributed excerpts cover start/middle/end. Contiguous **Part** controls let the user inspect all parts of a long document; later windows include a literal opening excerpt to retain employer context. Choosing a part clears consent and does not call AI. Each next analysis requires new approval and follows provider quota/cooldown limits. Selecting a single part in combined mode excludes the other documents from that request and shows their selected character counts accordingly.

A new successful analysis replaces the latest proposal view; save useful reviewed drafts before analyzing another part. Saved competencies survive subsequent analyses. Input coverage is not a guarantee of exhaustive skill discovery. There is no automatic paid/provider retry, silent unlimited scan or guarantee that AI discovers every competency.

## One experience, multiple sources

Identical proposals normalize case/layout whitespace in skill, statement and context, and group supporting document quotations. Different employer/project contexts stay separate. Unknown contexts do not merge across different documents. Saving an unchanged grouped proposal attaches its validated supporting sources transactionally.

Claim creation uses the same conservative equality rule under the owner's lock. An existing claim reopens with its previous review status/revision; attaching an identical source never confirms, rewrites or resets experience. Both primary and additional document evidence can be inspected. Evidence stores the statement/context as it existed when attached; later edited wording may need fresh review.

Flyway V11 backfills existing primary evidence. Evidence records retain original filenames, quotes and attachment context after document deletion, with a deleted-original marker. Claim deletion removes its evidence records. Saved job-match/CV snapshots may retain previously selected statements independently; their deletion remains separate. Each claim supports up to 100 evidence records; excess new sources are rejected explicitly rather than silently discarded. A future retention/export workflow must account for all records.

This is conservative deduplication, not semantic equivalence detection. Paraphrases, aliases and different contributions using the same technology are not silently merged. Typed career history separately records formal employer, client and delivery role; document AI currently expresses the association in claim context, not a fully normalized employer graph.
