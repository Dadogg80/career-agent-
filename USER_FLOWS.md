# Brukerflyter

Status: Proposed full MVP flows. The full flows below are not implemented. A bounded public-advertisement flow (US-23) is available on feat/job-requirements: paste text → explicitly send to Groq → inspect categories and source quotations → edit/retry. It has no candidate matching or persistence. Story IDs refer to [USER_STORIES.md](USER_STORIES.md).

## 1. Fra første besøk til søknad

```mermaid
flowchart TD
    A[Åpne applikasjonen] --> B[Velg språk: norsk er standard]
    B --> C[Åpne egen profil med riktig tilgang]
    C --> D{Har du kandidatgrunnlag?}
    D -->|Nei| E[Registrer erfaring eller importer master-CV]
    E --> F[Se kilde og gjennomgå påstander]
    F --> G[Bekreft, rediger eller avvis]
    G --> H[Lagre kandidatgrunnlag]
    D -->|Ja| I[Legg til stilling]
    H --> I
    I --> J[Lim inn tekst eller bruk støttet URL]
    J --> K[Kontroller hentet annonse]
    K --> L[Vurder krav mot kandidatgrunnlag]
    L --> M[Se treff, usikkerhet og begrunnelser]
    M --> N{Relevant avklaring?}
    N -->|Ja| O[Svar, korriger, vet ikke eller utsett]
    O --> P[Oppdater godkjent kunnskap]
    P --> L
    N -->|Nei eller utsett| Q{Vil du gå videre?}
    Q -->|Nei| R[Lagre for senere eller marker uinteressant]
    Q -->|Ja| S[Velg dokumentspråk og lag utkast]
    S --> T[Se endringsforslag og kildegrunnlag]
    T --> U[Rediger og godkjenn konkret innholdsversjon]
    U --> V[Generer DOCX og PDF fra støttet mal]
    V --> W[Last ned og send selv i portalen]
    W --> X[Bekreft innsending og dokumentene som faktisk ble brukt]
    X --> Y[Følg status, noter svar og neste handling]
```

Story-dekning: US-01 til US-14. Tilgangsmodellen for den lokale piloten er uavklart; en flerbrukerversjon krever verifisert innlogging og isolasjon.

## 2. Fra dokument til godkjent påstand

```mermaid
flowchart TD
    A[Last opp DOCX eller PDF] --> B{Gyldig og støttet fil?}
    B -->|Nei| C[Vis årsak og tilby manuell registrering]
    B -->|Ja| D[Bevar original og ekstraher innhold]
    D --> E{Ekstraksjon lyktes?}
    E -->|Nei| F[Vis feil og tilby retry eller manuell registrering]
    E -->|Ja| G[Opprett UNVERIFIED påstander med kildereferanser]
    G --> H[Vis konkrete påstander til brukeren]
    H --> I{Brukerens valg}
    I -->|Bekreft| J[Lagre CONFIRMED med bekreftelseshistorikk]
    I -->|Rediger| K[Vis korrigert påstand for bekreftelse]
    K --> H
    I -->|Avvis| L[Lagre REJECTED]
    I -->|Senere| M[Behold UNVERIFIED]
    J --> N[Marker berørte analyser som utdaterte]
```

En brukerbekreftelse er ikke det samme som ekstern dokumentasjon. Kildetype og bekreftelse må vises separat. Avvisning betyr ikke automatisk at kandidaten mangler ferdigheten.

## 3. Kompetanseavklaring

```mermaid
flowchart TD
    A[Krav uten tilstrekkelig dokumentasjon] --> B{Finnes nærliggende erfaring?}
    B -->|Ja| C[Vis INFERRED hypotese og et åpent spørsmål]
    B -->|Nei| D[Vis at erfaring ikke er dokumentert]
    C --> E{Brukerens svar}
    E -->|Beskriver erfaring| F[Vis presis påstand med prosjekt og ansvar]
    F --> G[Brukeren bekrefter eller korrigerer]
    G --> H[Oppdater kunnskapsversjon]
    H --> I[Kjør eller tilby ny analyse]
    E -->|Avviser hypotesen| J[Registrer avvisning uten bredere konklusjon]
    E -->|Vet ikke eller senere| K[Behold usikkerhet og tillat videre arbeid]
```

Brukeren skal kunne vende tilbake til ubesvarte spørsmål. En uavklart hypotese kan ikke brukes som bekreftet erfaring i eksportert materiale.

## 4. Godkjenning og faktisk innsending

```mermaid
flowchart TD
    A[CV- eller tekstforslag] --> B[Vis gammel og ny tekst med grunnlag]
    B --> C{Valg}
    C -->|Avvis| D[Behold tidligere tekst]
    C -->|Rediger| E[Valider korrigert tekst]
    E --> B
    C -->|Godkjenn| F[Bind godkjenning til innholdsversjon]
    F --> G[Generer dokumentartefakter]
    G --> H{Generering lyktes?}
    H -->|Nei| I[Behold godkjenning og vis retry]
    H -->|Ja| J[Last ned konkrete versjoner]
    J --> K[Brukeren sender utenfor applikasjonen]
    K --> L[Bekreft dato og faktisk brukte artefakter]
    L --> M[Status APPLIED med kilde: brukerbekreftelse]
```

