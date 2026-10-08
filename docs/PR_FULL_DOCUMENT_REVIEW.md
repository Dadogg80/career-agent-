# PR handoff: whole-document career review

Publication status: local commits on `feat/full-document-career-review`; not pushed, no PR created and not merged. Base: `main`. Publish only when authorized; verify current remote main first.

## Title

Add resumable document-based career review and task-specific Groq configuration

## Description

Uploaded career documents previously required manual portion selection, produced repetitive technology-list proposals, and left career-history fields for the user to populate. This change processes approved full previews in sequential persisted portions, drafts editable sourced competencies/profile summaries/history, and separates profile navigation into documents, competencies and career history. Explicit technologies become distinct proposals; conservative deduplication retains their sources and delivery contexts. Saving remains unverified unless the user explicitly confirms the reviewed facts.

V12 adds owner-scoped analysis progress and revision-linked career-entry document evidence. Authentication/CSRF, strict private proxies, source rechecks, revision replay, transactional imports and bounded serialized state protect the workflow. Quota failures preserve drafts and full waits; continuation is explicit. PDF extraction adjusts tracked text before word segmentation and orders detected columns without rewriting original files. Optional per-task Groq models, low reasoning effort, output caps and safe token/cache/rate-header logs support measured optimization; defaults stay unchanged.

Validation: the full backend suite passed 137 tests with real PostgreSQL/Testcontainers and no failures/errors/skips. Routing-focused checks passed 35 tests; the final workflow integration checks passed after omission-count refinement. Production Next.js build/TypeScript passed. All 77 production browser/API tests passed, followed by 20 affected UI tests and six final workflow/quota checks. Six supplied private PDF/DOCX files extracted locally and passed limited independent reference/keyword checks; no uploaded personal files or extracted private text are included in Git.

Limits: a live Groq quality comparison received 429, including a later check after the reported wait. This does not establish exhaustive extraction, model superiority or independent quotas. Final summary evidence and accumulated proposals are bounded; source coverage is not semantic completeness. PDF layout detection is heuristic. Run driving is client initiated, with persisted progress rather than background/Temporal execution. The full normalized skill/context/conflict graph, production privacy/hosting, automatic discovery and later roadmap features remain pending. No paid services or automatic model rotation are introduced.
