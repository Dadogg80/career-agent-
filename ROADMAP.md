# Foreslått roadmap

Status: Forslag. Ingen implementasjon er startet, og ingen datoer eller leveranser er lovet. Se [beslutningsregisteret](docs/DECISIONS.md) for hva som er bekreftet.

## Leveranse 1 — Vurder en stilling

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
