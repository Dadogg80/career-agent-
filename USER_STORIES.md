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

Selecting **Analyze link** retrieves and analyzes the public advertisement in one action. FINN retrieval is followed by a configurable 10-second pause before structured analysis; NAV normally skips it. The previous mandatory import/review step is superseded by the product owner's explicit instruction. Manual pasted text remains editable. Retrieval and analysis each keep their existing concurrency, quota, validation and error boundaries; there are no automatic retries. If analysis fails after retrieval, the text remains available for retry without another search.

The overview contains up to ten useful, variable facts: employer description, role/responsibilities, deadline, location/work model, contacts, benefits, salary or application process when explicitly present. Every fact carries a verbatim source quote. Missing data is omitted with an explicit notice rather than guessed. Quote membership validation establishes provenance, not semantic correctness of the AI's paraphrase. Browser excerpts can still be partial/stale; this limitation and the original link remain visible. Full source text is expandable, not a required intermediate screen. Requirement tiles/details remain unchanged.

No candidate matching, private profile storage or company research is implied by this overview. All extracted facts are AI suggestions from the advertisement. Existing source quotes and optional source review remain available; older mandatory review instructions do not apply to this flow.

## Local interaction reliability

As a pilot user, I can switch between Link and Paste text after the interface initializes, submit by button or Enter, and retain my link while loading, after success and after an error. Before JavaScript initializes, controls are disabled with visible feedback rather than permitting an accidental native form reload. Development works on localhost and 127.0.0.1; unrelated origins remain blocked.

## Evidence failures and free-tier retries

A valid FINN browser excerpt may have a wrapped site title; presentation emphasis is normalized before analysis. Valid independently cited cards remain visible if another suggestion lacks source evidence, with a visible omission notice. Entirely unsupported or malformed results still fail closed.

After a provider token-rate rejection, show a bounded countdown and keep the URL/text. A manual retry for the same retrieved URL analyzes the current text without a new browser search. Different URLs fetch fresh content. No automatic retries are made; process call limits and exact-source checks remain. Switching input mode/reading/editing remain available during a reactive quota cooldown; active workflow controls are disabled until completion or explicit stop during pacing.

## Paced loading and developer inspection (P0 pilot)

As the pilot user, I can see whether retrieval actually succeeded and how the received source becomes an analysis before profile/CV development continues.

- Show truthful retrieval/pause/analysis stages, a default 10-second FINN pause and an actual countdown. The decorative animation makes no AI calls and respects reduced-motion preferences.
- Keep one-action submission; normally skip inter-Groq pacing for NAV/pasted text. Expose a bounded configuration setting rather than hardcoding an unchangeable delay.
- Stop during the pause without sending the analysis request. Retain source and respect the remaining pause when resuming; same-URL continuation must not repeat browser search.
- Provide a collapsible development panel with labeled stage lights, mapped errors/HTTP status, timings, text length and requirement/fact/omission counts. Allow explicit inspection of the actual received source as escaped text.
- Emit sanitized console events with a per-run ID. Never include advertisement bodies/titles/full URLs, contacts, raw provider payloads or secrets. Production diagnostics require explicit opt-in; no persistent debug storage.
- Keep bounded reactive Retry-After handling and manual retry. A fixed pause must not be described as guaranteeing quota availability or as an automatic failure retry.

## US-28 — Sign in and reopen my basic profile

Basic identity/profile merged in PR #12; this is a subset of the planned full candidate profile.

As the local pilot, I want to sign in and save my name and preferred profile language so that a persistent, owned workspace exists before adding career evidence.

Acceptance criteria:
- Use local OIDC authorization code + PKCE; no anonymous/private-data fallback or browser-supplied owner ID.
- Require a verified session for profile reads/writes and CSRF for save/logout. Isolate different subjects and the same subject under different issuers.
- Save/reopen name and nb/en language with explicit revision checks; retain the draft on conflict until the user loads the saved version.
- Show honest unavailable/login-failure/session-expiry states. Support Norwegian-first and English UI.
- Keep private profile data and auth material out of AI calls, diagnostics and browser persistent storage.
- Explicitly mark experience, competencies, CV and matching as future increments.

## Diagnostics presentation update

The diagnostic surface is a hidden, nonmodal right-side shadcn Sheet with a visible DEV edge tab. Preserve the existing event/source boundaries; support keyboard opening, translated close, Escape/focus restoration, narrow viewports and reduced motion. Opening the panel makes no new provider call.


## US-29 — Review my own competency statements

Implemented on this branch, PR merge pending. As the pilot I can create a competency with own contribution, context and source; inspect and separately confirm/reject it; edit it back to UNVERIFIED; inspect prior revision snapshots; and permanently delete it and all history. Expected revisions prevent stale confirmation. Other identities/issuers cannot access it. INFERRED creation and automatic discovery remain future work.

## US-30 — Import an original CV and source my competencies

Implemented local slice on this branch, PR merge pending. Upload bounded DOCX/PDF, choose nb/en document language, retain/download identical original bytes, select a master and inspect local extracted text. Selecting an exact excerpt and describing my contribution creates a source-linked UNVERIFIED claim for subsequent review. Upload itself makes no AI call; optional reviewed-preview AI analysis is described in US-32. Malformed, encrypted, oversized and scanned documents have honest outcomes. Deletion requires approval and explains retained claim source quotes. OCR, automatic confirmation, layout-preserving generation and production storage remain outside this slice.

## US-31 — Read an advertisement even when AI structuring fails

Implemented on this branch, PR merge pending. After source retrieval succeeds, AI failure still shows the title/link and received source text; a manual retry reuses that source. A successful analysis groups employer text, role/applicant/offers, stable practical metadata slots and existing requirement filters. Narrative text uses source wording, not AI-written marketing summaries. Unknown contact details are explicit; no names are invented. Opening details makes no model calls. Both languages and mobile/desktop layouts are covered.

## US-32 — Summarize competencies across my uploaded documents

As the pilot I can choose a single document or all readable CVs/attestations/certificates, inspect/edit what will be sent, approve one bounded Groq call and reopen a privately stored source-backed competency summary. Every proposal identifies its actual source quote/document. Missing text and limited excerpts are visible; mismatched quotes are omitted rather than invented. Suggestions do not change my profile until I explicitly review/edit/save an UNVERIFIED claim; confirmation remains separate. Failures preserve the preview and previous analysis with manual retry and quota feedback. Upload/deletion invalidates combined summaries. Other subjects/issuers cannot read or analyze my sources. Norwegian/English and mobile presentation are supported.
