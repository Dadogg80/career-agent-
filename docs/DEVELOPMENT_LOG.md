# Utviklingslogg

Loggen beskriver faktisk arbeid, ikke planlagt funksjonalitet. Datoer følger brukerens tidssone Europe/Oslo.

## 2026-10-07 — Produktdokumentasjon og brukerflyter

- Autorisasjon: Brukeren ba om brukerflytdiagram, user stories og varig Markdown-dokumentasjon i repositoriet.
- Før endring: Checkout var tom for prosjektfiler; ingen eksisterende AGENTS.md eller brukerendringer ble funnet ved inspeksjon.
- Opprettet dokumentindeks, arbeidsregler, produktgrunnlag, fire Mermaid-flyter, prioriterte user stories, roadmap, foreløpige sikkerhetskrav, beslutningsregister og åpne spørsmål.
- Bekreftede brukerføringer er skilt fra arkitektens anbefalinger.
- Ingen applikasjonskode, dependencies, tjenester eller skydrift er opprettet.
- Dokumentkontroll: Lokale Markdown-lenker, story-referanser og kodegjerder er kontrollert i alle 10 filer; 22 unike story-ID-er er registrert. Kontrollen bestod. Mermaid-diagrammene er ikke verifisert i en renderer.
- Gjenstår: Gjennomgå flytene med brukeren, avklare pilotmaskin og AI-kjøreform, og vedta omfang før implementasjon.

## 2026-10-07 — Git-publisering og arkitekturgrunnlag

- Brukeren ba om selvstendig videreføring med minst mulig interaksjon.
- Første dokumentasjonscommit `7f78bb0` er pushet til GitHub som `main`.
- Opprettet `docs/architecture-foundation` for videre dokumentasjonsarbeid.
- Skrevet ARCHITECTURE.md, DOMAIN.md, Git-arbeidsflyt og fem ADR-er. To ADR-er registrerer eksplisitte produktføringer; tre er forslag.
- Ingen applikasjonskode eller betalte tjenester er opprettet. Ingen branch protection er satt.
- Dokumentkontroll bestod for alle 19 Markdown-filer: lokale lenker, kodegjerder og whitespace. `git diff --check` bestod. Mermaid er ikke visuelt rendret; ingen applikasjonstester finnes ennå.
- GitHub API svarte Forbidden ved repository-oppslag. Git-push fungerer, men PR-opprettelse og innstilling av default branch kan ikke forutsettes tilgjengelig via API. Ingen PR er opprettet.

## 2026-10-07 — Pilotmaskin og foreslått lokal kjøring

- Brukerens skjermbilde avklarte Apple M1, 16 GB minne og macOS. Maskinnavn, serienummer og selve skjermbildet er ikke lagret i Git.
- Dokumentert forslag: native frontend/backend, PostgreSQL-container og utprøving av en liten lokal modell via native Ollama.
- Oppdatert åpent spørsmål om maskin; AI-valg er fortsatt betinget av lokal kvalitet og ytelse.
- Ingen installasjon eller modellkjøring er utført på pilotmaskinen. Ingen betalt fallback er aktivert.

## 2026-10-07 — Gratis AI-alternativer

- Dokumentert Gemini, Groq og lokal Ollama som kandidater; ingen provider eller modell er valgt.
- Forsøk på lesing av offisielle Google/Groq-sider ble blokkert av nettverksproxy med 403 Forbidden. Dagens gratisnivåer og vilkår er derfor ikke verifisert.
- Ingen credentials er etterspurt eller lagret, og ingen modellkall er utført.

## 2026-10-07 — Første implementasjon: språk og tjenesteforbindelse

