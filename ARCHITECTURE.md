# Arkitekturgrunnlag

Status: Target architecture with an implemented welcome page, status proxy, and a bounded Groq advertisement extraction flow in jobs/ai. Private-data modules and PostgreSQL remain design. See the [ADR index](docs/adr/README.md) and [pilot test guide](docs/TESTING_PILOT.md).

## Systemgrenser

```mermaid
flowchart TD
    UI[Next.js: norsk og engelsk] --> API[Kotlin / Spring Boot REST API]
    API --> CAREER[Career: claims og evidens]
    API --> JOBS[Jobs og matching]
    API --> APP[Applications: forslag og godkjenning]
    CAREER --> DB[(PostgreSQL)]
    JOBS --> DB
    APP --> DB
    API --> DOC[Documents: metadata og filer]
    DOC --> STORE[Privat filadapter]
    APP --> WORK[Varige bakgrunnsjobber]
    JOBS --> WORK
    DOC --> WORK
    WORK --> AI[AI-adapter og strukturerte resultater]
    WORK --> RENDER[Isolert dokumentbehandling]
```

## Ansvarsdeling

| Modul | Eier | Tillatte avhengigheter |
| --- | --- | --- |
| identity | Identitet og tilgangsbeslutninger | Ingen produktmoduler |
| career | Profil, erfaring, claims, evidens, preferanser og avklaringer | identity; dokumentreferanser gjennom documents-API |
| documents | Originaler, dokumentversjoner og filmetadata | identity |
| jobs | Annonser, snapshots og krav | identity |
| matching | Vurderinger med inputversjoner og begrunnelse | career- og jobs-lesegrensesnitt; ai |
| applications | Søknadssak, innhold, godkjenning og innsending | career, matching og documents gjennom grensesnitt; ai |
| ai | Modelladaptere, resultatvalidering og kjøringsmetadata | Små oppgavekontrakter, ikke vilkårlig tilgang til domenetabeller |

Moduler oppdaterer egne data. Ingen modul endrer en annen moduls JPA-entiteter direkte. Moduloverskridende operasjoner bruker application-API-er. Unngå en stor shared-modul med domeneobjekter som alle kan skrive til.

Frontend eier presentasjon; backend eier autorisasjon og domeneregler. JPA-entiteter eksponeres ikke som REST-responser. Databasemigrasjoner versjoneres; runtime schema auto-update brukes ikke som produksjonsstrategi.

## AI og kvalitet

Arbeidsflyten styres av applikasjonen: ekstraher krav, hent autorisert grunnlag, vurder krav, valider kildehenvisninger og presenter forslag. Modellens svar er upålitelig inntil struktur og domeneregler er validert.

- Ingen direkte databaseskriving fra modellen.
- Ingen privat kandidatminne per capability.
- Lagre prompt-/modellversjon, inputreferanser og kostnadsmetadata uten rå dokumenter i logger.
- Godkjent erfaring skal ikke overdrives under omskriving eller oversettelse.
- Bruk deterministiske doubles for tester av orkestrering og et separat evalueringssett for reell modellkvalitet.
- AI-provider og lokal modellkapasitet er uavklart; ingen betalt tjeneste forutsettes.

## Varig arbeid

Dokumentbehandling og AI-kall kan vare lengre enn en HTTP-request. Registrer jobb og nødvendig domenedata i samme databasetransaksjon. Worker reserverer jobb med tidsbegrenset lease og håndterer retry, timeout og idempotens.

Eksterne kall utføres uten å holde en lang databasetransaksjon åpen. Et crash etter eksternt kall kan gi gjentatt utføring; konsistens og kostnadsgrenser må ta høyde for dette. Ikke lov exactly-once for eksterne effekter.

En prosess som venter på bruker har lagret tilstand og brukerkommandoer; den trenger ikke en kjørende tråd. Kafka og Temporal er ikke forutsatt i MVP.

## API og fremdrift

REST for kommandoer og spørringer. Jobbstatus kan i starten hentes med polling; SSE vurderes dersom behovet oppstår. Ingen WebSocket-avhengighet kreves for første leveranse.

Alle ressursoppslag inkluderer autorisert eierskap. Klientoppgitt owner-ID er aldri alene tilstrekkelig. Konkurrerende oppdateringer håndteres med versjonskontroll slik at gamle skjemaer ikke overskriver nyere bekreftelser.

## Lagring og drift

Lokal pilot er anbefalt, men avhenger av brukerens maskin. Filadapteren må skjule lokal lagring slik at privat object storage kan innføres senere. PostgreSQL er system of record; fulltekst/SQL før eventuell vector-indeks.

Originalfiler er immutable ved redigering. Konto-/dokument-sletting følger en eksplisitt personvernflyt og omfatter avledede data. Miljøsnapshot er ikke backup-strategi for brukerdata og erstatter ikke Git-versjonering.

## Tester før ferdigstatus

- Domeneinvarianter og claim-overganger.
- Integrasjonstester for persistens, autorisasjon og samtidige endringer.
- Restart/retry av varige jobber uten doble domeneresultater.
- E2E for norsk/engelsk, avklaring og versjonsbundet godkjenning.
- Realistiske DOCX/PDF-eksempler og separat kvalitetsvurdering av AI.

Testcontainers er ønsket for PostgreSQL; verifiser Docker-tilgang i faktisk utviklings-/CI-miljø før dette gjøres til et obligatorisk kjørekrav.

## Implemented source and frontend boundaries

`JobImporter` validates supported links and delegates to the `VacancySource` port. `NavVacancySource` uses the official NAV vacancy API via a bounded fixed-host HTTP client, with jsoup only for normalizing its HTML description. API records use `ad_content` (verified live), despite an older example showing `json`. No Playwright scraping, Kafka or workflow infrastructure is needed.

Next.js remains the routing and backend proxy layer. TanStack Query handles service health and import/analysis mutations with no automatic AI retries. shadcn/ui components are committed as source, with Tailwind CSS tokens and a responsive workspace composition. Mutation caches are not persisted and have zero garbage-collection retention after becoming inactive; displayed content remains in component state until reload. See ADR-0009.

## FINN provider-mediated source adapter

`JobImporter` routes validated FINN links to `AdvertisementBrowser`, implemented by `GroqAdvertisementBrowser`. The adapter enables only the documented built-in `browser_search` tool; structured outputs are intentionally absent from this request. The existing structured RequirementExtractor runs only after user review. Parse source text exclusively from exact-link `browser.open` executed_tools output, discard generated content/reasoning, and return `sourceType=GROQ_BROWSER_EXCERPT`. NAV records return `NAV_API`.

The backend communicates only with Groq's fixed HTTPS endpoint. It does not fetch FINN or other provider-returned URLs itself. Local host/path controls do not govern Groq/Exa's internal browsing. Provider access is not a blanket FINN reuse license; production terms assessment remains necessary. See ADR-0010.

## Requirement result presentation

RequirementResults is a client presentation component with category filter state. Each tile uses the official shadcn Dialog/Radix focus handling. Source context is deterministically taken from the exact analyzed snapshot with normalized whitespace and explicit clipping marks; it does not invoke AI. Generic category guidance explains the classification, without inventing role facts or candidate evidence. The backend extraction contract is unchanged.
