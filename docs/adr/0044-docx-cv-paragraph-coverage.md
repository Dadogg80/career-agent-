# ADR 0044: DOCX paragraph boundaries and broader CV wording coverage

Status: Accepted, 2026-10-13

The owner reported that tailoring changes only one profile paragraph and omits skills and employment contributions. Inspection found a structural mismatch: DOCX extraction joins Word paragraphs with one newline, while tailoring uses blank-line boundaries. Several headings and paragraphs can therefore form one unclassified replacement unit, with a 4,000-character fallback split rather than actual CV structure. The extraction currently reads table cells in document XML order; this change preserves that order, not visual grid reconstruction.

Preserve Word paragraph boundaries as blank lines, including paragraphs in table cells/text boxes, while preserving in-paragraph line breaks and tabs. Existing original bytes, extracted text and saved wording indexes are not rewritten. Uploads and explicitly requested rereading use the new reader. Rereading can change exact-source freshness; prior decisions and immutable drafts remain readable. Show actionable guidance when a source passage contains embedded recognized CV headings. PDF and plaintext segmentation are unchanged.

Raise the bounded proposal/review limit from 12 to 40 consistently in the provider instructions, backend parser/API and frontend validators/proxy. Encourage separate supported improvements across all profile paragraphs, competency groups and introductory prose/bullets for each work entry. This remains one explicitly approved call; no quota/model/default changes or extra provider calls. Source/output size limits still apply. Forty is a defensive ceiling, never a target count or a completeness claim.

When proposal parsing omits items, invalidate complete section-review declarations conservatively while retaining valid proposals. Existing numeric/factual guards remain. Record the new prompt version only for new sessions; saved sessions are unchanged.

Whole-document semantic recall, finer per-entry section planning, independent file review and template fidelity remain subsequent work. This corrects a demonstrated DOCX structural defect; it does not claim to reproduce the owner's live model output or guarantee all useful changes.
