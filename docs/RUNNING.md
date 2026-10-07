# Kjør første utviklingsversjon

Status: the unpublished local pilot includes a public landing page, dedicated OIDC sign-in, overview, public advertisement analysis, owned profiles/documents/competency review/career history, saved jobs, approved personal matching, reviewed standard DOCX/PDF export and manual application tracking. PDF/DOCX/UTF-8 TXT/Markdown sources and optional local PDF OCR are supported within documented bounds. Public SaaS deployment remains deferred. See [TESTING_PILOT.md](TESTING_PILOT.md), [IDENTITY_SETUP.md](IDENTITY_SETUP.md), [DOCUMENT_KNOWLEDGE.md](DOCUMENT_KNOWLEDGE.md), [CV_EXPORT.md](CV_EXPORT.md) and [APPLICATION_TRACKING.md](APPLICATION_TRACKING.md).

## Forutsetninger

- JDK 21 for maskinens arkitektur (ARM64 på M1).
- Node.js 24 og npm.
- Nettverk til npm, Maven Central og Gradle-distribusjonen ved første installasjon.
- System status needs no API key. Advertisement extraction needs `GROQ_API_KEY` on the backend. Public-ad startup needs no database; the complete backend tests require Docker. Optional owned profiles require PostgreSQL and local identity setup.

Oppsettskommandoene må kjøres på maskinen hvor applikasjonen skal brukes. Verktøy som er installert i Codex er ikke automatisk installert på Mac-en.

## Backend

Fra repoets rot:

```sh
cd apps/backend
./gradlew test bootJar
# Load your existing local .env. This file is not committed.
set -a
source .env
set +a
java -jar build/libs/career-agent-backend.jar
```

Backend lytter som standard på `127.0.0.1:8080`. `GET /actuator/health` gir helsetilstand; `GET /api/system/status` gir `{ "application": "career-agent", "status": "UP" }`. Dette er prosess-/HTTP-status, ikke en bekreftelse på at framtidige domene- eller AI-funksjoner virker.

## Frontend

I en annen terminal, fra repoets rot:

```sh
cd apps/web
npm ci
npm run dev -- --hostname 127.0.0.1
```

Åpne applikasjonen lokalt på port 3000. Norsk er standard; språkvalget lagres i nettleseren. Backend-adressen leses kun på Next.js-serveren og kan endres med `CAREER_API_BASE_URL` i lokal `.env.local` (ignorert av Git). Se `.env.example`.

Frontend kaller sin egen `/api/status`; serveren kaller Spring Boot. Ingen CORS-unntak eller backend-adresse i klientkonfigurasjonen er nødvendig. Utilgjengelig eller ugyldig backend-svar gir kontrollert feilmelding og retry.

## Produksjonsbygg og browser-tester

Bygg backend først med `./gradlew test bootJar` i `apps/backend`. Kjør deretter i `apps/web`:

```sh
npm ci
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

Playwright starter og stopper egne tjenester på port 13000 og 18080. Begge porter må være ledige. Testene dekker norsk standard, engelsk etter reload, ekte frontend/backend-forbindelse og UI-recovery etter simulert tjenestefeil.

I miljøer med ferdig installert kompatibel Chromium kan `PLAYWRIGHT_CHROMIUM_EXECUTABLE` angi binærstien. Bruk standard Playwright-browser på Mac/CI dersom den er tilgjengelig.

## Cloud-miljø og proxy

Noen cloud-miljøer injiserer HTTP(S)-proxy gjennom miljøvariabler. Java/Gradle bruker ikke nødvendigvis disse automatisk. Konfigurer ved behov Gradles dokumenterte `systemProp.http.proxyHost`/`proxyPort` og HTTPS-ekvivalenter i brukerens Gradle-konfigurasjon utenfor Git. La localhost gå utenom proxy. Ikke kopier proxy-credentials inn i repoet eller deaktiver TLS-verifikasjon.

## Kjente grenser

The backend remains loopback-only. Optional OIDC/owned-profile controls protect the basic name/language profile. Public deployment and private documents need additional deployment/privacy work; do not expose this local pilot publicly.

CI-workflow er skrevet, men en lokal passering dokumenterer ikke at GitHub Actions har kjørt. Se utviklingsloggen for faktisk verifikasjon.

## After merging a delivery

Stop both running processes with Ctrl+C. From the repository root, run `git switch main` and `git pull --ff-only`. Reinstall frontend dependencies with `npm ci` when package-lock.json changes, rebuild the backend and start both using the commands above. A GitHub push does not update or restart your local application. Next.js dev mode reloads many UI edits automatically; backend JAR changes and dependency changes require restart.

NAV import needs no personal token during experimentation; the public experiment token is fetched server-side. An optional NAV_API_TOKEN may be added to the backend `.env`. Public advertisement analysis needs no database. The private pilot requires PostgreSQL and local identity; follow IDENTITY_SETUP.md.

## FINN support and Java discovery on macOS

FINN import reuses GROQ_API_KEY and defaults to Browser Search enabled with 10 attempts per backend process. No dependency reinstall is needed when updating only this delivery. Restart both after pulling main so the new backend route and client validator are active.

If a new Mac terminal reports Unable to locate a Java Runtime, activate the already installed Homebrew JDK 21 in that terminal before Gradle or java:

```sh
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
java -version
javac -version
```

Both should report 21. These shell exports select the installed JDK; they do not install it or persist across new terminals. Avoid changing directory to apps/backend again when the prompt already shows backend.

## PostgreSQL foundation update (2026-10-07)

The complete backend test suite now requires Docker for disposable real PostgreSQL tests. Public-ad startup remains database independent; `./gradlew bootJar` can build the application without starting database tests. Optional local persistence startup and required credentials are documented in [POSTGRES_SETUP.md](POSTGRES_SETUP.md). Optional local profile login/API/UI are available; see [IDENTITY_SETUP.md](IDENTITY_SETUP.md). Reviewed competency claims, typed career history and local document source selection are implemented; a full normalized experience/project graph and automatic adjacent-skill discovery remain future increments. URL analysis now runs directly from **Analyze link**, with no mandatory excerpt-review step.

## Local development interaction troubleshooting

The development config explicitly allows `localhost` and `127.0.0.1` for Next.js development assets/HMR. This does not relax API request-origin checks or production security. Restart the frontend after updating Next config, and consistently open the same local hostname.

Analysis controls are disabled until React initializes, with a visible preparing message and a JavaScript-required fallback. A native form reload must not erase a submitted link. If the preparing message never disappears or mode buttons remain disabled, inspect browser Console and Network for failed scripts; an HMR warning alone does not identify every possible browser startup failure. Private browsing can help diagnose stale resources/extensions without deleting profile data.

Run `npm run test:dev` from apps/web to test both loopback hostnames against a real Next development server. AI calls are mocked, and the tests verify origin enforcement, mode switching and one-click URL analysis without navigation. The regular production browser suite includes a delayed-script hydration check.

## Staged loading and development diagnostics

For the earlier pacing delivery, restart `npm run dev -- --hostname 127.0.0.1` from apps/web. No backend rebuild, Docker restart, new dependency or key is needed. The local UI includes a right-side **Utviklerdiagnostikk** Sheet opened from the DEV tab and sanitized Console events prefixed `[Career Agent]`. FINN retrieval now has a visible 10-second pause before analysis, configurable in apps/web/.env.local. See [DEBUGGING.md](DEBUGGING.md) for settings and inspection steps. Ten seconds does not guarantee shared Groq quota availability.

## Basic profile delivery

This delivery changes backend security/dependencies and adds optional local identity configuration. Rebuild/restart the backend after merging; enable `persistence,identity` and the additional Compose file to test sign-in. Follow [IDENTITY_SETUP.md](IDENTITY_SETUP.md) rather than only the older public-ad commands above. Public job analysis can still use the default database-independent startup.

## Update and restart after merging this branch

Stop the running backend/frontend with Ctrl+C. From the repository root on the pilot Mac:

```sh
git switch main
git pull --ff-only origin main
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"
node scripts/configure-local-identity.mjs
docker compose --env-file apps/backend/.env --env-file apps/backend/.env.identity -f compose.yaml -f compose.identity.yaml up -d --wait
cd apps/backend
./gradlew test bootJar
set -a
source .env
source .env.identity
set +a
SPRING_PROFILES_ACTIVE=persistence,identity java -jar build/libs/career-agent-backend.jar
```

The helper preserves an existing identity file; no passwords or provider keys need to be changed. Flyway applies new migrations automatically. Keep existing volumes and `apps/backend/local-data/documents` (or the configured storage path).

In a second terminal from the repository root:

```sh
cd apps/web
nvm use 24
npm ci
npm run dev -- --hostname 127.0.0.1
```

Use the local application at `http://127.0.0.1:3000`. The root opens the landing page. Sign in through `/login` as `pilot` using the password in your own ignored `.env.identity`; the callback opens `/dashboard`. Guest advertisement analysis is `/jobs/analyze`. Public ad analysis works without sign-in. If changing default ports, configure both Next API base and backend public login origin consistently. The local private pilot is not an externally deployed SaaS.

Stop the running Java process **before** rebuilding its JAR. Overwriting an archive used by a live Spring Boot classloader can produce class-loading failures; rebuild first, then start the new process.

## Optional document AI summaries

After updating/rebuilding this branch, use Min profil → CV og dokumenter → Oppsummer alle dokumentene med AI. Review all readable source excerpts and approve sending; do not send unnecessary private details. GROQ_API_KEY is reused server-side. The new V4 migration is automatic. No new dependency/service or account upgrade is needed. Individual analysis is available inside each document. See [CV_IMPORT.md](CV_IMPORT.md) for partial coverage, source inspection, UNVERIFIED review, persistence and failure behavior. Public advertisement diagnostics exclude this private content.

## Optional local scan reading

V5 applies automatically on backend restart. Existing originals do not need reuploading: choose **Les originalen på nytt** in their review Sheet. For image-only PDF pages, install free Tesseract on the Mac backend (`brew install tesseract`); Norwegian OCR additionally uses `brew install tesseract-lang` and `DOCUMENT_OCR_LANGUAGES=nor+eng` in `apps/backend/.env`. Restart Java after changing its environment/PATH. OCR is explicitly selected, local, limited to ten pages and requires text review before a separate AI call. It is optional for ordinary text-based PDF/DOCX. See CV_IMPORT.md.