- Brukerens forespørsel om å starte utviklingen ble tolket som klarsignal til en liten grunnmur; omfanget ble forklart før endringer.
- Opprettet branch `feat/foundation` fra dokumentasjonsbranchen. Arkitekturdokumentasjonen følger derfor med i branchens historikk og er ikke allerede merget til main.
- Implementert Next.js-startside med norsk som standard, engelsk, beholdt språkvalg og tilgjengelig tjenestestatus med retry.
- Implementert Kotlin/Spring Boot API med systemstatus og begrenset health-endpoint. Backend binder loopback som standard; ingen private kandidatdata eller auth-flyt finnes ennå.
- Lagt til checksum-verifisert Gradle wrapper, npm-lockfile, E2E-oppsett og GitHub Actions-workflow.
- Rettet lokale miljøprerequisites: JDK 21 manglet selv om Java-runtime fantes. Temurin-distribusjon og Gradle ble checksum-verifisert. Eksisterende proxy og plattformens Java trust store er konfigurert utenfor Git; TLS-verifikasjon er beholdt.
- Verifisert: backend test/build, 2 integrasjonstester passert uten skips; Next.js-produksjonsbygg og TypeScript passert; 3 Playwright-tester passert mot faktisk frontend/backend med systemets Chromium. Npm audit for runtime-dependencies rapporterte 0 kjente sårbarheter på kontrolltidspunktet.
- Gradle wrapper-kjøring bestod etter bootstrap; oppgaver ble korrekt gjenbrukt fra cache. Wrapper-JAR ble også sammenlignet med offisiell checksum.
- Frozen npm-installasjon (`npm ci`) og påfølgende TypeScript-kontroll bestod. Lokale lenker og kodegjerder i 23 prosjektdokumenter bestod kontrollen. Git-attributter normaliserer plattformens linjeskift for wrapper-skriptene.
- GitHub Actions og kjøring på brukerens Mac er ikke verifisert. Ingen database, AI-integrasjon, betaling eller offentlig deploy er gjort.
- Neste sammenhengende funksjon: eierskap/tilgang og manuelt kandidatgrunnlag med persistens og claim-bekreftelse, før AI-generering.

## 2026-10-07 — Kontroll av main og Groq-secret

- Eksplisitt fetch av main avklarte at PR #1 for `docs/architecture-foundation` er merget. Main-tip var `28170e5`; implementasjonscommit `bcb40d8` var ikke inkludert.
- Main hadde også brukerens `.gitignore` og `env_example`. Eksempelfilens nøkkelfelt ble kontrollert uten utskrift av verdi; det er en placeholder, ikke en mottatt credential.
- Merget main inn i `feat/foundation`, bevart brukerfilen og løst add/add-konflikten i `.gitignore` ved å beholde `.env` og eksisterende ignoreringsregler.
- Lagret secret-krav `GROQ_API_KEY` til `api.groq.com` i Codex-draft. Backend bekreftet lagring og at publisering kreves. Ingen secret-verdi finnes i kjøremiljøet ennå.
- Dokumentert sikker konfigurasjon og brukerens ønskede PR-arbeidsflyt. PR-tittel og full beskrivelse finnes i PR_FOUNDATION.md.

## 2026-10-07 — English GitHub communication

- The user requires English for all GitHub communication, including commit messages and PR titles/descriptions.
- Updated agent instructions, translated the Git workflow and pending foundation PR handoff, and added an English PR template.
- Application localization remains Norwegian-first with English support. Existing commit history is unchanged; previous authored commit messages were already English.
- Documentation-only change; no application behavior or test expectations changed. Checked local links, code fences, and staged whitespace.

## 2026-10-07 — Bounded Groq advertisement pilot

- Confirmed PR #2 merged the foundation into main at `b6f247a`; created `feat/job-requirements` from that main.
- Reviewed roadmap, domain/architecture, stories, security, AI/provider, local-running and open-decision documents. Resolved stale provider status after checking runtime key presence without showing its value.
- Authenticated model listing succeeded after setting product User-Agent; the initial urllib request's 403 / code 1010 was not evidence of a missing key.
- Implemented AiModel/Groq adapter, strict structured extraction, quotation validation, sanitized errors, bounded calls and Norwegian/English input/results UI. No dependency was added.
- Deliberately delivered a public-text experiment before profile/auth/database so the pilot can test useful AI sooner. Original private-data requirements remain in the roadmap; ADR-0007 records the decision.
- Backend: 14 tests passed, 0 failures/errors/skips; executable JAR built. A Kotlin/Mockito matcher issue in the new test was diagnosed and corrected before final pass.
- Frontend: production build and TypeScript passed; all 8 browser tests passed. Automated tests use mocks or an explicitly empty provider key.
- Live smoke checks: two fictional backend analyses (Norwegian customer-service and English developer advertisements) returned quoted requirements. These are limited checks, not a broad quality or privacy certification.
- Full live browser check caught an Origin mismatch caused by Next.js canonicalizing request.url to localhost. Corrected comparison to incoming Host, limited hosts to loopback, and added a real missing-key browser regression test. Subsequent live browser → proxy → backend → Groq check passed; two cited requirements were displayed and the screenshot was visually inspected.
- Only fictional data was used in live inference. The screenshot is a temporary test artifact, not a private candidate document. Test services started by this task were stopped after verification.
- Documented Docker tradeoffs and recommended native app processes plus PostgreSQL Compose when needed. Added pilot instructions and English PR handoff.
- Remaining: user testing on Mac and GitHub Actions verification; auth/ownership and backup before private persistence. No candidate matching, CV handling or public deployment is available yet.
