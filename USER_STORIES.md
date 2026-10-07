# User stories

Status: Working stories. US-23 is implemented for a bounded local test on feat/job-requirements. The original profile/matching stories are not complete. P0 targets the first useful delivery, P1 the proposed complete MVP and P2 later improvements. Acceptance criteria are requirements; the development log records actual validation.

## Current pilot slice

### US-23 — Inspect an advertisement with source quotations (P0)

As a jobseeker, I want to paste a public advertisement and inspect AI-extracted requirements, so that I can understand the role before a candidate profile is available.

- Support Norwegian and English, explicit required/preferred/unclear categories and source quotations.
- Validate that every quotation occurs in the source and show that labels/categories are AI suggestions.
- Retain input on error and mark results as stale after source edits.
- Explain external Groq processing before submission. Do not persist data or generate a candidate score.
- Limit input, output, concurrent inference and attempts; do not enable a paid fallback.
- A real browser call must reach the backend through the proxy; tests with no configured key must make no provider calls.

This slice does not replace the persistence, ownership or matching requirements of US-04/US-05.

## Første nyttige leveranse

### US-01 — Norsk og engelsk (P0)

Som jobbsøker vil jeg bruke applikasjonen på norsk eller engelsk, slik at jeg forstår arbeidsflyten.

- Norsk bokmål er standard; engelsk kan velges og valget beholdes.
- Navigasjon, sentrale skjemaer, feil og statusmeldinger finnes på begge språk.
- Språkbytte endrer ikke lagrede fakta eller dokumentspråk.

### US-02 — Egen kandidatprofil (P0)

Som jobbsøker vil jeg registrere arbeid, prosjekter, utdanning og preferanser, slik at vurderinger bygger på min historie.

- Jeg kan opprette og korrigere erfaring med periode, rolle og ansvar.
- Arbeidsgiver, kunde og prosjekt kan skilles.
- Data har eksplisitt eierskap; flerbrukertilgang skal avvise andre brukeres lesing og skriving.
- Preferanser behandles separat fra erfaringspåstander.

### US-03 — Bekrefte konkrete påstander (P0)

Som jobbsøker vil jeg se og kontrollere hva systemet mener jeg har gjort, slik at historien blir korrekt.

- Hver påstand viser tekst, status, kontekst og kilde eller bekreftelsesgrunnlag.
- Jeg kan bekrefte, redigere, avvise eller utsette.
- Gruppebekreftelse viser hele gruppens innhold og omfatter ikke skjulte inferenser.
- Endringer får revisjonshistorikk; ingen AI-kjøring bekrefter sin egen inferens.

### US-04 — Legge inn en stilling (P0)

Som jobbsøker vil jeg lime inn en annonse og eventuelt kilde-URL, slik at jeg kan vurdere jobben uten en kildeintegrasjon.

- Tekstimport fungerer uavhengig av URL-henting.
- Jeg kan kontrollere og korrigere annonsegrunnlaget før analyse.
- Annonsesnapshot med kilde og registreringstidspunkt bevares.

### US-05 — Begrunnet stillingsvurdering (P0)

Som jobbsøker vil jeg forstå treff og usikkerhet per krav, slik at jeg kan avgjøre om stillingen er relevant.

- Må-krav og ønskede krav skilles når annonsen gir grunnlag for det.
- Vurderinger viser relevant erfaring, kontekst og kildereferanser.
- Manglende dokumentasjon merkes som ukjent eller må avklares, ikke automatisk som et gap.
- Analysen registrerer brukt annonse- og kunnskapsversjon.
- Anbefalinger forklares uten å fremstille en score som sannsynlighet for intervju.

### US-06 — Avklare relevant erfaring (P0)

Som jobbsøker vil jeg få målrettede spørsmål om nærliggende erfaring, slik at oversett kompetanse blir dokumentert.

- Spørsmål viser hvorfor avklaringen er relevant og starter uten å forutsette erfaring.
- Jeg kan svare, avvise, velge «vet ikke» eller utsette.
- Et svar omformes til en konkret påstand som jeg kan bekrefte eller korrigere.
- Ny godkjent kunnskap kan brukes i ny analyse; tidligere analyser beholdes.
- Ubesvarte spørsmål hindrer ikke resten av jobbsøkingen.

### US-07 — Lagre stillingen og egen vurdering (P0)

Som jobbsøker vil jeg lagre eller avvise en stilling, slik at jeg slipper å vurdere den fra bunnen av senere.

- Lagret stilling beholder annonse, analyse og egne notater.
- Jeg kan markere den som vurderes, lagret eller uinteressant.
- Jeg kan åpne saken og fortsette arbeidet senere.

