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
| Two-column original-wording ad overview / visible ad on AI failure | Implemented and locally verified on feat/competency-claims; user PR/merge pending |
| Owned competency statements, explicit review and revision history | Implemented and locally verified on feat/competency-claims; user PR/merge pending |
| Local DOCX/PDF original upload, text inspection, master selection and source-selected claims | Implemented and locally verified on feat/competency-claims; user PR/merge pending |
| Automatic private-AI claim discovery, normalized employment/projects | Not implemented |
| Saved jobs, personal matching and CV recommendations | Not implemented |
| Tailored CV artifact/version generation, CRM, discovery, interview/academy/analytics | Not implemented |

The owner confirmed the current scope is the three deliveries already listed: ad overview, competency review and initial CV import. Saved jobs/matching are not added to this request. CV import is local and user-assisted; there is no private-AI call or automatic claim extraction. See docs/CV_IMPORT.md and the actual validation in docs/DEVELOPMENT_LOG.md.

## Current delivery completion criteria

1. Display employer source paragraphs left, collapsible role/applicant/offers right, then practical metadata and existing requirement cards. Contact has a stable honest unknown slot. Received advertisement text remains visible when AI structuring fails, with manual source-reusing retry and safe diagnostic reasons.
2. Sign in, save/reopen competencies, separately confirm/reject, reset confirmation on edit, inspect history and explicitly delete. Verify cross-identity isolation, CSRF and revision conflicts against PostgreSQL.
3. Upload bounded DOCX/PDF, retain/download original, declare language/select master, inspect local text, create an UNVERIFIED claim from an exact source excerpt and then review it. Confirm storage and source history across reload/restart. No OCR or layout-preserving generation is implied.

## Next proposed deliveries after this branch

1. Owned saved advertisement snapshots and normalized experience/project structure, building on the current profile/evidence model.
2. Personal requirement-to-confirmed-claim matching, explicit uncertainty/clarification and explainable CV wording recommendations. Undocumented experience is unknown, not automatically a skill gap. Private provider processing needs a separate data-policy decision.
3. Controlled CV version/artifact generation and a simple application CRM recording the exact materials used. Keep originals, bind approvals to versions and avoid arbitrary DOCX-layout promises.

Automatic job discovery/digests → interview/follow-up → browser application copilot → academy/analytics follow later. Introduce Kafka, Temporal, pgvector and Redis only when an implemented workload justifies them. No paid services or account upgrades are used.

## Completion discipline

Update stories/flows, decisions, security and the development log. Published branches remain pending until the user merges. Local tests do not establish GitHub Actions execution or fresh-task cloud restoration. Production identity, provider/source terms, account export/deletion, retention, backup and object storage remain unresolved before external rollout.