Generering eller nedlasting betyr ikke innsending. Hvis brukeren endrer dokumentet eksternt, må løsningen støtte å registrere den endelige filen; ellers merkes eksakt innsendt versjon som ukjent.

## Feil, avbrudd og retur

| Situasjon | Ønsket brukeropplevelse |
| --- | --- |
| URL-henting feiler | Behold URL og tilby innlimt annonsetekst. |
| AI utilgjengelig eller budsjettgrense nådd | Behold brukerdata og tilby senere retry; manuell profil/CRM fungerer videre. |
| Utdrag er feil eller kilder motsier hverandre | Vis avklaring; ikke overskriv bekreftet kunnskap automatisk. |
| Brukeren lukker siden | Lagrede utkast og spørsmål kan gjenopptas; vis hva som eventuelt ikke ble lagret. |
| Kandidatgrunnlag endres | Marker analysen som utdatert; behold tidligere analysehistorikk. |
| Annonse endres eller fjernes | Behold snapshot brukt i analysen og vis kilde/tidspunkt. |
| Godkjent tekst redigeres | Ny innholdsversjon krever ny godkjenning. |
| Dokumentgenerering feiler | Ingen ferdigstatus; bevar utkast og tilby retry. |

## Fremtidig flyt, utenfor MVP

Automatisk discovery fører inn i «Legg til stilling». Browser-assistent kan senere erstatte den manuelle portalhandlingen, men må vise endelig innhold og dokumenter før eksplisitt godkjenning av innsending. Intervju og oppfølging bygger på søknadssaken og det faktisk sendte materialet.

## Implemented pilot flow: URL review and requirement extraction

```mermaid
flowchart TD
    A[Open job analysis: Norwegian or English] --> B{Input method}
    B -->|Arbeidsplassen URL| C[Validate URL and request official NAV API]
    C -->|Active supported advertisement| D[Show title, source link, retrieval time and editable text]
    C -->|Unsupported, absent, inactive or unavailable| E[Keep URL and offer Paste text]
    E --> F[Paste advertisement text]
    B -->|Paste text| F
    D --> G[User reviews text]
    F --> G
    G --> H[User selects Analyze]
    H --> I[Bounded Groq extraction]
    I --> J[Show required, preferred and unclear requirements with quotes]
    J --> K[Inspect source evidence]
    J -->|Edit source text| L[Mark result outdated]
```

The pilot does not save input or results across reload. NAV URL import makes no AI call. FINN import uses one Groq Browser Search API call before review, with its own bounded attempt limit. A fetched page is never automatically sent to Groq; the user reviews normalized text first. API-returned application links are not fetched. The current interface does not offer automated submission or personal match scores.

## FINN source branch

```mermaid
flowchart TD
    A[Paste modern FINN job URL] --> B[Validate and canonicalize exact advertisement link]
    B --> C[Bounded Groq Browser Search]
    C --> D{Exact browser.open source result available?}
    D -->|No| E[Keep URL, explain error and offer pasted text]
    D -->|Yes| F[Retain exact source context and show retrieval complete]
    F --> G[Show configurable pause countdown]
    G --> H{Stopped before analysis?}
    H -->|Yes| K[Keep source for manual continuation]
    H -->|No| I[Separate structured Groq requirement extraction]
    I --> J[Quotes validated against the submitted excerpt, provenance remains visible]
```

The excerpt is provider-mediated source context, not the model's generated summary, a complete advertisement guarantee, or independently verified live source data. The website's update time and ad's active status are not established by a successful provider read.

## Compact requirement inspection (implemented, PR merge pending)

Analyze source → view category counts and grouped tiles → optionally filter category → select a requirement → shadcn Dialog with original quote, category guidance and surrounding submitted-source context → close/Escape and return focus to the selected tile. Editing input retains the existing stale-result warning. Browser-excerpt provenance also appears in details. Inspecting/filtering creates no additional provider request.

## Direct URL analysis and sourced job overview (2026-10-07)

Selecting **Analyze link** retrieves and analyzes the public advertisement in one action. FINN retrieval is followed by a configurable 10-second pause before structured analysis; NAV normally skips it. The previous mandatory import/review step is superseded by the product owner's explicit instruction. Manual pasted text remains editable. Retrieval and analysis each keep their existing concurrency, quota, validation and error boundaries; there are no automatic retries. If analysis fails after retrieval, the text remains available for retry without another search.

The overview contains up to ten useful, variable facts: employer description, role/responsibilities, deadline, location/work model, contacts, benefits, salary or application process when explicitly present. Every fact carries a verbatim source quote. Missing data is omitted with an explicit notice rather than guessed. Quote membership validation establishes provenance, not semantic correctness of the AI's paraphrase. Browser excerpts can still be partial/stale; this limitation and the original link remain visible. Full source text is expandable, not a required intermediate screen. Requirement tiles/details remain unchanged.

