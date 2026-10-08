# Local sign-in and basic profile

This optional local pilot adds real OIDC sign-in and a user-owned PostgreSQL profile. The current branch adds reviewed competencies and local CV/source import; saved jobs and personal matching are later deliveries. See [CV_IMPORT.md](CV_IMPORT.md). Public job analysis still works without sign-in or a database.

Keycloak runs locally in Docker with no paid account. Spring Security handles OIDC authorization code + PKCE and the application session; we do not implement a password/token service. Keycloak's development mode and imported pilot account are for loopback development only. This is not a production identity deployment or a GDPR compliance claim.

## First-time setup

Keep Docker Desktop running. Select Node 24 with nvm and Java 21 as in [RUNNING.md](RUNNING.md). Stop the existing backend before starting its replacement. From the repository root:

```sh
node scripts/configure-local-identity.mjs
docker compose --env-file apps/backend/.env --env-file apps/backend/.env.identity -f compose.yaml -f compose.identity.yaml up -d --wait
```

Your existing ignored `apps/backend/.env` must contain `DATABASE_PASSWORD` for the existing PostgreSQL volume. Keep its `GROQ_API_KEY` unchanged. The helper creates a separate ignored `.env.identity` with generated local login/admin passwords and fixed local origins, using restrictive file permissions. It leaves an existing file unchanged and prints no passwords. Never commit either file or paste its contents into chat.

The Compose command starts PostgreSQL on loopback port 5432 and Keycloak on loopback port 8081. This optional identity container uses a 512 MB Java heap limit plus process overhead; frontend/backend remain native processes. Images are pinned to official digests. Initialization imports the realm and creates the synthetic local account once.

## Backend terminal

From the repository root, with Java 21 active:

```sh
cd apps/backend
./gradlew test bootJar
set -a
source .env
source .env.identity
set +a
SPRING_PROFILES_ACTIVE=persistence,identity java -jar build/libs/career-agent-backend.jar
```

An unavailable database or OIDC issuer fails this opt-in startup. Wait for Compose health before starting Java. The complete backend suite needs Docker and tests disposable PostgreSQL instances; it does not modify your Compose profile data.

## Frontend terminal

From the repository root:

```sh
cd apps/web
nvm use 24
npm ci
npm run dev -- --hostname 127.0.0.1
```

Use `127.0.0.1` consistently, including the browser. Defaults are frontend port 3000, backend 8080 and identity 8081. Open the application landing page, select **Logg inn / Sign in**, then **Fortsett til sikker innlogging / Continue to secure sign-in**, and use username `pilot`. A successful login opens `/dashboard`; create or edit the basic profile through **Min profil / My profile**. Read `PILOT_LOGIN_PASSWORD` from your own `.env.identity` locally in VS Code. The separate administrator is `local-admin`; the application never needs its password.

Save a name and preferred profile language. Reload to check persistence. Two tabs editing the same revision produce a conflict rather than silently overwriting; **Hent lagret versjon / Load saved version** explicitly replaces the draft. UI language selection and the saved profile language are separate settings. No private profile information is sent to Groq or diagnostic logs.

## Restart, stopping and limits

After pulling changes, stop the Java/Next processes, rebuild the JAR and repeat the backend/frontend commands. PostgreSQL retains the profile across application restarts; the in-memory application session does not, so sign in again. Application sign-out invalidates the Career Agent session but does not close Keycloak's SSO session; another sign-in may reuse it. This is a single-pilot fixture, not an account registration feature.

To stop containers while preserving their volumes:

```sh
docker compose --env-file apps/backend/.env --env-file apps/backend/.env.identity -f compose.yaml -f compose.identity.yaml stop
```

Changing passwords in environment files does **not** rotate credentials already initialized in PostgreSQL or Keycloak. Do not delete volumes to resolve this: preserve data and change credentials in the relevant service. An environment snapshot is not a profile backup. Export, account deletion, retention and encrypted backups remain outstanding before broader/external document use. Local document and claim deletion have explicit, separately explained semantics.

If ports change, update matching issuer, backend public origin, redirect URI, frontend origin and server-side frontend configuration together. Redirects are fixed to configured loopback origins; browser-supplied return URLs and owner IDs are never accepted. `.env.identity` contains defaults for this configuration. Do not expose these HTTP services publicly. Production requires HTTPS, secure cookies, a production IdP and deployment-specific controls.

Without the `identity,persistence` profiles, the profile page honestly reports sign-in/storage unavailable. This never falls back to trusting a browser user ID or anonymous private storage.

For nondefault verification ports, set both Next server-side `CAREER_API_BASE_URL` (API proxy) and `BACKEND_PUBLIC_ORIGIN` (browser login redirect) to the matching backend origin. Setting only the API base can make data requests work while login still navigates to the default port.

## Optional document AI summaries

After updating/rebuilding this branch, use Min profil → CV og dokumenter → Oppsummer alle dokumentene med AI. Review all readable source excerpts and approve sending; do not send unnecessary private details. GROQ_API_KEY is reused server-side. The new V4 migration is automatic. No new dependency/service or account upgrade is needed. Individual analysis is available inside each document. See [CV_IMPORT.md](CV_IMPORT.md) for partial coverage, source inspection, UNVERIFIED review, persistence and failure behavior. Public advertisement diagnostics exclude this private content.
