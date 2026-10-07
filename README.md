# Career Agent

AI-støttet jobbsøking med etterprøvbar kandidatkunnskap, kompetanseavklaring og brukerens kontroll over søknadsmaterialet.

The application now has a Norwegian/English interface and a Groq-backed pasted-advertisement extraction flow. Candidate profiles, matching, authentication and persistent storage are not implemented yet. See the [pilot test guide](docs/TESTING_PILOT.md) and [run instructions](docs/RUNNING.md).

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
| [docs/DOCKER_STRATEGY.md](docs/DOCKER_STRATEGY.md) | Recommended Docker usage and tradeoffs |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Bekreftede føringer og anbefalinger som ikke er vedtatt |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Uavklarte spørsmål og konsekvenser |
| [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) | Hva som faktisk er gjort og kontrollert |
| [AGENTS.md](AGENTS.md) | Arbeidsregler for utvikling og dokumentasjon |

## Dokumentasjonsprinsipp

Dokumenter beskriver enten krav, forslag eller faktisk implementert atferd. Disse skal skilles tydelig. Ingen foreslått funksjon skal omtales som ferdig uten implementasjon og verifikasjon.

Markdown-filene er prosjektets felles hukommelse. De skal ikke inneholde pilotens CV, private søknader, kontaktopplysninger eller hemmeligheter.

Arkitektur- og domenedokumentene er foreløpige design. ADR-indeksen og beslutningsregisteret viser hva som er vedtatt og hva som fortsatt er foreslått.
