# Foreslått roadmap

Status: Implementasjon av første grunnmur er startet. Leveransenes detaljer er fortsatt arbeidsforslag; ingen datoer er lovet. Se [beslutningsregisteret](docs/DECISIONS.md).

## Grunnmur — første avgrensede endring

Norsk/engelsk startside, Spring Boot-status, frontend/backend-forbindelse og test-/build-oppsett. Dette er forarbeid til US-01, ikke hele språkkravet for framtidige skjermer. Profil, auth, PostgreSQL og AI inngår ikke i denne endringen.

## Leveranse 1 — Vurder en stilling

### Current incremental delivery

Pasted-advertisement extraction is merged into main with Groq and a Norwegian/English UI. Candidate matching, persistent snapshots, profile isolation and clarification workflows remain unfinished. US-04/US-05 are not complete.

The user now prioritizes URL input and a clear job summary. The proposed next slice is supported-source ingestion plus a sourced overview; see [NEXT_DELIVERY.md](docs/NEXT_DELIVERY.md). This brings US-17 forward. Identity/persistence still precedes private profiles and saved candidate data.

Stories: US-01–US-07.

- Norsk/engelsk grensesnitt og manuelt kandidatgrunnlag.
- Eierskap og tilgangsmodell for piloten.
- Innlimt annonse, kravbasert analyse og relevante avklaringer.
- Enkel lagring av stilling og eget valg.

Ferdig når piloten kan gjennomføre denne flyten med faktatrofast resultat og gjenåpne lagret arbeid. AI-kjøreform og eventuelle kostnader må være avklart før avhengig implementasjon.

## Leveranse 2 — Forbedre søknaden

Stories: US-08–US-11.

- CV-import med kildegrunnlag og bekreftelse.
- Separat valg av dokumentspråk.
- CV-endringsforslag og søknadstekst med versjonsbundet godkjenning.

Ferdig når piloten kan få godkjent søknadsinnhold uten at ukjent eller inferert erfaring blir fremstilt som fakta.

## Leveranse 3 — Bruk materialet og følg søknaden

Stories: US-12–US-16.

- Malbasert DOCX/PDF-eksport.
- Faktisk innsending, dokumentkoblinger, status og notater.
- Gjenopptak, kostnadsgrenser og personvernfunksjoner.

Ferdig når eksakt materiale kan spores fra godkjenning til brukerbekreftet innsending og søknadssaken kan følges videre. Eksport/sletting og flerbrukerisolasjon skal være verifisert før ekstern pilot.

## Senere prioritering

URL-import kan trekkes frem dersom en kilde er enkel og tillatt å integrere. Automatisk discovery, intervju, browser-assistent, kurs og organisasjonsfunksjoner prioriteres ut fra pilotens erfaringer.

Kafka innføres ved reelt behov for hendelsesdistribusjon. Temporal innføres ved tilstrekkelig kompleksitet i varige arbeidsflyter. Ingen av delene er et MVP-ferdigkriterium i dette forslaget.

## Dokumentasjon per leveranse

Oppdater relevante stories og flyter, før faktisk validering i utviklingsloggen, og registrer nye beslutninger. Ikke marker en leveranse ferdig bare fordi plan eller dokumentasjon er skrevet.

## Current implementation update — URL import and interface

Implemented on `feat/job-url-import`, pending PR merge: official NAV API import of an individual Arbeidsplassen URL, editable source review before AI, canonical source URL/retrieval time, manual fallback, TanStack Query and shadcn/ui workspace with responsive input/results columns. This partially delivers US-17; FINN URL support is added in the subsequent Browser Search slice below; richer role summaries remain pending. No persistent storage, candidate matching or application submission is implied.

Next small delivery: expand the validated AI schema to responsibilities, a short sourced summary and important unknowns, then expose these as readable overview sections. Evaluate Groq Browser Search separately before committing to FINN integration.

## FINN URL slice — implemented, pending PR merge

`feat/finn-browser-search` accepts modern FINN job links through Groq's built-in Browser Search. Only a browser.open tool result for the exact canonical URL is accepted; the model's final summary/reasoning is never imported. Source provenance and incompleteness are visible before and after analysis. Search and structured extraction remain separate calls with separate attempt caps and no automatic retry. No new dependencies or backend website scraper were added.

Next: richer source-backed summaries/responsibilities/metadata, then identity and persistence. Unsupported source access still falls back to pasted text.
