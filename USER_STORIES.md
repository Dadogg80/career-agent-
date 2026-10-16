# User stories

## Readable saved opportunities — 2026-10-12

- As an owner, I can search and sort saved jobs and scan employer, location, deadline, source type and stored assessment in one responsive overview.
- As an owner, I can read both primary/secondary actions and distinguish an unassessed opportunity from a saved, provisional or outdated match without relying only on color.
- As an owner, I can inspect the score explanation and actual saved model while retaining the existing match, clarification and application-preparation workflows. Viewing cards makes no new provider calls.


Status: Working stories. The merged local pilot includes bounded advertisement analysis plus optional owned profile/documents, saved jobs, approved matching, standard CV export and manual application tracking. This does not complete every original profile/matching requirement. P0 targets the first useful delivery, P1 the proposed complete MVP and P2 later improvements. Acceptance criteria are requirements; the development log records actual validation.

## Current pilot slice

### US-23 — Inspect an advertisement with source quotations (P0)

As a jobseeker, I want to paste a public advertisement and inspect AI-extracted requirements, so that I can understand the role before a candidate profile is available.

- Support Norwegian and English, explicit required/preferred/unclear categories and source quotations.
- Validate that every quotation occurs in the source and show that labels/categories are AI suggestions.
- Retain input on error and mark results as stale after source edits.
- Explain external Groq processing before submission. Do not persist data or generate a candidate score.
- Limit input, output, concurrent inference and attempts; do not enable a paid fallback.
- Retain valid source-backed items if another AI item has invalid fields or exceeds limits; preserve citation validation and bounded result sizes.
- Preserve long provider quota delays through backend, proxies and UI; do not shorten a daily-quota wait to five minutes. Keep source text and previous usable results without automatic retries or extra repair calls.
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

### US-58 — Inspect AI exchanges during local development (P0)

As the local pilot developer, I can explicitly inspect actual AI instructions, inputs, schemas/tools and responses across job, document, profile, matching and CV workflows so that multi-call document runs and provider behavior are debuggable.

- Capture remains off until the user explicitly starts it; the UI warns that source documents and candidate information may appear.
- Keep content only in loopback-protected, bounded backend memory; never write it to application/console logs, files, database or public-advertisement diagnostics.
- Group resumable document workflow calls and number calls in observed order. Show provider/model, task, endpoint, status, duration and truncation.
- Expose the DEV control only beside the AI workflow it inspects; keep the saved-job list free of it and filter an opened job's match panel to that exact job's captured call group.
- Keep saved-job and document overviews, profile/dashboard pages and CV/application overviews free of the panel; show document diagnostics only in active document analysis and scope them to that workflow.
- Provide stop and immediate-clear controls, expire entries after ten minutes and stop capture automatically after thirty minutes.
- Do not show API keys, authorization headers, raw exception messages or provider credentials. Tests use synthetic content and make no live model calls.

## US-28 — Sign in and reopen my basic profile

Basic identity/profile merged in PR #12; this is a subset of the planned full candidate profile.

As the local pilot, I want to sign in and save my name and preferred profile language so that a persistent, owned workspace exists before adding career evidence.

Acceptance criteria:
- Use local OIDC authorization code + PKCE; no anonymous/private-data fallback or browser-supplied owner ID.
- Require a verified session for profile reads/writes and CSRF for save/logout. Isolate different subjects and the same subject under different issuers.
- Save/reopen name and nb/en language with explicit revision checks; retain the draft on conflict until the user loads the saved version.
- Show honest unavailable/login-failure/session-expiry states. Support Norwegian-first and English UI.
- Keep basic name/language profile data and auth material out of AI requests and browser persistent storage; any private document/CV AI payload shown for debugging requires the separate, short-lived opt-in trace in US-58.
- Explicitly mark experience, competencies, CV and matching as future increments.

## Diagnostics presentation update

The diagnostic surface is a hidden, nonmodal right-side shadcn Sheet with a visible DEV edge tab. Preserve the existing sanitized event/source boundary; support keyboard opening, translated close, Escape/focus restoration, narrow viewports and reduced motion. Opening the panel makes no provider call. Separate private request/response inspection remains disabled until an explicit in-app start and is never logged or persisted.


## US-29 — Review my own competency statements

Merged in PR #14. As the pilot I can create a competency with own contribution, context and source; inspect and separately confirm/reject it; edit it back to UNVERIFIED; inspect prior revision snapshots; and permanently delete it and all history. Expected revisions prevent stale confirmation. Other identities/issuers cannot access it. INFERRED creation and automatic discovery remain future work.

## US-30 — Import an original CV and source my competencies

Initial local slice merged in PR #14. Upload bounded DOCX/PDF, choose nb/en document language, retain/download identical original bytes, select a master and inspect local extracted text. Selecting an exact excerpt and describing my contribution creates a source-linked UNVERIFIED claim for subsequent review. Upload itself makes no AI call; optional reviewed-preview AI analysis is described in US-32. Malformed, encrypted, oversized and scanned documents have honest outcomes. Deletion requires approval and explains retained claim source quotes. Optional local OCR extends this slice under US-34. Automatic confirmation, arbitrary layout-preserving generation and production storage remain future work.

