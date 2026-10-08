# Career Agent roadmap

Status checked against remote main on 2026-10-08; the owner authorized publishing and merging the tested local-pilot delivery. Deliver small tested increments; branch implementation is not a merged release.

## Current status

The owner resumed the document/profile slice after the knowledge-model review. On `feat/full-document-career-review`, complete-source sequential analysis, editable sourced competency/history/profile drafts, section-based profile navigation, PDF tracking/column handling and configurable task models are implemented and locally tested. Defaults remain GPT OSS 20B because the live quality comparison was blocked by Groq quota. This branch is not pushed or merged; the prior pause is superseded for this specific scope. The full normalized knowledge graph and later roadmap capabilities remain separate.

| Capability | Actual status |
| --- | --- |
| Next.js + Kotlin/Spring Boot, Norwegian default / English | Implemented and merged |
| TanStack Query and shadcn/ui foundation | Implemented, required by AGENTS.md |
| Public ad text analysis, NAV API and bounded FINN browser import | Implemented and merged; FINN excerpts may be partial/stale |
| Compact requirement filters/detail dialogs, pacing and DEV diagnostics Sheet | Implemented and merged |
| PostgreSQL/Flyway and local OIDC/PKCE basic profile | Implemented and merged, PR #12 |
| Wrapped FINN title repair / handled-error console warning | Implemented and merged, PR #13 |
| Two-column original-wording ad overview / visible ad on AI failure | Implemented and merged, PR #14 |
| Owned competency statements, explicit review and revision history | Implemented and merged, PR #14 |
| Local DOCX/PDF original upload, text inspection, master selection and source-selected claims | Implemented and merged, PR #14 |
| Opt-in single/combined document AI summaries and source-backed suggestions | Implemented and merged, PR #14 |
| Competency search/status dashboard, wider document review Sheet, improved source coverage and local rereading/OCR | Implemented and locally validated on feat/competency-workspace; ready for the authorized delivery merge |
| Reviewed typed career history, role/client distinction and revision review | Implemented on the local branch; real PostgreSQL and browser checks |
| Public landing, dedicated sign-in, workspace overview and responsive navigation | Implemented on the local branch; production/development browser regression checks completed |
| Whole-document sourced profile/competency/history review | Implemented and tested on the unpublished current branch; explicit per-run approval and factual confirmation |
| Task-specific model configuration and safe token/cache usage logging | Implemented locally; default model unchanged, live quality comparison pending |
| PDF character-spacing/column repair | Implemented and tested locally, including the six supplied private test documents |
| Adjacent-skill inference, full normalized employment/project graph | Not implemented |
| Owned saved job snapshots and searchable library | Implemented on current local branch; verified in the integrated local pilot |
| Approved personal requirement-to-claim matching | Implemented on current local branch; verified in the integrated local pilot |
| Reviewed CV selection, preview and immutable standard DOCX/PDF export | Implemented on the tested delivery branch; verified with real local identity/storage and automated checks |
| Manual application cases, exact approved CV references, history and follow-up dates | Implemented on the tested delivery branch; verified with real local identity/storage and automated checks |
| Local advertisement recovery, richer received text, UTF-8 TXT/Markdown and conservative multi-source deduplication | Implemented locally; verified with real local identity/storage and automated checks |
| Source-selected document competencies, context proof and local original/text/quote check | Implemented locally; current validation recorded in DEVELOPMENT_LOG.md; ready for delivery |
| Automatic CV rewriting, discovery, interview/academy/analytics and browser submission | Not implemented |

The previous delivery scope was the three deliveries already listed: ad overview, competency review and initial CV import. Saved jobs/matching were excluded from that earlier delivery; the latest instruction authorizes publishing and merging the tested local pilot workflow. The owner subsequently added AI competency summarization across uploaded documents before merge. Upload/extraction remain local; a separately approved Groq call creates stored source-backed suggestions, and an explicit user save creates UNVERIFIED claims. See docs/CV_IMPORT.md and the actual validation in docs/DEVELOPMENT_LOG.md.

## Current delivery completion criteria

1. Display employer source paragraphs left, collapsible role/applicant/offers right, then practical metadata and existing requirement cards. Contact has a stable honest unknown slot. Received advertisement text remains visible when AI structuring fails, with manual source-reusing retry and safe diagnostic reasons.
2. Sign in, save/reopen competencies, separately confirm/reject, reset confirmation on edit, inspect history and explicitly delete. Verify cross-identity isolation, CSRF and revision conflicts against PostgreSQL.
3. Upload bounded PDF/DOCX/UTF-8 TXT/Markdown evidence, retain/download original, declare language/select master, inspect local text, create an UNVERIFIED claim from an exact source excerpt and then review it. Confirm storage and source history across reload/restart. An optional owned single/combined AI analysis follows reviewed previews and per-run approval. Show partial coverage and exact document sources, persist suggestions, and never auto-confirm. Optional local OCR and rereading are added in the current workspace slice; layout-preserving generation is not implemented.

## Authorized local-pilot increments

The owner expanded the pilot with public entry, dedicated sign-in and a serious UX/UI redesign. Public entry, CV generation and application tracking are implemented and locally verified; publication/merge remain separate. Standard CV generation uses reviewed selections; automatic AI rewriting and the full normalized employment/project graph remain separate future increments. The owner authorized publication and merge on 2026-10-08; long-term product phases remain separate. See docs/UX_DESIGN.md.

1. Owned saved advertisement snapshots and reviewed typed employment/projects are implemented. A full normalized career graph remains future work.
2. Personal requirement-to-confirmed-claim matching, explicit uncertainty/clarification and explainable CV wording recommendations. Undocumented experience is unknown, not automatically a skill gap. The owner approved relevant CONFIRMED claims plus ad text with preview and approval per analysis; production provider/privacy policy remains separate.
3. Controlled CV version/artifact generation and a simple application CRM recording the exact materials used. Use the owner-approved standard template for first DOCX/PDF export, keep originals, bind approvals to versions and postpone arbitrary imported-layout adaptation.

Automatic job discovery/digests → interview/follow-up → browser application copilot → academy/analytics follow later. Introduce Kafka, Temporal, pgvector and Redis only when an implemented workload justifies them. No paid services or account upgrades are used.

## Completion discipline

Update stories/flows, decisions, security and the development log. Published branches remain pending until an actual authorized merge is verified. Local tests do not establish GitHub Actions execution or fresh-task cloud restoration. Production identity, provider/source terms, account export/deletion, retention, backup and object storage remain unresolved before external rollout.

## Current Gemini continuation — 2026-10-08

Implemented locally: explicit Groq/Gemini task routing, recipient/model-bound private approval, persisted run protection, Gemini cooldown and sanitized token logging. Stable 3.5 Flash passed synthetic extraction/profile checks; 3.8 Flash generation returned 503. The related document-quality slice adds explicit responsibility coverage and prevents final synthesis from erasing already sourced profile sections. Real-document Gemini quality remains pending recipient-approved testing. Next: measured document coverage/PDF reading → conservative competency reconciliation → profile/history UX. Native Gemini PDF/URL retrieval, full normalized catalog/conflict model and later discovery/interview/browser/academy features remain separate.
