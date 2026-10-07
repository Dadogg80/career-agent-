# Kjør første utviklingsversjon

Status: Grunnmur med startside, språkvalg og tjenestestatus. Profil, database, dokumentbehandling, auth og AI er ikke implementert. Bruk ikke versjonen til lagring av private kandidatdata eller som offentlig SaaS.

## Forutsetninger

- JDK 21 for maskinens arkitektur (ARM64 på M1).
- Node.js 24 og npm.
- Nettverk til npm, Maven Central og Gradle-distribusjonen ved første installasjon.
- Ingen API-nøkkel, database eller Docker er nødvendig for denne endringen.

Oppsettskommandoene må kjøres på maskinen hvor applikasjonen skal brukes. Verktøy som er installert i Codex er ikke automatisk installert på Mac-en.

## Backend

Fra repoets rot:

```sh
cd apps/backend
./gradlew test bootJar
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

Ingen autentisering er implementert. Backend er derfor bundet til loopback og inneholder bare offentlig, ikke-personlig systemstatus. Innlogging og autorisasjon må implementeres før private data eller ekstern pilot.

CI-workflow er skrevet, men en lokal passering dokumenterer ikke at GitHub Actions har kjørt. Se utviklingsloggen for faktisk verifikasjon.