## US-31 — Read an advertisement even when AI structuring fails

Merged in PR #14. After source retrieval succeeds, AI failure still shows the title/link and received source text; a manual retry reuses that source. A successful analysis groups employer text, role/applicant/offers, stable practical metadata slots and existing requirement filters. Narrative text uses source wording, not AI-written marketing summaries. Unknown contact details are explicit; no names are invented. Opening details makes no model calls. Both languages and mobile/desktop layouts are covered.

## US-32 — Summarize competencies across my uploaded documents

As the pilot I can choose a single document or all readable CVs/attestations/certificates, inspect/edit what will be sent, approve one bounded Groq call and reopen a privately stored source-backed competency summary. Every proposal identifies its actual source quote/document. Missing text and limited excerpts are visible; mismatched quotes are omitted rather than invented. Suggestions do not change my profile until I explicitly review/edit/save an UNVERIFIED claim; confirmation remains separate. Failures preserve the preview and previous analysis with manual retry and quota feedback. Upload/deletion invalidates combined summaries. Other subjects/issuers cannot read or analyze my sources. Norwegian/English and mobile presentation are supported.

## US-33 — Find and review competencies without losing the evidence

As the pilot I can see active skill-label, confirmed-statement and pending-review counts; search skill/contribution/project/source; combine search with status filters; inspect exact evidence/full statements and retain revision controls. Documents show extracted text counts. A wide right-side review Sheet presents source approval and AI results in separate columns on desktop, stacked on mobile. Search AI proposals independently. Profile settings collapse after setup, while keyboard and Norwegian/English access remain available. Counts describe recorded data, never proficiency or confidence.

## US-34 — Recover missing document text and understand AI coverage

As the pilot I can reread an already uploaded immutable original using the improved Word/PDF reader. For textless PDF pages I can explicitly request local OCR, with clear installation/language/size/timeout errors. OCR makes no AI call and needs review before AI approval. Changed extraction clears stale analyses while preserving original files and existing claim history; in-flight stale AI saves fail. Long previews use distributed passages with fair redistribution; I can focus a document or select beginning/middle/end and inspect the limited coverage. A single approved analysis can provide up to twenty proposals; it never creates confirmed skills automatically. Unsupported layouts/scans and excerpts remain visible limitations.

## Authorized local-pilot continuation

- US-035: As a signed-in candidate, save received advertisements and their analyses, search/reopen their exact snapshots, and explicitly delete one without another provider call. Ownership, CSRF, bounded evidence and source caveats must remain.
- US-036: As a candidate, preview selected confirmed competencies and advertisement passages, approve sharing for each match, see explained requirement-level relevance/evidence/questions, and reopen stored assessments without another call. Undocumented skills remain unknown; changed evidence marks the assessment stale and cannot silently update it.


## Local pilot entry and orientation

### US-39 — Understand the product before entering (P0)

As a jobseeker, I want a clear landing page and dedicated sign-in so I understand the product and do not need to discover authentication inside profile settings.

- Landing describes actual features and provides sign-in and guest-analysis paths.
- Public entry, error/setup explanations and workspace navigation support Norwegian and English.
- Existing OIDC/PKCE returns to the overview; failure returns to sign-in. No new password store or arbitrary redirect target.
- Anonymous private entry does not fetch private data or display a writable profile. Backend still enforces ownership and CSRF.
- Shared sign-out clears private query/mutation caches and leaves the workspace.

### US-40 — Know my next action (P0)

As a jobseeker, I want an overview of my actual saved information and a useful next step so I can make progress without interpreting the application architecture.

- Show confirmed/unreviewed competencies and saved advertisements from actual owned records.
- Missing profile leads to profile creation; unreviewed content leads to review. Failed reads are unknown, not zero.
- No automatic AI call, score, fake interview, discovery digest or submission status.
- Persistent named navigation and an accessible mobile Sheet preserve working routes, keyboard focus and responsive reading.

### US-41 — Record reviewed career history (P0)

As a jobseeker, I want employment, projects, education and certificates with their own timeline so a future CV can reflect formal titles, actual work and clients accurately.

- Separate organization, client, formal title and delivery role; optional dates stay unknown.
- Save as UNVERIFIED, separately confirm/reject, reset confirmation on edit and retain revision history.
- Document analysis should propose named projects independently of their competencies, with literal project identity and bounded source proof. Different generated descriptions of the same dated relationship should not duplicate the analysis card; keep sources and existing review identity. Unknown dates and unsupported organizations remain unknown, and prototypes/planned work must not become completed employment.
- Explain rejected extraction proposals with saved source-check categories and bounded counts by competency/profile/history area. Preserve originals and legacy results; never publish rejected AI text, infer missing competency from these counts or spend an extra AI call to display diagnostics.
- Require ownership, saved profile, CSRF and expected revisions. Deletion is explicit.
- This first typed subset does not claim a complete relational career graph or CV export.

