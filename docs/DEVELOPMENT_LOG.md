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

## 2026-10-07 — URL overview proposal

- Confirmed PR #3 merged advertisement extraction into main at `7c35cf5`.
- The user successfully built the backend and opened the frontend on their Mac. A successful local Groq analysis has not been reported; opening the screen does not verify inference.
- Reviewed existing extraction code and roadmap after the user prioritized URL input and a readable summary.
- Created a proposed staged plan: supported-source fetching, sourced richer analysis, result UI and source/security/browser verification. No application code was changed and URL support is not implemented.

## 2026-10-07 — Official NAV URL import and redesigned workspace

Implemented on `feat/job-url-import`, pending merge: supported Arbeidsplassen URL validation, official NAV API adapter with public experiment token, active-record/plain-text normalization, bounded HTTP requests, review-before-AI flow and manual fallback. FINN and Arbeidsplassen website scraping are excluded following their terms; NAV’s API excludes FINN-origin ads. Live API response uses `ad_content`, verified and reflected in fictional fixtures.

At the user’s request, redesigned the interface with an input/results workspace, readable quotation cards, requirement counts, source evidence, mobile stacking and Norwegian/English copy. Added TanStack Query and official shadcn/ui components with Tailwind/Lucide; recorded the development rule in AGENTS.md and ADR-0009. No automatic AI retries, persisted content, fake scores or new routing framework.

Validation: 25 backend tests passed; frontend production build and TypeScript check passed; 12 Playwright tests passed (AI outcomes mocked or key disabled); production dependency audit reported zero vulnerabilities. Live official NAV import returned title, canonical source and 4,510 characters of normalized text. Desktop and mobile synthetic result screenshots inspected. No new live Groq analysis was required; Groq Browser Search feasibility remains unverified, and documentation requests returned HTTP errors. GitHub Actions execution is not independently verified here.

Remaining: richer sourced summary/responsibilities/metadata, Browser Search assessment, consumer registration and feed removal compliance before persistent discovery, identity/storage and candidate matching. Local test screenshots/source data stay outside Git.

## 2026-10-07 — FINN Browser Search support

Confirmed PR #5 is merged into main (`acfd4d1`); started `feat/finn-browser-search` from updated main. The user's modern FINN URL was previously rejected by the NAV-only adapter. Added a separate AdvertisementBrowser port and bounded Groq GPT-OSS browser_search adapter using the existing backend key. Parse only exact-link browser.open tool output; discard generated answers/reasoning. Label provider excerpts explicitly before and after analysis, retain source review/manual paste and handle provider/configuration/quota failures.

No new dependencies, frontend secrets, direct FINN scraper, plan upgrades or paid fallback. Search is enabled by default for this requested local pilot, with 10 attempts per process (failures count); structured analysis retains its separate 20-attempt limit. Browser Search cannot use structured outputs in the same call. Source freshness/completeness and production reuse/billing guarantees remain unresolved.

Validation: 34 backend tests passed; production frontend build and TypeScript check passed; 15 Playwright tests passed with mocked provider results or the backend key disabled. Live Groq API investigation returned exact-page tool source output. A live browser request through Next.js and Spring Boot imported the user-supplied FINN link as AI Engineer - Tieto Banktech, with 6,789 characters of source context and visible provenance notice; screenshot reviewed. The subsequent structured analysis remains covered by existing tests and was not rerun live in this delivery. GitHub Actions status is not independently verified.

Documentation: updated README, flows/stories, source domain/architecture/security, Groq/local run guides, decisions/open questions/roadmap and ADR-0010. Local Mac Java discovery instructions added following the reported new-terminal runtime error. Real source responses and screenshots remain outside Git.

## 2026-10-07 — Compact requirement cards and inspectable details

Confirmed FINN support is merged as PR #6 (`1dbe75e`); started feat/compact-requirement-details from updated main. Replaced the long repeated quote list with compact tiles grouped by required/preferred/unclear status and count filters. Added the official shadcn Dialog with translated close controls, original quote, deterministic category guidance and surrounding exact submitted-source context. Long titles are clamped visually but retained in the accessible name and detail title. No additional model request or backend extraction change.

Validation: production frontend build and TypeScript check passed; 17 Playwright tests passed, including filters, source context, quote display, Enter/Escape/focus restoration, English/Norwegian close labels, long mobile titles and empty filters. Production npm audit reported zero vulnerabilities. Synthetic desktop result/dialog screenshots reviewed. Backend suite was not rerun because backend code is unchanged; E2E exercised the existing backend jar with its Groq key disabled. No live Groq request made. GitHub Actions status is not independently verified.

Consolidated ROADMAP.md into actual status and the next three recommended deliveries: identity/storage/manual profile → CV upload and claim confirmation → matching and CV recommendations. Documented that original/template upload precedes arbitrary layout preservation and artifact export. Updated flows, stories, architecture, decisions and pilot testing instructions. The shadcn/TanStack rule remains in AGENTS.md. PostgreSQL/auth/profiles/CV upload remain unimplemented.

## 2026-10-07 — Direct URL analysis and job overview

Implemented one-action retrieval/analysis, source-backed variable overview cards in Norwegian/English, and published NAV metadata in normalized source text. Added invalid-fact/evidence checks and browser flow tests. Raised the bounded completion limit from 2,200 to 3,500 tokens to accommodate facts plus requirements; existing call quotas remain. Local validation results are recorded below after execution. Private profiles remain pending.

