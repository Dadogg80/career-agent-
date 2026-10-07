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
    D -->|Yes| F[Show Groq/Exa excerpt provenance, title, receipt time and editable text]
    F --> G[User checks against original advertisement]
    G --> H[User selects Analyze]
    H --> I[Separate structured Groq requirement extraction]
    I --> J[Quotes validated against the submitted excerpt, provenance remains visible]
```

The excerpt is provider-mediated source context, not the model's generated summary, a complete advertisement guarantee, or independently verified live source data. The website's update time and ad's active status are not established by a successful provider read.

## Compact requirement inspection (implemented, PR merge pending)

Analyze source → view category counts and grouped tiles → optionally filter category → select a requirement → shadcn Dialog with original quote, category guidance and surrounding submitted-source context → close/Escape and return focus to the selected tile. Editing input retains the existing stale-result warning. Browser-excerpt provenance also appears in details. Inspecting/filtering creates no additional provider request.
