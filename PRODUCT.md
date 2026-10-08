# Produktgrunnlag

Status: Produktvisjonen og eksplisitte brukerføringer er registrert. MVP-avgrensningen nedenfor er et forslag, ikke en implementasjonsbestilling.

## Visjon

Career Agent hjelper jobbsøkeren fra kartlegging av erfaring til stillingsvurdering, søknad, intervju og oppfølging. Alle AI-capabilities bruker samme strukturerte Career Knowledge Base.

Kjernen er å forstå hva kandidaten faktisk har gjort, avdekke relevant erfaring som ikke er dokumentert, og bruke godkjent kunnskap i konkrete jobbsøkeroppgaver.

## Målgruppe og pilot

- Langsiktig: Alle jobbsøkere, på tvers av yrker og kompetansetyper.
- Første pilot: Produkteieren, som bruker løsningen i egen jobbsøking.
- Prioritet: Rask praktisk nytte og minst mulig kostnad.
- Gratis under pilot og testing; senere mulig salg til karriereveiledere og organisasjoner.
- Én pilot gir ikke grunnlag for å hevde at produktet er validert for alle målgrupper.

## Språk

- Norsk bokmål som standard i applikasjonen.
- Engelsk støttes fra første versjon.
- Grensesnittspråk og språk på CV/søknad velges separat.
- Norsk og engelsk kildemateriale kan kombineres uten at oversettelse blir ny erfaring.

## Prinsipper

- Ikke konverter inferens til bekreftet erfaring.
- Manglende dokumentasjon betyr ukjent, ikke automatisk kompetansegap.
- Skill arbeidsgiver, kunde, prosjekt, formell tittel og faktisk ansvar.
- Vis grunnlaget for anbefalinger og behold kildereferanser.
- Brukeren kontrollerer eksportert materiale og konsekvensfulle handlinger.
- Originaler og historiske søknadsartefakter skal bevares gjennom redigering; sletting skal være mulig gjennom en definert personvernflyt.
- PostgreSQL er ønsket system of record. Vector search er retrieval, ikke sannhetskilde.

## Foreslått MVP-løfte

«Forstå en konkret stilling, avklar hvordan din faktiske erfaring passer, lag godkjent søknadsmateriale og hold oversikt over søknaden.»

Foreslått omfang:

1. Kandidatprofil og manuell erfaring.
2. Master-CV-import med gjennomgang av ekstraherte påstander.
3. Innlimt annonse og etter hvert en avgrenset URL-import.
4. Begrunnet vurdering per krav, uten ukalibrert totalscore.
5. Kompetanseavklaringer og ny analyse.
6. CV-forslag, søknadstekst og godkjenning.
7. Én kontrollert eksportmal for DOCX/PDF.
8. Søknadssak med statushistorikk og dokumentkoblinger.

## Utsatt i foreslått MVP

Automatisk job discovery, portalautomatisering, intervjumodul, karrierekurs, avansert analytics, organisasjonsadministrasjon og betaling.

Kafka, Temporal, Redis og pgvector innføres bare når et konkret behov begrunner dem. Ikke alle langsiktige capabilities krever egne tjenester eller autonome agenter.

## Pilotens læringsmål

Undersøk om vurderingene oppleves riktige, om avklaringer avdekker nyttig erfaring, om materialet er faktatrofast, og om brukeren kommer raskere frem til en søknad han vil sende.

Registrer feilaktige eller overdrevne formuleringer som kvalitetsfeil. Antall genererte søknader alene er ikke et mål på produktverdi.

## Confirmed first-export layout decision (2026-10-07)

The owner selected a controlled standard CV template for the first DOCX/PDF export. Uploaded original/master CV files remain immutable sources. Arbitrary DOCX-layout preservation/adaptation follows later and does not block initial export. Keep job-specific content approval and artifact/template versioning; export is not application submission. This decision is recorded, not an implemented export feature.

## Confirmed next-phase defaults (2026-10-07)

The first working pilot runs locally on the owner's Mac; online hosting comes later. Future personal matching may send relevant CONFIRMED competency statements and advertisement text to Groq after preview and approval for each analysis. This does not auto-enable matching, share the whole profile or reuse document-analysis consent. These choices are recorded in DECISIONS.md; implementation remains a separate increment.
