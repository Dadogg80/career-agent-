# Pull request handoff

Base: `main`

Head: `feat/diagnostics-sheet-and-profile-foundation`

Title:

```text
Add a diagnostics side panel and secure local profiles
```

Description:

```markdown
Move developer diagnostics into a hidden right-side shadcn Sheet opened from a DEV edge tab. Keep current-run status lights, source inspection and sanitized console events, with keyboard, mobile and reduced-motion support.

Add the next profile foundation: optional local Keycloak sign-in through Spring Security OIDC/PKCE and a user-owned PostgreSQL profile for name, preferred language and revision. Protect private writes/logout with CSRF, resolve ownership from the verified issuer/subject, and reject stale revisions and spoofed owner fields. Add Norwegian/English profile UI with TanStack Query and bounded same-origin Next.js proxies.

Public advertisement analysis still runs without identity or a database. No profile data is sent to Groq. Experience, competency claims, CV upload, saved jobs, personal matching and production identity remain future work. Local Keycloak development mode must not be exposed publicly.

Validation:
- 52 backend tests passed, including PostgreSQL authorization/integrity tests; executable JAR built.
- Production frontend build and TypeScript check passed.
- 30 production browser tests and 6 development-server tests passed.
- Synthetic live Keycloak flow verified PKCE, save/reopen (including after backend restart), session-cookie flags, CSRF rejection, logout and invalid callback rejection.
- No live Groq calls or paid services used; GitHub Actions status is not independently verified.

Update the roadmap, flows/stories, security/domain/architecture documents and decisions. See docs/IDENTITY_SETUP.md for opt-in local profile setup and ADR 0013 for the identity/ownership decision. Rebuild/restart the backend after merging; ordinary public-ad startup does not enable profile sign-in automatically.
```

Compare/create link: https://github.com/Dadogg80/career-agent-/compare/main...feat/diagnostics-sheet-and-profile-foundation?expand=1

The branch is published for review; no PR creation, merge or public deployment is performed by this handoff.