Validation: 37 backend tests passed; frontend production build/type check passed; 19 Playwright tests passed against the real local frontend/backend with mocked AI success responses and real validation/configuration errors. No live model quality or GitHub Actions claim. Result layout uses the full content width after analysis.

## 2026-10-07 — PostgreSQL foundation

Added opt-in persistence configuration, pinned PostgreSQL Compose, Flyway identity/profile migration and Testcontainers migration/integrity tests. No profile API/UI or private AI processing added. Testing exposed a Testcontainers tag-plus-digest parsing incompatibility; test image uses digest-only naming for the same official artifact. Validation results follow after execution.

Validation completed: 39 backend tests passed (including two real PostgreSQL tests, no skips), 19 Playwright tests passed, production frontend build/type check passed, Compose started a healthy PostgreSQL 17.11 instance and accepted a SQL request. Temporary Compose resources were removed after validation. One synthetic live Groq request succeeded with 2 requirements and 7 sourced facts after selecting the managed environment's CA trust store. Initial live attempts failed because the temporary JVM lacked the proxy CA trust; no verification bypass was used. No real advertisement/contact data was committed. No GitHub CI result is claimed.

## 2026-10-07 — Local development origins and interactive startup

Reproduced HTTP 403 for a Next development HMR request from 127.0.0.1 with the default server hostname. Added an explicit loopback-only allowedDevOrigins configuration. Disabled analysis fields/actions until React initializes, with localized preparation/no-script feedback, to prevent native form navigation before event handlers are attached. Added real development-server host/origin/mode/submission checks and a delayed-script regression in the production suite. Included Next-generated app-level AGENTS.md instructions to consult the installed framework documentation. This reproduces the origin rejection and mitigates pre-hydration submission; it does not prove every cause of the user's browser startup failure.

Validation: three development-server regression tests passed on Chromium, including both local hostnames and rejection of an unrelated origin. Frontend production build and TypeScript checks passed. All 20 production browser tests passed, including the delayed-script initialization check. AI success responses are mocked; backend code is unchanged and its tests were not rerun. GitHub Actions status is not claimed.

## 2026-10-07 — FINN source format, evidence and rate-limit repair

Reproduced the supplied Azure ad's two-line FINN title suffix and AI quotations omitting Markdown emphasis. Fixed source format handling and omission reporting while preserving exact URL/tool proof. Added Unicode whitespace matching, allowed-kind prompt guidance, provider schema-error mapping, shared observed cooldown/Retry-After propagation, same-source manual retry and sanitized logs.

Before the later rate-limit changes, one real import+analysis of the supplied Azure URL passed (11 requirements, 10 facts, zero omissions). Subsequent cooldown/schema/retry behavior is validated with synthetic/mocked provider responses to avoid consuming the pilot's shared quota. The other supplied ad was not separately retested live. Raw ads, contacts, provider payloads and account identifiers remain outside Git. Full validation results follow after completion; no GitHub CI claim.

Validation: 47 backend tests passed with no skips, including PostgreSQL integration, wrapped-title/source validation, Unicode evidence, partial omission, sanitized provider schema failures and retry headers/cooldown. All 22 production browser tests passed, including same-source retry without another search, plus frontend production build/type check. A health-status test selector was scoped to its component because preparation/cooldown expose separate legitimate status regions. All three development-server regression checks passed on both local hostnames.

## 2026-10-07 — Paced loading and inspectable development diagnostics

Confirmed PR #10 merged into main (`31286e2`); started `feat/analysis-progress-diagnostics` from updated remote main. At the user's request, prioritize the observable URL → analysis → usable result loop before private profile/CV work. Added truthful retrieval/pause/analysis stages, decorative document/card animation, configurable default 10-second FINN pacing and an explicit stop action that retains the source. Resuming respects the remaining pause and does not refetch. Active UI state follows explicit workflow phases so cancellation enables continuation promptly. NAV/pasted text normally skip inter-Groq pacing; existing reactive provider cooldown/manual retry remain.

Added a collapsed development diagnostic panel with labeled stage lights, HTTP status, timings, text/result counts and explicitly expanded received-source inspection. Matching console events use a per-run ID and exclude source bodies, titles, full URLs, contacts, credentials and raw provider payloads. Diagnostics default off in production, can be explicitly enabled at build time, and retain only the current run in memory. No new dependency, backend change, extra AI call, persistent cache, paid upgrade or automatic failure retry.

Validation: 25 production browser tests and five real development-server tests passed, covering 10-second scheduling, no duplicate calls, stop/resume, failed retrieval, mobile/reduced-motion behavior, collapsed source inspection, green/red diagnostics, sanitized console events and both loopback hostnames. Frontend production build and TypeScript check passed. Synthetic loading/diagnostic screenshot inspected; kept outside Git. Backend tests were not rerun because backend code is unchanged; production E2E exercised the existing real backend JAR with its provider key disabled. No live Groq request was made and no account-quota or GitHub Actions success is claimed. A fixed delay cannot guarantee account-wide token availability.

Documentation: DEBUGGING.md provides local inspection/configuration instructions; README, flows/stories, roadmap, decisions, security, Groq/run/pilot guides record the behavior and pilot checkpoint.