## Local pilot additions

- Source-backed advertisement contacts: recover explicit bounded contact blocks that AI omitted, retain exact source spelling and quotations, reject date-like phone candidates and preserve unrelated people. No inferred person/role/contact association or extra AI call. Name-only, ambiguous and absent-source details remain outside this conservative recovery.

- **US42 — Reviewed CV export:** choose current confirmed claim/history revisions, preview all selected content, approve a standard DOCX/PDF version and download the same immutable files later. Originals remain unchanged; stale drafts cannot approve.
- **US43 — Exact application archive:** create/reopen a case for a saved job, choose its approved CV, explicitly record submitted date/text, track status/history and follow-up without sending anything externally. Foreign ownership, stale revisions and deletion of referenced materials are rejected.
- **US44 — Useful source recovery:** read complete received sections and remaining text when Groq fails; local heading/field organization is labelled and does not invent missing information.
- **US45 — Multi-source competency evidence:** import PDF/DOCX/TXT/Markdown, preview/approve bounded AI summaries, inspect each long-document part, consolidate exact repeated experience with all validated supporting sources, keep company/project contexts distinct and confirm experience separately.

- **US46 — Check my actual evidence:** locally check owned originals, text reproducibility and existing AI quotation support without another model call or writes. Show distinct intact/missing/OCR/partial/unsupported states with text and accessible indicators, then open the document for inspection. A passing technical check must not imply semantic or exhaustive correctness.
- **US47 — Source-selected competencies:** suggestions use original wording and a skill label found in their own quote. Show nearby same-document context proof or unknown context; preserve course/list limitations and require separate user confirmation. Invalid items cannot turn an unrelated valid quote into invented experience. Older results reopen safely without rewriting confirmed claims.
- **US48 — Personalize my private profile:** show a compact identity card with my name, preferred language, profile revision and optional photo. I can preview, explicitly save or remove a JPG/PNG photo; validate and normalize it server-side, keep it owner-bound and uncached, and never send it to AI. Photo changes do not modify profile facts or their revision.
- **US49 — Find a clear first step in my profile:** when a section has no data, see useful source-first actions for documents, competencies or career history instead of empty metrics and blank space. Navigation opens the selected working section. Explain that extraction and AI analysis are separate, unknown dates can stay blank, and new facts need my review; loading or request failures must never be presented as empty data.

## Resumed document/profile slice

- As a candidate, I approve full documents once and the system handles portions automatically. Acceptance: full editable previews, no manual part selection, source coverage and resumable owned progress.
- As a candidate, I review distinct explicit technologies and contributions grouped by supported company/project. Acceptance: editable AI descriptions, exact multi-source evidence, conservative deduplication, search/category filters and no automatic confirmation.
- As a candidate, I receive prefilled employment/project/education drafts and supported profile summaries. Acceptance: unknown dates/interests remain unknown, user edits and confirms explicitly, and career-entry evidence remains revision-linked.
- As a candidate, I reach documents, competencies and career history through clear profile sections. Acceptance: dashboard links select the destination and mobile review fits the screen.
- As a candidate, I retain useful work on provider failure. Acceptance: saved portions remain visible, full cooldown is respected, no automatic retry/model switch and explicit continuation.

## AI provider integration

- As a pilot user, I see which AI recipient/model will receive my reviewed data and explicitly approve each new analysis. Backend and UI reject stale configuration approvals without sending to a new recipient or model. Gemini document/profile tasks use Flash-Lite defaults with task overrides; moving a stored Flash plan to Lite requires renewed approval.
- As a pilot user, I can choose every model in the existing full selector (Groq GPT-OSS 20B/120B and Gemini Flash/Lite 3.1, 3.5, 3.6, 3.7 and 3.8) for each AI call, including job analysis, document extraction/profile synthesis, matching, CV preparation and supported retrieval. The interface distinguishes configured options from live availability, keeps defaults unchanged, identifies the actual recipient/model, and explains safe document failure/validation reasons without exposing raw provider payloads.
- As a returning user, I can inspect stored document progress after configuration changes; it never silently resumes with another provider.
- As a job seeker, I receive explicit responsibilities/mentoring/release skills alongside technologies, retain original evidence and can edit drafts before confirming. Source-backed education/interests survive a shorter final summary.

## AI recovery and provenance refinement — 2026-10-08

As a pilot user, I can choose a configured alternate AI provider after a quota failure without restarting the app or discarding completed document work. Acceptance: the actual model/provider is shown before sending and with the result; private recipient changes clear consent; no hidden retries occur; owned run revision/source checks remain; a changed visible preview cannot send old text; prior result metadata is preserved; server cooldowns and overall budgets remain enforced. Backend-configured alternatives require backend-only keys. Missing model metadata is labeled honestly.

