# Career Agent roadmap

Status checked against remote main on 2026-10-08; the owner authorized publishing and merging the tested local-pilot delivery. Deliver small tested increments; branch implementation is not a merged release.

## Current status

Remote main `ccae0ed` includes documentary profile imports, grouped skill cards, persistent review, candidate presentation, automatic matching evidence, explained percentages and inline clarification. PR #20 added Gemini Lite document/profile defaults; explicit Flash/Lite model choices and isolated cooldowns remain available across supported tasks. PR #21 merged literal source inventories, missed-list recovery and bounded follow-up with compact coverage UX; push/PR/main Foundation checks passed. Current `fix/document-context-and-periods` corrects nested literal context and local-format month endpoints. The generalized relationship/conflict model and semantic completeness measurement remain pending.

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
| Competency search/status dashboard, wider document review Sheet, improved source coverage and local rereading/OCR | Merged in the tested local pilot |
| Reviewed typed career history, role/client distinction and revision review | Merged in the tested local pilot; real PostgreSQL and browser checks |
| Public landing, dedicated sign-in, workspace overview and responsive navigation | Merged in the tested local pilot; production/development browser checks |
| Whole-document sourced profile/competency/history review | Merged in PR #16; explicit per-run approval and factual confirmation |
| Task-specific model configuration and safe token/cache usage logging | Merged in PR #16; default unchanged, synthetic Gemini validation passed |
| PDF character-spacing/column repair | Merged in PR #17; locally checked against seven unique private documents |
| Documentary profile imports, history drafts and persistent review queue | Merged in PR #18 (ADR 0027) |
| Candidate presentation, automatic matching evidence, percentages and inline clarification | Merged in PR #18; newest-analysis synthesis, deterministic coverage |
| Adjacent-skill inference, full normalized employment/project graph | Not implemented |
| Owned saved job snapshots and searchable library | Merged in the tested local pilot |
| Approved personal requirement-to-claim matching | Merged in the tested local pilot |
| Reviewed CV selection, preview and immutable standard DOCX/PDF export | Merged in the tested local pilot; real identity/storage and automated checks |
| Manual application cases, exact approved CV references, history and follow-up dates | Merged in the tested local pilot; real identity/storage and automated checks |
| Local advertisement recovery, richer received text, UTF-8 TXT/Markdown and conservative multi-source deduplication | Merged in the tested local pilot; real identity/storage and automated checks |
| Source-selected document competencies, context proof and local original/text/quote check | Merged initial evidence checks; current recovery/refinements tracked separately |
| Automatic CV rewriting, discovery, interview/academy/analytics and browser submission | Not implemented |

The previous delivery scope was the three deliveries already listed: ad overview, competency review and initial CV import. Saved jobs/matching were excluded from that earlier delivery; the latest instruction authorizes publishing and merging the tested local pilot workflow. The owner subsequently added AI competency summarization across uploaded documents before merge. Upload/extraction remain local; a separately approved Groq call creates stored source-backed suggestions, and an explicit user save creates UNVERIFIED claims. See docs/CV_IMPORT.md and the actual validation in docs/DEVELOPMENT_LOG.md.

## Current delivery completion criteria

1. Display employer source paragraphs left, collapsible role/applicant/offers right, then practical metadata and existing requirement cards. Contact has a stable honest unknown slot. Received advertisement text remains visible when AI structuring fails, with manual source-reusing retry and safe diagnostic reasons.
2. Sign in, save/reopen competencies, separately confirm/reject, reset confirmation on edit, inspect history and explicitly delete. Verify cross-identity isolation, CSRF and revision conflicts against PostgreSQL.
3. Upload bounded PDF/DOCX/UTF-8 TXT/Markdown evidence, retain/download original, declare language/select master, inspect local text, create an UNVERIFIED claim from an exact source excerpt and then review it. Confirm storage and source history across reload/restart. An optional owned single/combined AI analysis follows reviewed previews and per-run approval. Show partial coverage and exact document sources, persist suggestions, and never promote generated wording into confirmation. ADR 0027 adds literal documentary confirmation with distinct basis on the current branch. Optional local OCR and rereading are added in the current workspace slice; layout-preserving generation is not implemented.

## Authorized local-pilot increments

