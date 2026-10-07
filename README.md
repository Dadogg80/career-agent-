# Career Agent

AI-støttet jobbsøking med etterprøvbar kandidatkunnskap, kompetanseavklaring og brukerens kontroll over søknadsmaterialet.

The application now has a Norwegian/English interface and official NAV API URL import, a redesigned shadcn/ui workspace, and Groq-backed advertisement extraction. Candidate profiles, matching, authentication and persistent storage are not implemented yet. See the [pilot test guide](docs/TESTING_PILOT.md) and [run instructions](docs/RUNNING.md).

Supported links are individual `https://arbeidsplassen.nav.no/stillinger/stilling/<uuid>` advertisements available in NAV’s API. FINN links in the form `https://www.finn.no/job/ad/<id>` are supported separately through Groq Browser Search. FINN imports are labeled Groq/Exa source excerpts, which may be incomplete or stale. Selecting Analyze link retrieves and analyzes in one action, with a configurable 10-second pause between FINN calls; source evidence and the original link remain available for inspection. FINN import uses the existing backend GROQ_API_KEY and a separate bounded search quota; other unsupported sources retain the Paste text alternative.

## Lesestart

| Dokument | Innhold |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | Produktvisjon, målgruppe, språk og foreslått MVP |
| [USER_FLOWS.md](USER_FLOWS.md) | Brukerflyt, avklaringer, godkjenning og feiltilstander |
| [USER_STORIES.md](USER_STORIES.md) | Stories med akseptansekriterier og foreslått prioritet |
| [ROADMAP.md](ROADMAP.md) | Foreslåtte leveranser og ferdigkriterier |
| [SECURITY.md](SECURITY.md) | Foreløpige sikkerhets- og personvernkrav |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Systemgrenser, modulansvar, AI og varig arbeid |
| [DOMAIN.md](DOMAIN.md) | Domenebegreper og invarianter |
| [docs/adr/README.md](docs/adr/README.md) | Arkitekturbeslutninger med eksplisitt status |
| [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) | Branches, commits, push og review |
| [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) | Foreslått lokal drift og AI-utprøving på Apple M1 |
| [docs/AI_OPTIONS.md](docs/AI_OPTIONS.md) | AI-kandidater, gratisnivåer og nødvendige kontroller |
| [docs/RUNNING.md](docs/RUNNING.md) | Installasjon, lokal kjøring og tester for første utviklingsversjon |
| [docs/GROQ_SETUP.md](docs/GROQ_SETUP.md) | Sikker deling av Groq-nøkkel og hva som gjenstår |
| [docs/TESTING_PILOT.md](docs/TESTING_PILOT.md) | Local pilot test guide, scope and limits |
| [docs/DEBUGGING.md](docs/DEBUGGING.md) | Staged loading, pacing, source inspection and development diagnostics |
| [docs/DOCKER_STRATEGY.md](docs/DOCKER_STRATEGY.md) | Recommended Docker usage and tradeoffs |
| [docs/NEXT_DELIVERY.md](docs/NEXT_DELIVERY.md) | Proposed URL ingestion and richer job overview delivery |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Bekreftede føringer og anbefalinger som ikke er vedtatt |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Uavklarte spørsmål og konsekvenser |
| [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) | Hva som faktisk er gjort og kontrollert |
| [AGENTS.md](AGENTS.md) | Arbeidsregler for utvikling og dokumentasjon |

## Dokumentasjonsprinsipp

Dokumenter beskriver enten krav, forslag eller faktisk implementert atferd. Disse skal skilles tydelig. Ingen foreslått funksjon skal omtales som ferdig uten implementasjon og verifikasjon.

Markdown-filene er prosjektets felles hukommelse. De skal ikke inneholde pilotens CV, private søknader, kontaktopplysninger eller hemmeligheter.

Arkitektur- og domenedokumentene er foreløpige design. ADR-indeksen og beslutningsregisteret viser hva som er vedtatt og hva som fortsatt er foreslått.

### Direct job analysis

Select **Analyser lenke / Analyze link** to retrieve and analyze a supported public URL in one action. The result includes useful sourced overview facts and compact requirement tiles. Open fact evidence or requirement details as needed; full source text remains expandable. Missing metadata is omitted, and browser excerpts remain explicitly labeled as potentially partial/stale. Private profile/CV features are not yet available.

### Optional persistence foundation

PostgreSQL Compose and Flyway migrations are available behind the `persistence` Spring profile. See [local PostgreSQL setup](docs/POSTGRES_SETUP.md). The backend test suite now requires Docker for real migration/integrity tests. Public advertisement startup remains database independent; profile login/API/UI are still pending.

### Rate limits and retries

A fresh FINN analysis uses browser retrieval followed by structured extraction. These calls share the Groq account/model quota with Playground and other clients. The application shows a bounded provider cooldown. A manual retry for the same fetched URL reuses the current text instead of repeating browser search. Source-unsupported suggestions are omitted with a visible count; wholly unsupported or invalid results still fail. See ADR 0012 and docs/GROQ_SETUP.md.

The frontend now shows retrieval → pause → analysis with honest loading statuses and a decorative animation. Development includes a collapsed diagnostic panel with status lights, received-source inspection and sanitized console events. Set `NEXT_PUBLIC_ANALYSIS_DELAY_SECONDS` in `apps/web/.env.local` to adjust the default 10-second FINN pause. This does not guarantee quota availability. See [debugging instructions](docs/DEBUGGING.md).
