# ADR 0023 — Source-selected document competencies

Status: accepted for the local pilot, unpublished.

## Context

A real owner-provided, seven-page PDF was fully readable locally, but an HTTP-200 model response invented adjacent technologies and attached some skills to unrelated projects. Existence of a quotation alone does not establish that the generated statement or company association follows from it. Requiring the model to reproduce exact quotes also discarded useful candidates when it changed their wording.

## Decision

Separate extraction from future writing. For document knowledge, send only the reviewed, consented text, represented as numbered literal passages. The model selects passage IDs and literal skill labels; application code supplies statements, summaries and quotations from the source. A call returns at most twenty proposals and three summaries. Validate labels inside their own quote, original/approved-input membership, same-document context proof and nearby project boundaries. Unclear context remains unknown. Source wording keeps its original language, while controls and unknown labels follow Norwegian/English UI settings.

Reopening previous analyses applies the same source-only presentation rules without a new provider call. It does not rewrite saved claims, revision histories or approved CV artifacts. Suggestions remain UNVERIFIED until explicitly saved and separately reviewed. This is source selection, not permission to auto-confirm any experience.

Add a read-only owned document check: original byte size/SHA-256, fresh local extraction versus stored text, and quote existence in stored individual/combined analyses. It sends nothing to the provider and modifies nothing. OCR, unavailable readers, missing originals, partial analysis and absent evidence have distinct visible states. Green indicators establish only their stated technical condition; they do not certify semantics or exhaustive discovery.

Detailed analysis can select smaller 4,000-character windows for sources longer than 4,000 characters. Each call still requires preview and approval. No automatic sequence/retry or paid upgrade is introduced. Provider passage metadata adds input overhead; bound it to 512 passages and reject excessive fragmentation before sending. The existing total reviewed-text cap remains 12,000 characters.

## Consequences and limits

Literal statements may be less polished and may consist of a listed skill or a fragment. Users can inspect/edit their own contribution before saving. AI writing belongs in a separate explicit review workflow. A nearby header is conservative layout evidence, not proof of legal employer/client identity or personal delivery; user review remains necessary. Up to twenty proposals is a bounded view, not all competencies across a long career. Exact deduplication remains conservative, and different wording may need manual consolidation.

Real personal fixtures and provider responses stay outside Git and documentation. Automated fixtures are fictional. Document processing remains local and bounded; external provider/privacy compliance and production retention remain separate decisions.

A mistaken model header ID can be recovered locally only when its literal context label occurs in the closest recognized preceding source section, within the bounded neighborhood, and that exact heading was included in the approved preview. An intervening project/skills/education heading or a redacted heading prevents recovery. A company name elsewhere in the document is insufficient.