## Komplett foreslått MVP

### US-08 — Importere master-CV (P1)

Som jobbsøker vil jeg importere DOCX/PDF, slik at jeg slipper å registrere alt manuelt.

- Originalfilen bevares og overskrives ikke.
- Ekstraherte påstander blir UNVERIFIED med referanser til dokumentet.
- Fil- og ekstraksjonsfeil gir forståelige meldinger og manuell fallback.
- Filstørrelse og støttet format valideres før behandling.

### US-09 — Velge språk på søknadsmaterialet (P1)

Som jobbsøker vil jeg velge norsk eller engelsk per søknad, uavhengig av grensesnittet.

- Jeg velger dokumentspråk eksplisitt; annonsebasert forslag kan overstyres.
- Oversettelse endrer ikke ansvar, erfaring, resultater eller kildegrunnlag.
- Språkvalget registreres på innholds- og dokumentversjonene.

### US-10 — Godkjenne CV-endringer (P1)

Som jobbsøker vil jeg se konkrete CV-endringer og grunnlaget deres, slik at jeg beholder kontroll over fremstillingen.

- Gammel og foreslått tekst vises sammen med grunnlag.
- Jeg kan godkjenne, redigere eller avvise hvert forslag.
- Faktapåstander bruker bare godkjent kandidatgrunnlag og overdriver ikke ansvaret.
- Godkjenning bindes til innholdsversjonen; senere endringer krever ny godkjenning.

### US-11 — Lage søknadstekst (P1)

Som jobbsøker vil jeg få et relevant utkast som jeg kan redigere, slik at søknaden uttrykker min erfaring og motivasjon.

- Utkastet bygger på annonsen og godkjent kandidatgrunnlag.
- Manglende motivasjon avklares eller vises som uavklart; systemet finner den ikke på.
- Jeg kan redigere og godkjenne teksten, og godkjent versjon bevares.
- Tekst sendes ikke automatisk.

### US-12 — Eksportere en CV-versjon (P1)

Som jobbsøker vil jeg laste ned godkjent CV som DOCX/PDF, slik at jeg kan bruke den i søknaden.

- Eksport bruker en støttet mal og den godkjente innholdsversjonen.
- Original master-CV bevares; nye artefakter har egne identiteter og knyttes til saken.
- Genereringsfeil gir retry og ingen falsk ferdigstatus.
- DOCX og PDF kontrolleres med realistisk norsk/engelsk innhold og sideskift.

### US-13 — Registrere faktisk innsending (P1)

Som jobbsøker vil jeg registrere hvilke dokumenter jeg faktisk sendte, slik at intervju og oppfølging bygger på riktig materiale.

- Generert eller nedlastet materiale endrer ikke saken automatisk til APPLIED.
- Jeg bekrefter dato og brukte dokument- og tekstversjoner.
- Hvis jeg endret filen eksternt, kan jeg registrere endelig fil; ellers vises innsendt versjon som ukjent.
- En ny CV-versjon endrer ikke koblingen til en tidligere innsending.

### US-14 — Følge søknaden (P1)

Som jobbsøker vil jeg se søknadsstatus, historikk og notater, slik at jeg har oversikt.

- Første forslag til statussett: SAVED, PREPARING, READY_TO_APPLY, APPLIED, INTERVIEW, OFFER, REJECTED, WITHDRAWN.
- Statusendringer registrerer tidspunkt og hvem eller hva som oppga endringen.
- Jeg kan registrere frist, kontakt og neste handling manuelt.
- Kontaktnotater sendes ikke til mottakere automatisk.

### US-15 — Eksportere og slette egne data (P1, før ekstern pilot)

Som jobbsøker vil jeg kunne hente ut og slette mine data, slik at jeg har kontroll over personopplysningene mine.

- Eksport inkluderer strukturert profil og tilhørende dokumenter i dokumentert format.
- Sletting omfatter dokumenter og avledede data; backup-policy forklares.
- Sletting krever eksplisitt bekreftelse og gir en kontrollerbar sluttilstand.
- Data fra andre brukere inngår aldri i eksport eller sletting.

### US-16 — Gjenoppta etter feil eller avbrudd (P1)

Som jobbsøker vil jeg fortsette der jeg slapp, slik at feil eller lukket nettleser ikke ødelegger arbeidet.

- Lagrede utkast, avklaringer og godkjenninger kan åpnes igjen.
- AI-feil bevarer brukerdata og viser tydelig retry-mulighet.
- Budsjettgrenser stopper nye betalte kall uten å blokkere manuell profil og CRM.
- Restart fører ikke til dupliserte bekreftelser eller tap av godkjent innhold.

## Senere forbedringer

