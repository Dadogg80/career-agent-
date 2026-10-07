# PR: Første grunnmur med norsk/engelsk frontend og Spring Boot

Base: `main`

Head: `feat/foundation`

Status: Publisert branch, klar for PR. Dette dokumentet oppretter eller merger ingen PR.

## Tittel

feat: legg til norsk/engelsk frontend og testet Spring Boot-grunnmur

## Beskrivelse

Prosjektet har hittil hatt produkt- og arkitekturdokumentasjon. Denne endringen legger til den første kjørbare grunnmuren: en Next.js-startside med norsk som standard, engelsk språkvalg som beholdes etter reload, og forbindelse til en Kotlin/Spring Boot-backend. Utilgjengelig tjeneste gir feilmelding og retry.

Backend eksponerer systemstatus og en begrenset health-endpoint, med loopback-bind som standard. Frontend kaller backend gjennom en server-side route. Endringen inkluderer Gradle wrapper med checksum, npm-lockfile, CI-workflow, kjøreinstruksjoner og oppdatert utviklingsdokumentasjon.

Oppdatert main er merget inn i branchen. Brukerens `.env`-ignore og `env_example` er bevart; konflikt i `.gitignore` er løst uten endring i applikasjonskode.

Validering i Codex:

- 2 backend-integrasjonstester bestod; ingen skips eller feil.
- 3 Playwright-tester bestod mot faktiske tjenester: norsk standard, engelsk med reload og recovery etter simulert feil.
- Next.js-produksjonsbygg, TypeScript og frozen npm-installasjon bestod.
- Gradle wrapper og JAR-checksum ble verifisert.
- Runtime npm-audit rapporterte ingen kjente sårbarheter på kontrolltidspunktet.

GitHub Actions og kjøring på pilotens Mac er ikke verifisert. Database, auth, kandidatprofil og AI er ikke implementert. Groq-secret-kravet er lagret separat i Codex-miljøutkastet; ingen nøkkel er lagt i Git og ingen Groq-kall er utført. Ingen offentlig deploy eller betalt tjeneste er aktivert.
