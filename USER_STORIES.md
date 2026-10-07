# User stories

Status: Stories er arbeidsforslag. Første grunnmur støtter norsk/engelsk på startsiden; ingen story er ferdig som komplett produktflyt. Prioritet P0 gjelder første nyttige leveranse, P1 komplett foreslått MVP, P2 senere forbedring. Akseptansekriterier er krav, ikke rapporterte testresultater.

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