As a document reviewer, I can switch between competencies, profile summary and career history. Repeated labels share context cards, while different contributions keep their own editable drafts and evidence.

- As a candidate, I see an animated status while AI is responding and a distinct waiting state during quota/pacing delays. Acceptance: truthful labels, retained prior results, disabled duplicate submissions, reduced-motion support and independent source/analysis model identities.

## Document-derived profile and review queue

- As a candidate, I can let approved document processing populate literal sourced competencies and editable career history without retyping them. Documentary evidence and personal confirmation have distinct labels.
- As a candidate, I can review bounded source passages that were not represented in an analysis result and edit one into a competency, interest, or career-history draft. Acceptance: filtering retains the original passage index; the exact quote and source stay attached; the server checks ownership, current run revision, approved-text offset and retained-original evidence; personal confirmation is explicit; repeat submission reuses the linked item; a stale or missing source is not silently recreated.
- As a candidate, I see how many competency contributions still await review; approved, documented, saved drafts and rejected/removed items are outside that queue and remain separate after reopening.
- As a candidate, I can approve, edit, save as draft or reject directly, with expandable exact evidence and a compact responsive list. My edits and decisions survive reanalysis.
- As a candidate, I see the newest saved AI presentation with actual provider/model attribution; viewing my profile does not trigger another provider request.
- As a candidate, I can tell AI-written presentation text from source-backed claims and user-confirmed information, inspect the exact cited excerpts, and edit presentation wording without promoting it to a fact.
- As a candidate, matching preselects confirmed evidence, explains its requirement-coverage percentage, and lets me clarify missing evidence inline and explicitly save my own answer.


## Consolidated competency presentation

- As a candidate, I see one profile card for Next.js even when several documents/projects mention it. Acceptance: combined existing explanations, repeated text deduplicated, context/source details retained and no undisclosed AI request.
- As a candidate, I see confirmed evidence separately from drafts in a mixed-status competency. Editing one contribution resets only its own confirmation. Rejected wording stays outside the active summary.
- As a candidate, confirming a contribution does not approve a different contribution merely because both use the same skill, company and quotation. Decisions survive reopening and automatic reanalysis.

- As a candidate, I can see relevant source passages that extraction may have overlooked. Acceptance: document/type attribution, exact quotes and offsets, separate source-usage counts, keyboard scrolling and no completeness claim.
- As a candidate, I can allow bounded follow-up under my chosen AI approval. Acceptance: disclosed maximum four extra calls/two per document, one repair round, no duplicate source coverage, retained quota progress and review decisions, no silent extension of older runs (ADR 0028).

- As a candidate, technical subsections retain a supported employer/project context without inheriting unrelated global or peer sections. Acceptance: exact heading evidence remains inspectable and employer boundaries hold for repeated wording.
- As a candidate, explicit month dates from my documents prefill career history correctly. Acceptance: local/ISO formats preserve endpoint positions, year precision does not invent months, original wording is retained and existing records are unchanged.

## Structured career context

- As a candidate, I can see which employment/project supports an individual competency contribution, including employer, client, period, draft status and exact source proof, without creating another skill card.
- As a candidate, a unique supported documentary relationship is populated automatically; a matching company label alone or ambiguous same-company entries cannot select a relationship.
- As a candidate, I can search saved history, explicitly link it, review a stale link or remove it. Acceptance: factual confirmation is unchanged, version conflicts retain information, and reanalysis respects removal.
- As a candidate, source deletion preserves existing quoted proof with a clear deleted-original label, while deleting the competency or career target deletes its relationship events.

## Expected-fact extraction quality

- As a candidate, I want a long skills section to remain intact when automatic processing divides my document. Acceptance: complete named list labels survive later portions, each source row is recovered once, unrelated company/education/interests sections do not acquire the preceding context, and approved profile population persists later findings without additional AI calls.
- As a developer, I need independently reviewed expected facts to expose omissions that quotation-usage counts cannot show. Acceptance: recorded outputs are measured for individual competencies, employer/project attribution, career date precision and selected substantive profile terms, with unsupported literal evidence counted separately. Private manifests/results remain outside Git; normal tests use fictional fixtures and make no provider calls.

## Complete profile matching — 2026-10-09

As a candidate, I want matching to use all of my confirmed document-derived and personal competencies without selecting them manually. Acceptance: the final contribution beyond item 30 is sent and usable as validated evidence; repeated literal source passages share one payload passage without removing skills; drafts/rejections remain excluded; changed/new confirmed revisions require renewed approval or reassessment. The saved-job card shows the same persisted explained percentage without initiating AI.

## Career period comparison

- As a candidate, I can inspect possible period differences without parallel roles, different clients, unknown dates or separate rehires being labelled contradictory. Acceptance: exact identity and known overlapping unequal endpoints only; rejected records are excluded.
- As a candidate, I can compare any two active career entries with their exact sources, then correct one using its current revision. Acceptance: no background AI/writes, bounded readers, responsive dialog, source-error/deleted-original states, and editing resets only the selected record's confirmation.

