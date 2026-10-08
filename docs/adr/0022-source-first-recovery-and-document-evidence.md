# ADR 0022: Source-first recovery and conservative document evidence

Status: Accepted for the local pilot; unpublished implementation.

Advertisement source text must remain useful when AI output is unavailable. Display full received paragraphs/explicit sections and an accessible full-text reader. On failure, locally recognize explicit headings and labelled practical fields. Label this as local organization, not an AI assessment. Keep valid prior analysis only for the same source and disable saving stale results. Never fabricate missing contact details or requirement categories. Browser excerpts remain partial/stale sources.

For candidate documents, support bounded UTF-8 TXT/Markdown alongside DOCX/PDF, expand source-window controls without automatic calls, and consolidate identical skill/statement/context proposals while retaining supporting quotations. Claim creation reopens exact duplicates under the owner lock, keeps review state unchanged and stores additional evidence separately. Different employer/project contexts remain separate; unknown contexts do not merge across different documents. Evidence snapshots retain attachment context after source deletion.

Consequences: useful recovery without extra Groq calls, understandable partial coverage, and less duplicate competency noise. Deterministic heading recognition and literal quote checks cannot establish complete source coverage or semantic truth. Fuzzy deduplication, normalized employer graphs, additional formats and exhaustive discovery remain future work.
