# Career Agent roadmap

Status checked against remote main on 2026-10-07. Deliver small tested increments; branch implementation is not a merged release.

## Current status

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
| Competency search/status dashboard, wider document review Sheet, improved source coverage and local rereading/OCR | Implemented and locally validated on feat/competency-workspace; not pushed/merged |
| Adjacent-skill inference, normalized employment/projects | Not implemented |
| Saved jobs, personal matching and CV recommendations | Not implemented |
| Tailored CV artifact/version generation, CRM, discovery, interview/academy/analytics | Not implemented |

The previous delivery scope was the three deliveries already listed: ad overview, competency review and initial CV import. Saved jobs/matching were excluded from that earlier delivery; the latest instruction authorizes progressing through the local pilot workflow without pushing yet. The owner subsequently added AI competency summarization across uploaded documents before merge. Upload/extraction remain local; a separately approved Groq call creates stored source-backed suggestions, and an explicit user save creates UNVERIFIED claims. See docs/CV_IMPORT.md and the actual validation in docs/DEVELOPMENT_LOG.md.

## Current delivery completion criteria

1. Display employer source paragraphs left, collapsible role/applicant/offers right, then practical metadata and existing requirement cards. Contact has a stable honest unknown slot. Received advertisement text remains visible when AI structuring fails, with manual source-reusing retry and safe diagnostic reasons.
2. Sign in, save/reopen competencies, separately confirm/reject, reset confirmation on edit, inspect history and explicitly delete. Verify cross-identity isolation, CSRF and revision conflicts against PostgreSQL.
3. Upload bounded DOCX/PDF, retain/download original, declare language/select master, inspect local text, create an UNVERIFIED claim from an exact source excerpt and then review it. Confirm storage and source history across reload/restart. An optional owned single/combined AI analysis follows reviewed previews and per-run approval. Show partial coverage and exact document sources, persist suggestions, and never auto-confirm. Optional local OCR and rereading are added in the current workspace slice; layout-preserving generation is not implemented.

## Authorized next local-pilot increments

1. Owned saved advertisement snapshots and normalized experience/project structure, building on the current profile/evidence model.
2. Personal requirement-to-confirmed-claim matching, explicit uncertainty/clarification and explainable CV wording recommendations. Undocumented experience is unknown, not automatically a skill gap. The owner approved relevant CONFIRMED claims plus ad text with preview and approval per analysis; production provider/privacy policy remains separate.
3. Controlled CV version/artifact generation and a simple application CRM recording the exact materials used. Use the owner-approved standard template for first DOCX/PDF export, keep originals, bind approvals to versions and postpone arbitrary imported-layout adaptation.

Automatic job discovery/digests → interview/follow-up → browser application copilot → academy/analytics follow later. Introduce Kafka, Temporal, pgvector and Redis only when an implemented workload justifies them. No paid services or account upgrades are used.

## Completion discipline

Update stories/flows, decisions, security and the development log. Published branches remain pending until the user merges. Local tests do not establish GitHub Actions execution or fresh-task cloud restoration. Production identity, provider/source terms, account export/deletion, retention, backup and object storage remain unresolved before external rollout.
