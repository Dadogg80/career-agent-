# Career Agent roadmap

Status checked against remote main on 2026-10-07. Dates are not promised; deliver small, tested pull requests. This is a working implementation sequence, not a claim that the complete MVP exists.

## Where we are

| Capability | Actual status |
| --- | --- |
| Next.js + Kotlin/Spring Boot foundation | Implemented and merged |
| Norwegian default / English UI | Implemented for current screens |
| Groq structured requirement extraction with source quotes | Implemented and merged |
| NAV API URL import + manual text fallback | Implemented and merged |
| FINN import through Groq browser excerpts | Implemented and merged; source may be partial/stale |
| TanStack Query and shadcn/ui workspace | Implemented and required by AGENTS.md |
| Compact requirement tiles, category filters and detail dialogs | Implemented on feat/compact-requirement-details; PR merge pending |
| PostgreSQL, login, user-owned saved profiles/jobs | Not implemented |
| Candidate claims/competence, CV/document upload, personal matching | Not implemented |
| CV tailoring/export, application CRM, discovery and interview prep | Not implemented |

The current pilot analyzes public advertisements. It does not know the candidate, save work across reloads, or produce a personal match assessment. Current requirement category explanations are deterministic UI guidance; detailed source context comes from the exact analyzed text, not an additional model call.

## Current delivery: make analysis easier to inspect

Show compact tiles grouped by REQUIRED, PREFERRED and UNCLEAR, with category filters/counts. Open each tile to inspect the original quote, category explanation and surrounding source context. Preserve language, stale-result and browser-excerpt provenance. No additional AI calls or candidate claims.

## Next delivery 1: identity, storage and candidate profile

Purpose: turn the public-text tool into a safe, persistent personal workspace.

Small implementation sequence:
1. PostgreSQL in local Docker Compose, schema migrations and integration-test setup.
2. Spring Security/OIDC session and server-side ownership/authorization; choose/configure the pilot login provider. Do not expose private data before these boundaries are verified.
3. User-owned profile, projects/experience and manually entered competency claims with UNVERIFIED/INFERRED/CONFIRMED/REJECTED status and evidence/confirmation history.
4. Profile screen for editing, reviewing and reopening saved information; save user-owned job snapshots. Add sanitized request diagnostics/build information during this foundation work.

Done when the pilot can log in, save/reopen a profile and competencies, and authorization tests prove another identity cannot access them. These are multiple coherent PRs, not one large commit.

## Next delivery 2: CV and source document import

Purpose: populate the profile from the user's own material without turning AI extraction into truth.

Small implementation sequence:
1. Authenticated bounded DOCX/PDF upload, object-storage abstraction, metadata and original-document retention.
2. Text/structure extraction with file-type, size and malformed-document handling.
3. Proposed claims linked to their source, initially UNVERIFIED, with explicit user confirmation/rejection/editing.
4. Master CV selection and document language; an uploaded DOCX can be the original CV/template source.

Done when the pilot can upload a CV, inspect proposed experience/skills and confirm the facts to reuse. Uploading a template does not imply preserving arbitrary layout, generating tailored DOCX/PDF or executing embedded document content.

## Next delivery 3: personal matching and approved CV recommendations

Purpose: connect the working job analysis to the confirmed candidate profile.

Small implementation sequence:
1. Requirement-to-claim/project/evidence comparison with strong, partial and needs-clarification outcomes. Undocumented experience is unknown, not automatically a genuine skill gap.
2. Targeted competency questions and confirmation history; re-analyze against updated profile versions.
3. Explainable application recommendation and CV wording/change proposals using confirmed facts only, with user review.

Done when each relevant requirement has inspectable candidate evidence or an explicit uncertainty, and no inferred experience appears as confirmed CV content. Exact CV versioning, controlled template rendering and DOCX/PDF export follow as a separate delivery.

## Later deliveries

CV artifact/version generation → simple application CRM and exact materials used → automatic discovery and digest → interview/follow-up → browser application copilot → interactive academy and analytics.

Richer job overview/summary and metadata remain a scoped improvement to the analysis track; they should not hold up the requested profile/CV work. Work can resume there when needed for matching. Keep its facts sourced and distinguish missing metadata.

Introduce Kafka, Temporal, pgvector and Redis only when an implemented workload justifies them. No Kubernetes or premature microservices. No paid services or account upgrades are authorized.

## Completion discipline

Update stories/flows, decisions, development log and security guidance with each delivery. Passing local tests does not establish that GitHub Actions ran. Published branches remain pending until merged. Private profile/CV features require verified ownership, access control and an appropriate provider-data policy before sending candidate material to AI.