## Planned evidence-based preparation (not yet implemented)

- As a candidate, I can move from login and document upload through saved-job matching into Apply for this job without reselecting competencies or guessing the next step. Acceptance: visible prerequisites, freshness, useful partial results and mobile/keyboard navigation.
- As a candidate, I can understand what my documents should contain and which supported formats/readability yield useful evidence, with optional tutorial/contextual help that does not block returning users.
- As a candidate, I can distinguish a real documented gap, an unresolved question, transferable experience and a confirmed capability that is missing from my CV. Absence alone is not a confirmed gap.
- As a candidate, I can use a selected master CV to review exact old/new wording, evidence and reasons across relevant sections, then approve/edit/reject proposals. Acceptance: confirmed facts only, original preservation, correct chronology, stale revision protection and no new tailored file/version in the next milestone.
- As a candidate in any profession, I get profession-appropriate terminology and evidence-based recommendations without invented qualifications, motivation, outcomes or hiring probabilities.

## Implemented preparation slice

- A candidate opens a saved job's dedicated preparation page, sees prerequisites and chooses their owned master/base CV without reselecting competencies.
- A candidate explicitly approves the visible provider/model and complete supported source before one AI request. Wrong-task consent, other owners, missing CSRF and stale source/match revisions cannot produce current proposals.
- A candidate compares exact old/new wording with references, edits it and approves/rejects it; pending counts exclude processed proposals. The original and profile facts are unchanged.
- Quota failures retain existing proposals. Model changes clear consent and permit an explicit alternate-model request; no automatic fallback/retry occurs.
- Limits: up to 12 text changes, defensive 128-criterion matching bound (ADR 0032), page-session review only, no generated tailored file and no deterministic guarantee of factual/semantic completeness.


## Optional guided workspace journey

- I can open a short guide, skip among five steps and follow real links without starting an AI call.
- I know which document formats and information are useful, how automatic matching uses confirmed evidence, and what CV preparation does.
- My next action reflects saved documents/competencies/jobs; unavailable information does not become a false empty-profile recommendation.
- I can reach document upload from the dashboard without searching through profile panels. Guide position is local display state, not stored application progress.

## Requirement coverage and answer continuity — 2026-10-09

- As a candidate, I can review later source-backed criteria after saving/matching, rather than losing everything beyond twelve. Defensive bound: 128; no promise of exhaustive extraction.
- I can distinguish unassessed AI output from a question about my experience. Missing output does not ask me to create a competency, and incomplete coverage is provisional.
- I can see, edit and retry confirmation of an existing personal answer without duplicating it. Editing uses current revision checks; rejected answers are not silently restored. AI still assesses actual relevance.
- I can search and filter a long match and inspect document-source passages in a compact table, including by keyboard and on mobile. Supplementary help dismisses before the containing reader on Escape.

## Evidence-based application priorities — 2026-10-09

- I can distinguish direct experience from a supported analogy without having inferred skills added to my profile. Transferable evidence never receives full coverage, and related practical experience cannot establish a formal qualification.
- I can see unresolved mandatory qualification counts on saved cards and review sources before applying. Explicit alternatives offered by the employer remain relevant; an unknown qualification is not a proven gap.
- I can expand documented examples, transferable experience and qualifications in application preparation, inspect their sources, and recognize stale guidance. No extra provider call or claim confirmation follows reading these groups.
- Older stored results remain readable without invented labels. Source-bound base-CV visibility is now available through ADR 0034; independently measured semantic completeness remains pending.

- I can inspect the saved answer/status/context, edit its wording and confirm it with clear feedback. Related-scope writing aids do not falsely establish a complete match.
- I can reject a saved clarification with a confirmation dialog, cancel it or retry a failed rejection. The rejected answer remains visible after reopening, excluded from matching, and can later be deliberately corrected/reconfirmed under the same identity. No automatic AI call or factual resurrection occurs.

## Implemented base-CV visibility slice

- I receive a criterion-by-criterion CV presentation review from the same approved request as wording suggestions, without selecting competencies manually.
- I can search/filter outcomes and inspect literal CV excerpts and established candidate evidence before deciding what to change.
- Unknown experience/authorization is a clarification, not an asserted skill gap. Invalid/missing output is unassessed, not absent competence.
- I can still read earlier/legacy wording proposals; changed evidence makes the CV review historical. No confirmation, new CV version or durable changeset is implied.

## Approved CV wording handoff

- I can preview and copy the complete plain CV text containing only the changes I approved, without assembling paragraphs manually.
- Unreviewed/rejected suggestions keep the original wording; changed or unavailable evidence prevents copying as current.
- Clipboard failure preserves a readable/selectable preview. I understand this is plain text, not preserved DOCX/PDF layout, a saved CV version or an application submission.

## Reliable practical advertisement information