No candidate matching, private profile storage or company research is implied by this overview. All extracted facts are AI suggestions from the advertisement. Existing source quotes and optional source review remain available; older mandatory review instructions do not apply to this flow.

## Client initialization boundary

Initial server-rendered analysis controls are disabled until React initializes. Then mode selection and URL/text submission are enabled. Submissions run through TanStack mutations and prevent native document navigation. Failed retrieval/analysis keeps input and displays a mapped error. No advertisement, profile or API key is persisted in browser storage by this change.

## Evidence failures and free-tier retries

A valid FINN browser excerpt may have a wrapped site title; presentation emphasis is normalized before analysis. Valid independently cited cards remain visible if another suggestion lacks source evidence, with a visible omission notice. Entirely unsupported or malformed results still fail closed.

After a provider token-rate rejection, show a bounded countdown and keep the URL/text. A manual retry for the same retrieved URL analyzes the current text without a new browser search. Different URLs fetch fresh content. No automatic retries are made; process call limits and exact-source checks remain. Switching input mode/reading/editing remain available during a reactive quota cooldown. Controls are disabled during the active retrieval/pacing/analysis sequence; the explicit Stop action is available during pacing.

## Development inspection and paced loading

Submit URL → retrieval status → received-source success → FINN pause/countdown (or skipped for NAV) → analysis status → sourced overview and compact requirement cards. Stopping during the pause retains the source and cancels the scheduled analysis; same-URL continuation respects any remaining pause. There is no invented progress percentage or model call for the decorative animation.

Development: open the DEV edge tab on the right to reveal the shadcn Sheet → inspect labeled green/yellow/red/gray stage lights, HTTP status, elapsed time and counts → optionally expand the received source text. Console shows the same sanitized events under `[Career Agent]`; no source bodies or provider secrets are logged. Reload clears in-memory state. Diagnostics are hidden in production unless explicitly enabled before build. See docs/DEBUGGING.md.

## Implemented basic profile flow (US-28; current branch)

```mermaid
flowchart TD
  Open[Open Min profil] --> Config{Identity + persistence available?}
  Config -->|No| Disabled[Show unavailable; public analysis remains accessible]
  Config -->|Yes| Login[Sign in through local Keycloak / PKCE]
  Login -->|Rejected| Failed[Show mapped login failure]
  Login -->|Verified session| Read[Load own profile or empty form]
  Read --> Edit[Edit name + preferred language]
  Edit --> Save[Explicit save with CSRF + revision]
  Save -->|Success| Stored[Saved revision; reopen from PostgreSQL]
  Save -->|Stale revision| Conflict[Keep draft; offer loading saved version]
  Conflict -->|User chooses| Read
  Stored --> Logout[Sign out of application; invalidate session]
```

The form supports Norwegian/English. Ownership is never selected by the browser. Unauthenticated/expired sessions cannot read or write a profile. App restart requires sign-in again, while saved data remains. This initial flow covers the basic profile; reviewed claims and local CV import are added by the implemented flow below. Personal matching remains future work. Setup is in docs/IDENTITY_SETUP.md. Proposed full MVP flows above remain future work.


## Current branch: source overview, reviewed competencies and CV import

```mermaid
flowchart TD
    URL[Submit job URL] --> Fetch[Receive source excerpt]
    Fetch --> Analyze[Structured AI analysis]
    Analyze -->|Valid sourced items| Overview[Employer + collapsible role/applicant/offers]
    Analyze -->|AI failure| Raw[Display received advertisement with unstructured status]
    Overview --> Metadata[Location + contact + deadline + other facts]
    Metadata --> Requirements[Existing requirement filters and detail cards]
    Raw --> Retry[Manual analysis retry using the same source]
    SignIn[Sign in and save profile] --> Upload[Upload original DOCX/PDF locally]
    Upload --> Inspect[Inspect extracted text / select master CV]
    Inspect --> Select[Select exact source quote and describe own contribution]
    Select --> Unverified[Save UNVERIFIED claim]
    SignIn --> Manual[Enter manual competency and source/context]
    Manual --> Unverified
    Unverified --> Review[Inspect and explicitly confirm / reject]
    Review --> History[Store revision snapshot and action]
    History --> Edit[Edit content]
    Edit --> Unverified
```

Contact always has a slot, with an honest not-identified state when analysis does not supply it. A failed analysis never replaces available source text with an empty result screen. No private profile/CV material is sent to Groq. Source selection creates a proposal, not confirmed truth. Permanent document deletion explains retained claim quotes; permanent claim deletion removes its history. Login/session expiry, revision conflicts, malformed/oversized files, encrypted PDFs and empty/scanned text have visible states. See docs/CV_IMPORT.md for the bounded import scope.
