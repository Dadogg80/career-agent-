# Foreslått roadmap

Status: Implementasjon av første grunnmur er startet. Leveransenes detaljer er fortsatt arbeidsforslag; ingen datoer er lovet. Se [beslutningsregisteret](docs/DECISIONS.md).

## Grunnmur — første avgrensede endring

Norsk/engelsk startside, Spring Boot-status, frontend/backend-forbindelse og test-/build-oppsett. Dette er forarbeid til US-01, ikke hele språkkravet for framtidige skjermer. Profil, auth, PostgreSQL og AI inngår ikke i denne endringen.

## Leveranse 1 — Vurder en stilling

### Current incremental delivery

Pasted-advertisement extraction is implemented on `feat/job-requirements` with Groq and a Norwegian/English UI. This intentionally precedes the private-profile/database slice so the pilot can evaluate AI on public text. Candidate matching, persistent snapshots, profile isolation and clarification workflows remain unfinished. US-04/US-05 are not complete.

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
