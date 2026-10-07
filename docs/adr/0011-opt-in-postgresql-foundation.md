# ADR 0011: opt-in PostgreSQL foundation

Status: Accepted — 2026-10-07

## Decision

Keep public advertisement analysis usable without a database. Enable PostgreSQL/JDBC/Flyway only with the `persistence` Spring profile. Local Compose uses the official PostgreSQL 17 Bookworm multiarchitecture image pinned by registry digest, a loopback port, mandatory user-supplied password and named volume. Testcontainers exercises the same image/migrations against real PostgreSQL; Docker is required for the backend integration suite and already available in GitHub-hosted CI.

Start with identity bindings `(issuer, subject)` and an owner-linked career profile, language and revision. Application services will enforce authorization against a verified principal, not a request-supplied owner. Database foreign keys are integrity checks, not access control. There is no profile API/UI or candidate-data ingestion in this slice. OIDC login and ownership tests are the next prerequisite before exposing private storage.

## Consequences

No paid infrastructure, JPA or broker is introduced. Default local startup remains unchanged. Persistence startup fails if credentials/database are absent rather than silently falling back to memory. Flyway clean is disabled. The current local database role is for development only; deployment needs separate migration/runtime privileges, managed secrets, backups and access restrictions. Deletion cascades local profile rows, not future document objects or provider data. Image updates require an intentional digest refresh and migration checks on both supported architectures.