- I can see published contact endpoints, deadline, location and employment fields from received text even when AI supplies a partial answer or fails, regardless of the source website.
- I can inspect literal source quotations and save these details with the original received text. Missing details are not invented; exceeding the existing snapshot bound is disclosed before saving.
- A vague qualification heading does not silently become a mandatory requirement. Explicit mandatory/preferred wording governs new results; unsupported importance remains unclear.

## Recovering AI configuration

- I can tell whether the app is retrieving AI configuration or could not retrieve it, instead of waiting indefinitely beside a disabled button.
- I can retry configuration retrieval without sending documents or starting an AI analysis. If a task has no configuration, the app explains that explicitly.
- After recovery I see the selected provider/model and approve private analysis separately. Missing historical attribution is not presented as ongoing work.

## Choosing a trustworthy base CV

- My master CV is selected automatically for wording proposals. If none is marked, I choose the CV instead of having a certificate silently selected for me.
- I can clear/change that choice and approve the new source separately. Selecting a CV does not require selecting competency evidence.
- If too little text was extracted, I see guidance to choose another CV or reread/OCR the original in my profile, without spending an AI call.

## Match freshness across the profile

- After a competency change, every visible saved-job card rechecks whether its assessment is still current, including jobs other than the one I am clarifying.
- During that check I see a freshness status rather than an old percentage presented as current. The prior result remains readable.
- Refreshing evidence and saved status does not start AI or change my confirmed facts, percentages or recipient approval.

## Correct before confirming

- I can correct an AI proposal inside guided review without abandoning the queue or registering the same competency again.
- Saving the correction keeps it pending and returns me to the same item for explicit confirmation. The next item opens only after confirmation, rejection or skipping.
- I can return without saving; the original contribution and source evidence remain visible.

## Focus on document results

- When an analysis is complete, I reach competency/profile/history review without scrolling through expanded technical processing details.
- I can open source checks and processing details on demand, including missed-passage review, with no new AI request.
- During processing or a quota pause, progress/recovery information stays expanded. Completion does not imply that every competency was found.

## Navigating document sources

- I can find a document by filename and quickly locate sources with missing text, unknown text status or the master-CV designation.
- I can clear an empty search/filter result and access combined analysis without scrolling through every file.
- Filtering the list never silently narrows the combined-analysis preview. Reading status does not imply AI analysis or confirmed competencies.

## Preserve a long explicit competency list

- A valid technology list with more than 30 items is not silently discarded as a whole by local recovery.
- Repeated labels under different employers keep their own literal source and context. Existing suggestions are not duplicated by recovery.
- A sparse AI answer can be supplemented locally without another model call; source validation and existing defensive bounds remain unchanged.


## Resume CV wording review — 2026-10-12

As a candidate I can reopen saved suggestions and approval/rejection decisions for a job without another provider request. Saves require my owned session and expected revision. I can save edited wording as pending, and no profile fact is confirmed by wording approval. Failed/conflicting saves retain local text; stale source/evidence cannot approve or produce current copied wording. Stable CV sections and actual-document quality approval remain next milestones.


## Review CV suggestions by section — 2026-10-12

As a candidate I can navigate explicit CV sections, see a reasoned keep/change/needs-review plan and inspect original text/evidence before reviewing its proposals. Every original passage remains available; unclear mixed layouts are not silently assigned or discarded. A missing or contradictory AI outcome is unassessed, not automatically kept. New plans reopen with their original session; older sessions remain usable without an automatic AI request.


## Preserve factual scope while tailoring — 2026-10-12

As a candidate I can distinguish declared full passage review from incomplete/legacy section assessment. New generated text and my edited wording cannot introduce unsupported numerical values into accepted wording. Historical year-shaped values in classified experience/education stay preserved. I can save unresolved wording as pending and continue editing after rejection of an approval attempt. No new profile fact or final-document state is produced.

## Document-library feedback and career review — 2026-10-12

- As an owner, I can distinguish text extraction from saved AI analysis and inspect useful analysis metadata by mouse, keyboard or touch without extra AI requests.
- As an owner, I see partial processing separately from completed processing; neither label claims exhaustive discovery or factual approval. Findings in combined analyses remain attributable to the source document.
- As an owner, I can choose available models inside scrollable document readers on desktop/mobile, renewing consent after a recipient/model change.
- As an owner, I can review labeled career facts, inspect the source note, cancel or edit before confirming through a compact responsive dialog.

## Reviewed wording and lighter review — 2026-10-12

- Save approved CV wording as a separate immutable library draft with server-checked source/session revisions, without inventing facts or changing original files.
- Keep text approval separate from final DOCX/PDF approval; new wording drafts cannot use the legacy export path.
- Explicitly select and confirm multiple eligible competencies or career entries, retaining displayed revisions and reporting partial failures.
- Use readable consistent dialogs and a stable public model selector on desktop/mobile.


## 2026-10-12 — CV tailoring readiness guidance