The owner expanded the pilot with public entry, dedicated sign-in and a serious UX/UI redesign. Public entry, CV generation and application tracking are implemented, tested and merged. Standard CV generation uses reviewed selections; automatic AI rewriting and the full normalized employment/project graph remain separate future increments. The owner authorized publication and merge on 2026-10-08; long-term product phases remain separate. See docs/UX_DESIGN.md.

1. Owned saved advertisement snapshots and reviewed typed employment/projects are implemented. A full normalized career graph remains future work.
2. Personal requirement-to-confirmed-claim matching, explicit uncertainty/clarification and explainable CV wording recommendations. Undocumented experience is unknown, not automatically a skill gap. The owner approved relevant CONFIRMED claims plus ad text with preview and approval per analysis; production provider/privacy policy remains separate.
3. Controlled CV version/artifact generation and a simple application CRM recording the exact materials used. Use the owner-approved standard template for first DOCX/PDF export, keep originals, bind approvals to versions and postpone arbitrary imported-layout adaptation.

Automatic job discovery/digests → interview/follow-up → browser application copilot → academy/analytics follow later. Introduce Kafka, Temporal, pgvector and Redis only when an implemented workload justifies them. No paid services or account upgrades are used.

## Completion discipline

Update stories/flows, decisions, security and the development log. Published branches remain pending until an actual authorized merge is verified. Local tests do not establish GitHub Actions execution or fresh-task cloud restoration. Production identity, provider/source terms, account export/deletion, retention, backup and object storage remain unresolved before external rollout.

## Current Gemini continuation — 2026-10-08

Merged in PR #16: explicit Groq/Gemini task routing, recipient/model-bound private approval, persisted run protection, Gemini cooldown and sanitized token logging. Stable 3.5 Flash passed synthetic extraction/profile checks; 3.8 Flash generation returned 503. The related document-quality slice adds explicit responsibility coverage and prevents final synthesis from erasing already sourced profile sections. Real-document Gemini quality remains pending recipient-approved testing. Next: measured document coverage/PDF reading → conservative competency reconciliation → profile/history UX. Native Gemini PDF/URL retrieval, full normalized catalog/conflict model and later discovery/interview/browser/academy features remain separate.

## Prior recovery slice — 2026-10-08 (merged in PR #17)

PR #16 is merged (`5c18439265e6fa2b9852b1a16c631d5ba7be6dc7`); both pre-merge Foundation checks passed. The related `feat/document-evidence-quality` branch adds mixed-layout PDF reading/context preservation, compact grouped document review and approved per-operation Groq/Gemini recovery with actual provider/model identities (ADR 0026).

The priorities listed for that slice (document-grounded population, presentation and matching UX) are now implemented on the current ADR 0027 branch. Full conflict/catalog normalization, native Gemini source/PDF tools and the later discovery/interview/browser/academy roadmap remain separate. This slice does not claim those features are complete.

## Current delivery and next quality work

- Merged foundation: ADR 0027, V13 documentary basis/owner ledger, atomic profile population, durable review decisions, compact counted queue, editable sourced candidate synthesis, matching automation/clarification and bounded advertisement readers. PRs #21–22 add source-usage checks, nested context preservation and explicit month normalization. The current relationship delivery is listed below.
- Next: broader semantic expected-evidence inventory and measured recall, relationship/date conflict reconciliation. The initial independent local reading/list audit across seven supplied originals passed without provider calls. ADR 0028 adds an initial lexical source inventory and bounded follow-up, not the full semantic repair loop. Explicit-list recovery covers only named list items.
- Later: normalized reusable knowledge graph, broader model-quality comparison, advanced CV/discovery/interview features and online hosting. No paid infrastructure or automatic AI submission is introduced.

## Structured context delivery — 2026-10-08

PR #22 is merged with successful Foundation checks. The `feat/competency-career-context` delivery implements ADR 0029: one owner/revision-scoped relationship table, exact unique documentary linking during approved population, explicit link/review/unlink controls and a compact searchable career picker. Existing record statuses and job/CV snapshots are unchanged.

Next priorities remain semantic expected-evidence benchmarking, explicit company/project/date conflict handling and measured extraction improvements. The normalized catalog and broader knowledge model are still proposed; this delivery does not complete them. Flash Lite remains an available choice for all four supported analysis tasks.
