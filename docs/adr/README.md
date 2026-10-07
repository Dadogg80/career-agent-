# Architecture Decision Records

Status Accepted betyr vedtatt føring. Proposed betyr konkret forslag som kan revideres. Ingen ADR betyr at tilhørende funksjon er implementert.

| ADR | Status | Tema |
| --- | --- | --- |
| [0001](0001-modular-monolith.md) | Accepted | Modular monolith, Kotlin/Spring Boot og PostgreSQL |
| [0002](0002-claims-and-evidence.md) | Accepted | Skill inferens fra bekreftet erfaring |
| [0003](0003-controlled-ai.md) | Proposed | Kontrollert AI-orkestrering |
| [0004](0004-durable-jobs.md) | Proposed | Varige databasejobber før broker/workflow-plattform |
| [0005](0005-document-approval.md) | Proposed | Versjonsbundet godkjenning og søknadsartefakter |
| [0006](0006-foundation-toolchain.md) | Accepted | Første implementasjonsomfang og verktøyversjoner |
| [0007](0007-groq-advertisement-pilot.md) | Accepted | Bounded Groq advertisement extraction pilot |
| [0008](0008-official-nav-url-import.md) | Accepted | Official NAV API, reviewed URL import and manual fallback |
| [0009](0009-frontend-query-and-components.md) | Accepted | TanStack Query, shadcn/ui and responsive sourced workspace |
| [0011](0011-opt-in-postgresql-foundation.md) | Accepted | Opt-in PostgreSQL, Flyway and tested identity/profile foundation |
| [0012](0012-job-evidence-and-provider-backoff.md) | Accepted | Source format handling, partial evidence and Groq retry backoff |
| [0013](0013-local-oidc-and-owned-profile.md) | Accepted, local pilot | OIDC/PKCE sessions and user-owned basic profiles |
| [0014](0014-competency-claims-and-revisions.md) | Accepted, local pilot | Owned statements, revision review and document evidence |
| [0015](0015-local-cv-source-import.md) | Accepted, local pilot; AI deferral superseded by 0016 | Local DOCX/PDF originals and user-selected source claims |
| [0016](0016-opt-in-document-ai-analysis.md) | Accepted, local pilot | Opt-in individual/combined source-backed document summaries |
| [0017](0017-competency-workspace-and-local-reading.md) | Accepted, local pilot | Searchable competencies, broader source selection and bounded local rereading/OCR |
| [0010](0010-finn-browser-search.md) | Accepted | Bounded FINN import from exact-link Groq browser tool excerpts |

Accepted ADR-er registrerer eksplisitte føringer i produktvisjonen. Detaljert implementasjon av disse krever fortsatt design og autorisert implementasjonsstart.
