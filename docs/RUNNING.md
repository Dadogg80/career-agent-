# Kjør første utviklingsversjon

Status: A redesigned shadcn/ui workspace, Norwegian/English selection, official NAV URL import, service status and Groq requirement extraction are implemented. Profiles, database, document processing and authentication are not implemented. This version must not be used for private candidate storage or as a public SaaS. See [TESTING_PILOT.md](TESTING_PILOT.md) for the complete AI test flow.

## Forutsetninger

- JDK 21 for maskinens arkitektur (ARM64 på M1).
- Node.js 24 og npm.
- Nettverk til npm, Maven Central og Gradle-distribusjonen ved første installasjon.
- System status needs no API key. Advertisement extraction needs `GROQ_API_KEY` on the backend. No database or Docker is required yet.

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

Ingen autentisering er implementert. Backend is therefore bound to loopback and supports only system status and the public-advertisement pilot. Innlogging og autorisasjon må implementeres før private data eller ekstern pilot.

CI-workflow er skrevet, men en lokal passering dokumenterer ikke at GitHub Actions har kjørt. Se utviklingsloggen for faktisk verifikasjon.

## After merging a delivery

Stop both running processes with Ctrl+C. From the repository root, run `git switch main` and `git pull --ff-only`. Reinstall frontend dependencies with `npm ci` when package-lock.json changes, rebuild the backend and start both using the commands above. A GitHub push does not update or restart your local application. Next.js dev mode reloads many UI edits automatically; backend JAR changes and dependency changes require restart.

NAV import needs no personal token during experimentation; the public experiment token is fetched server-side. An optional NAV_API_TOKEN may be added to the backend `.env`. No Docker or database is needed for this slice.

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

The complete backend test suite now requires Docker for disposable real PostgreSQL tests. Public-ad startup remains database independent; `./gradlew bootJar` can build the application without starting database tests. Optional local persistence startup and required credentials are documented in [POSTGRES_SETUP.md](POSTGRES_SETUP.md). Profile login/API/UI and CV upload are not yet available. URL analysis now runs directly from **Analyze link**, with no mandatory excerpt-review step.