As a candidate blocked from CV tailoring, I can see exactly which prerequisites are unmet and navigate to the existing repair flow without an unsolicited AI call. Once current automatic matching, readable CV and confirmed evidence are available, the consent checkbox becomes available without being preselected.


## 2026-10-12 — Selected presentation sections and Documents navigation

As a candidate, I can select individual saved document summaries for my presentation without a later analysis replacing my choices. I explicitly replace each section; exact analysis/presentation revisions reject stale writes. As a candidate, I want uploads and document analysis on a dedicated Documents page while my profile focuses on presentation, competencies and history (next slice).


## 2026-10-12 — Project history extraction correction

As a candidate uploading project experience, I receive separate source-backed project history drafts rather than only competencies. An own project with no supported organization is not discarded or turned into employment. Dated experience used only in a competency/profile quote remains a history coverage question.


## 2026-10-12 — Dedicated library and retained profile review

Candidates can find Documents in desktop/mobile navigation, upload/manage original files there, and still access all existing AI/profile review in Min profil. A completed analysis can be rerun with another model and renewed consent; prior user decisions and selected presentation stay separate from regenerated drafts.


## 2026-10-12 — One profile presentation and direct main CI repair

Candidates see a single presentation of their chosen sections and can find new drafts in source review. New analyses must not create a duplicate presentation or replace selected text.


## 2026-10-12 — Reviewed CV file drafts

As a job seeker, I can generate and download immutable DOCX/PDF drafts from my reviewed wording, without having them marked approved or ready to submit. Both files must preserve the reviewed character content, keep original documents unchanged and remain owner-scoped. Generation errors preserve the text draft.


## 2026-10-13 — Joined journey quality and CV coverage

As a user, my separate profile paragraphs, competency table cells and work-description/bullet paragraphs remain individually available for tailoring. I can review more than twelve supported proposals, and receive an explicit recovery action for older merged DOCX text. This does not require every passage to be rewritten.


## 2026-10-13 — CV passage review transparency

As a user, I can see all profile/skills/work-section passages, including those with no own proposal, so I can spot missing individual treatment before approving wording. I can compare original text and original AI suggestions on mobile without extra calls or factual promotion.


## 2026-10-13 — Individual CV passage assessments

As a user, I can understand why each CV passage is proposed changed, retained or left for review, instead of assuming proposal absence means review is complete. Unsupported/duplicate/contradictory AI declarations cannot conceal incomplete work or become confirmed profile facts.


## 2026-10-13 — Regular Flash configuration

As a user, I can choose regular Gemini 3.6 Flash while retaining Flash-Lite for other tasks. Acceptance: the regular alternative and unset Gemini job/match fallback use 3.6; explicit overrides and historical attribution remain intact; private consent remains bound to the displayed model.

## 2026-10-13 — Advertisement and candidate evidence quality

- As a candidate, I want recognizable related-job recommendations excluded from AI analysis without losing the saved original advertisement. Acceptance: exact recommendation headings and repeated footer-card patterns delimit input; legacy unrelated criteria remain unassessed rather than matched as real requirements.
- As a candidate, I want explicit negated stack expectations, offered benefits and unsupported language labels withheld as requirements. Acceptance: conservative lexical rejection and formatting-equivalent deduplication preserve actual duties, optional qualifications, prohibitions and distinct evidence.
- As a candidate, I want my explicitly documented natural-language competence available to full-profile matching without entering it again. Acceptance: literal name/proficiency quotations, supported PDF row boundaries, documentary confirmation basis, no invented CEFR/employer context, no programming-language confusion, and preserved user decisions on reanalysis.
- As a candidate, I want outdated recommendation-derived requirements repaired before new CV suggestions. Acceptance: CV_JOB_REVIEW_REQUIRED blocks the provider call, asks for advertisement reanalysis, and preserves historical saved work. These controls do not promise exhaustive extraction or deterministic semantic judgments.

## 2026-10-14 — Logical CV source units and PDF paragraphs

As a candidate, I can inspect separate profile paragraphs, skills groups and contributions with their literal entry context before reviewing wording. New tailoring uses bounded exact source ranges, protects recognized identity/headings/dated entry headers, and applies accepted wording only to editable units. Invalid stored ranges block review/assembly; older sessions retain their original paragraph indexes. New PDF uploads and explicit original rereading preserve geometric paragraph gaps without changing original files. This does not promise complete semantic recall, template fidelity or final document readiness.


## Source-retrieval model completeness — 2026-10-14

As the pilot user, I can independently choose any supported Gemini Flash/Lite source model or Groq 20B/120B before retrieving an advertisement, including Flash-Lite 3.5 and Flash 3.7. Existing defaults and explicit overrides remain. Selection alone starts no request; the source fingerprint must match the chosen model, independently of requirement analysis. Catalog presence/configured keys do not guarantee capacity. Failed retrieval keeps the URL and offers explicit retry/pasted text without silently switching models. Received text remains an AI-prepared excerpt.


