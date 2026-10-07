# ADR 0013: Local OIDC sessions and an owned basic profile

Status: Accepted for the local pilot

Date: 2026-10-07

## Context

The public advertisement workflow is available. The next roadmap increment needs a persistent candidate workspace without exposing private data before authentication/ownership exists. The pilot has no service budget and uses a 16 GB Apple M1. Production SaaS authentication remains a separate deployment decision.

## Decision

Use Spring Security OAuth2 Client/OIDC with authorization code + explicit PKCE S256. Provide an optional pinned local Keycloak development container and imported single-pilot realm, with generated passwords in an ignored local file. Keep public-ad startup independent of both identity and persistence.

Resolve ownership exclusively from the verified ID token's issuer and subject. Bind this pair to an internal user UUID on explicit profile save. Implement only `/api/profile/me` with name, nb/en preferred language and revision. Reject caller-supplied ownership fields and arbitrary profile identifiers. Keep validation in the application service and SQL in a transactional `ProfileRepository` adapter. Serialize writes per owner and compare revisions to avoid silent lost updates.

The browser uses fixed Next.js proxy routes with same-origin/loopback enforcement, a bounded write body, selected session-cookie forwarding and `no-store` responses. Spring owns an HttpOnly, SameSite=Lax session cookie and validates CSRF for profile writes/logout. Tokens, cookies, profile bodies and raw authentication failures are not logged. Login callback success/failure redirects have fixed configured destinations. Public advertisement POSTs remain separate from private data.

Use TanStack Query for session/profile operations and existing shadcn/ui primitives. Show unavailable configuration, failed login, expired session, save failure and revision conflict explicitly. Retain draft text after a conflict until the user requests the saved version. Diagnostics continue to describe only public advertisement workflows.

## Consequences

- No paid identity account or application password handling. Real local OIDC can be exercised before private documents exist.
- Additional optional container/process overhead; Keycloak is not required for public analysis or default E2E runs.
- Sessions are in-memory and disappear on application restart; PostgreSQL profiles persist. App logout does not terminate provider SSO.
- Local `start-dev`, HTTP loopback cookies and the fixture realm must never be used as a public deployment. Production issuer/client, HTTPS, cookie settings, backups, export/deletion and provider processing policies remain unresolved.
- No competencies, claims, documents, personal matching, saved jobs, organization access or private AI processing are implied by this slice.

## Validation

Testcontainers/MockMvc cover issuer+subject ownership, missing/invalid CSRF, unauthorized access, spoofed fields/headers, invalid data, transaction rollback and stale revisions. Browser tests cover profile save/reopen, language, conflicts, honest configuration and proxy boundaries. A separate synthetic live browser check exercises Keycloak login with S256, saved/reloaded profile, session cookie flags, logout and an invalid callback. Counts and current branch status are in the development log.

See [IDENTITY_SETUP.md](../IDENTITY_SETUP.md), [ADR 0011](0011-opt-in-postgresql-foundation.md) and [SECURITY.md](../../SECURITY.md).
