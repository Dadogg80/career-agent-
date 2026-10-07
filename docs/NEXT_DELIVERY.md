# Next delivery: identity and usable career profile

Status: direct URL analysis, sourced overview facts, compact requirement details and optional PostgreSQL/Flyway foundation are implemented on `feat/job-overview-flow`, pending merge. Earlier URL review/ingestion proposals are superseded by the implemented flow recorded in USER_FLOWS.md and ADRs 0008/0010/0011.

## Next coherent slices

1. Configure OIDC login/session and server-side ownership enforcement. Use a verified issuer/subject to resolve the internal identity. The database migration alone does not authenticate anyone. Add unauthorized/cross-owner tests before exposing personal data. Provider client credentials must be configured securely outside Git.
2. Add profile editing and saved experience/projects/competency claims, with source references, confirmation history and explicit UNVERIFIED/INFERRED/CONFIRMED/REJECTED states. Reopen saved data after reload. Add sanitized request diagnostics during this foundation work.
3. Add authenticated CV upload, original-file retention and bounded document extraction. Extracted claims start UNVERIFIED and require review. Evaluate provider data policy before sending private candidate material to AI.
4. Match advertisement requirements to confirmed profile claims and evidence. Missing documentation is unknown, not automatically a skill gap. Add clarification questions and approved CV wording after that.

Public job analysis remains database independent. Local backend integration tests require Docker. No private endpoint, CV upload or candidate AI processing exists yet. No paid infrastructure or provider upgrades are authorized. See ROADMAP.md for delivery boundaries and docs/POSTGRES_SETUP.md for local database setup.