## Preserve CV entry continuity — 2026-10-14

As a candidate, my employment header, introduction and contribution bullets stay associated when a PDF page ends mid-entry. Two-column skill groups retain the correct labels/content, metadata labels retain values, and ordinary compound prose cannot create a new employer scope. Synthetic checks cover four continued bullets for one employer and three for the next, plus six skills groups with a narrow gutter. Repeated contents headings must not cause valid project evidence to be discarded or competing source accounts to be silently chosen.

## Review scope and language — 2026-10-14

As a candidate, I need the match to distinguish a supported part of a requirement from unproven duration, responsibility or specialist scope. I need CV review explanations in my selected language for every source unit, with reasons tied to the actual passage and job. A previous optimistic match must not authorize invented experience in a new CV proposal. Current implementation strengthens provider instructions and retains source/reference checks; independent semantic assurance and consistently useful reasoning remain quality work.

## Keep CV visibility distinct from relevance — 2026-10-14

As a candidate, I can inspect the exact associated match classification/reason when reviewing how visible my experience is in the CV. Partial relevance remains partial even when that experience is clearly written. A newer match is never substituted into an older CV review. If the old assessment is no longer available, my saved wording/evidence remains readable without an invented association or extra AI call.

As a candidate, I receive an actionable explanation when Groq rejects a structured request as too large, with my complete evidence and earlier proposals retained. Switching models requires the existing explicit approval; the system does not silently drop competencies, switch providers or retry.


## Inspect factual scope before wording approval — 2026-10-14

As a candidate, I can ask for a separate, explicitly approved source opinion on saved CV proposals, including my saved edits. I can inspect employer context and literal evidence, understand which phrases may overstate responsibility or specialist scope, and retain earlier findings after provider failure. An AI support label is an opinion, never a factual confirmation, automatic acceptance, match-score change or CV_READY. A changed saved revision invalidates the current association; rejected proposals are excluded.


## Efficient source opinions without weaker evidence — 2026-10-14

As a candidate, a small optional wording review should not reserve the full generation output allowance. Acceptance: request-local proposal-count limits reach the explicitly approved Groq/Gemini adapter; other task budgets, complete per-draft evidence, consent, source/revision checks and no-retry behavior remain unchanged. Provider capacity and semantic correctness are not guaranteed. Controlled real-document excerpts exposed false support and nonliteral quotations, so shared cross-draft evidence compression is deferred and human review remains necessary.

As a candidate, a wrapped compound employment description stays one source unit while separate paragraphs and employers retain their boundaries. Only new source-unit creation changes; saved historical indexes remain readable.


## Read exact sources with a localized explanation — 2026-10-14

As a candidate, I can inspect the exact stored excerpt selected for a saved wording opinion and a concise explanation in my chosen language. Acceptance: source-only input excludes advertisement persuasion and original wording as proof, retains every referenced statement/context character and qualification, and uses per-draft application-owned source IDs. The provider identifies a literal draft phrase for a problem; the server validates references and renders localized issue explanations. Invalid/foreign references remain unassessed; selected source text is never paraphrased or silently corrected. Accurate quotation does not make the AI judgment factual confirmation, and provider mistakes remain possible.

## Trace initial wording to the actual claim — 2026-10-15

As a candidate, every new retained CV proposal should identify literal evidence from each claim it uses. Acceptance: reject missing, foreign, invented or duplicate excerpts without losing valid siblings; preserve complete statements/context, revisions, employer scope and old sessions. Prior match judgments and skill labels cannot substitute for factual support. Persisted excerpts describe the original suggestion, not semantic verification of my later edits. Human approval and independent factual-scope review remain necessary.


## Optional OpenAI provider — 2026-10-15

As a user, I can explicitly choose OpenAI alongside existing structured-generation providers, see the actual provider/model identity, and approve private input for that recipient without changing existing defaults. As a maintainer, I can inspect non-content token usage and dated estimated costs, while distinguishing provider output, local validation and upstream source defects. Live quality comparisons require a fixed semantic criterion inventory, unchanged source/prompts and explicit spending authorization.

## Explicit Sol and Luna choices — 2026-10-16

As a user, I can explicitly choose OpenAI GPT-6.1 Sol or GPT-6 Luna for structured advertisement, document/profile, matching and CV wording tasks. Acceptance: both appear in the complete shared catalog; existing defaults remain; selecting a model starts no analysis; model changes clear private consent even within OpenAI; actual saved result identity remains visible. Neither is offered as a source-retrieval model. Usage estimates remain distinct from actual billing.

## Statement-backed CV proposal citations — 2026-10-16

As a candidate, each newly generated CV proposal must cite at least one literal statement excerpt for every referenced confirmed claim. Employer/project/context text may supplement that statement, but cannot be its sole cited evidence. Invalid proposals leave review incomplete while valid siblings remain editable. Existing saved proposals retain their original source snapshots and version. These checks establish citation provenance, not semantic truth or factual confirmation.
