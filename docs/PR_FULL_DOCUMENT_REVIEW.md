# PR handoff: Gemini and whole-document career review

Publication is authorized on 2026-10-08. Base: `main`. Head: `feat/full-document-career-review`. Final remote state belongs to the development log.

## Title

Add Gemini and resumable document-based career review

## Description

Uploaded career documents previously required manual portion selection, produced repetitive technology-list proposals, and left career-history fields for the user to populate. This delivery processes approved full previews in sequential persisted portions and drafts editable sourced competencies, profile summaries and career history. Individual technologies and explicit responsibilities become distinct proposals; conservative deduplication retains sources and delivery contexts. Profile sections make document upload easier to reach. Saving remains unverified unless the user explicitly confirms the reviewed facts.

Gemini joins Groq behind explicit task routing. Private previews name their recipient/model and bind consent to a persisted configuration fingerprint, preventing old Groq approval from silently moving documents to Google. The Gemini-specific default is tested 3.5 Flash; unset provider configuration preserves Groq. FINN retrieval remains Groq/Exa. No automatic provider/model rotation, new SDK dependency or billing changes are introduced.

V12 adds owner-scoped progress and revision-linked career-entry evidence. Authentication/CSRF, strict private proxies, source rechecks, revision replay, transactional imports and bounded state protect the workflow. Provider failures preserve drafts and full cooldowns. Partial advertisement output retains supported items rather than rejecting the entire response. PDF extraction repairs tracked text before word segmentation and orders detected columns without rewriting originals. Final profile synthesis includes career-history evidence and preserves sourced sections omitted by a shorter model response.

Validation: 146 backend tests passed with real PostgreSQL/Testcontainers, zero failures/errors; one opt-in live test is skipped in the normal suite and passed separately against Gemini 3.5 Flash using only a fictional CV. Production Next.js build and TypeScript passed. All 79 production browser/API tests and eight development-server tests passed. Six supplied private PDF/DOCX files were independently extracted locally in the preceding slice; no private files or extracted personal text enter Git. GitHub Actions results are reported separately after publication.

Limits: live private-document Gemini quality still requires recipient-specific reviewed approval. Groq comparison was blocked by quota. The synthetic Gemini test does not establish model superiority or exhaustive competence extraction. Summary evidence and accumulated proposals are bounded; PDF layout detection is heuristic. Run driving is client-initiated with persisted progress rather than background/Temporal execution. Native Gemini PDF/URL retrieval, the full normalized skill/context/conflict graph, production privacy/hosting, automatic discovery and later roadmap features remain pending.