| ID | User story | Forutsetning |
| --- | --- | --- |
| US-17 | Som jobbsøker vil jeg importere en støttet annonse-URL for å spare tid. | Tilgang og bruksvilkår avklart; tekstfallback beholdes. |
| US-18 | Som jobbsøker vil jeg få nye relevante stillinger uten duplikater. | Kildeintegrasjoner, preferanser og deduplisering. |
| US-19 | Som jobbsøker vil jeg forberede intervju fra materialet jeg faktisk sendte. | Pålitelig innsending og dokumentkoblinger. |
| US-20 | Som jobbsøker vil jeg få hjelp til portalutfylling og selv godkjenne innsending. | Sikker browser-worker og kontroll av sluttinnhold. |
| US-21 | Som jobbsøker vil jeg se kompetansemønstre i mine relevante annonser. | Tilstrekkelig datagrunnlag og tydelig avgrensning av utvalget. |
| US-22 | Som kandidat vil jeg delegere avgrenset tilgang til en veileder. | Organisasjonsmodell og eksplisitt samtykket tilgang. |

P2-stories trenger detaljerte akseptansekriterier før implementasjon.

## Implemented slice: US-17 source import and readable analysis

As a jobseeker, I can import an individual Arbeidsplassen advertisement available through NAV’s official API, review its text and request cited requirement extraction.

Acceptance criteria implemented:
- URL input is the default, with a Paste text alternative.
- Only supported HTTPS advertisement paths are accepted; tracking parameters are removed from the displayed canonical source.
- Active API records return plain text, title, source link and retrieval timestamp; inactive/missing records fail safely.
- Import does not invoke AI. Analysis requires an explicit button press.
- Unsupported and unavailable sources retain the URL and explain the manual alternative in Norwegian/English.
- Responsive input/results columns, requirement counts and quotation cards make the result scannable.
- Editing the source marks the existing analysis outdated. Source evidence reflects the text actually analyzed.

Remaining: richer overview metadata/responsibilities/summary, saved jobs and immutable persisted snapshots. FINN access is covered by the following slice.

## FINN import acceptance criteria

- Modern HTTPS FINN job links route to Groq Browser Search instead of the unsupported-source error.
- URL query/fragment tracking is removed before sending to the provider; credentials, unrelated hosts, non-job paths and unsafe ports are rejected.
- Exact URL match is required in both the browser.open arguments and numbered source output. Search snippets, unrelated pages and generated final answers cannot become imported advertisement text.
- Source excerpt provenance, potential incompleteness/staleness and the original link remain visible in Norwegian/English before analysis and with its results.
- Missing configuration, disabled search, provider rate limits, budget exhaustion and unavailable evidence preserve input and offer a manual alternative.
- No automatic analysis, retries, paid fallback, login or application submission.

## Inspect compact requirements

As a jobseeker, I can scan grouped requirement tiles and open an individual requirement to understand its source and category without reading a long repeated list.

Acceptance criteria implemented:
- Category filters show real counts and pressed state; empty categories explain their empty state.
- Compact cards display category, label and a clear details action. Long titles are visually clamped; the full label remains accessible and appears in details.
- The shadcn Dialog shows the original quote, a deterministic explanation of the AI-suggested category, and surrounding exact submitted-source text (normalized whitespace, marked clipping).
- Keyboard Enter opens, Escape closes and focus returns to the tile; close labels are Norwegian/English.
- Stale-result and Groq/Exa provenance remain visible in details.
- Filtering/opening details adds no AI call. No candidate matching or AI-generated technical explanation is implied.

## Direct URL analysis and sourced job overview (2026-10-07)

Selecting **Analyze link** retrieves the public advertisement and immediately analyzes the retrieved text. The previous mandatory import/review step is superseded by the product owner's explicit instruction. Manual pasted text remains editable. Retrieval and analysis each keep their existing concurrency, quota, validation and error boundaries; there are no automatic retries. If analysis fails after retrieval, the text remains available under Paste text for retry without another search.

The overview contains up to ten useful, variable facts: employer description, role/responsibilities, deadline, location/work model, contacts, benefits, salary or application process when explicitly present. Every fact carries a verbatim source quote. Missing data is omitted with an explicit notice rather than guessed. Quote membership validation establishes provenance, not semantic correctness of the AI's paraphrase. Browser excerpts can still be partial/stale; this limitation and the original link remain visible. Full source text is expandable, not a required intermediate screen. Requirement tiles/details remain unchanged.

No candidate matching, private profile storage or company research is implied by this overview. All extracted facts are AI suggestions from the advertisement. Existing source quotes and optional source review remain available; older mandatory review instructions do not apply to this flow.
