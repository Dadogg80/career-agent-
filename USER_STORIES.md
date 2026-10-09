# User stories

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
- Require ownership, saved profile, CSRF and expected revisions. Deletion is explicit.
- This first typed subset does not claim a complete relational career graph or CV export.

## Local pilot additions

- **US42 — Reviewed CV export:** choose current confirmed claim/history revisions, preview all selected content, approve a standard DOCX/PDF version and download the same immutable files later. Originals remain unchanged; stale drafts cannot approve.
- **US43 — Exact application archive:** create/reopen a case for a saved job, choose its approved CV, explicitly record submitted date/text, track status/history and follow-up without sending anything externally. Foreign ownership, stale revisions and deletion of referenced materials are rejected.
- **US44 — Useful source recovery:** read complete received sections and remaining text when Groq fails; local heading/field organization is labelled and does not invent missing information.
- **US45 — Multi-source competency evidence:** import PDF/DOCX/TXT/Markdown, preview/approve bounded AI summaries, inspect each long-document part, consolidate exact repeated experience with all validated supporting sources, keep company/project contexts distinct and confirm experience separately.

- **US46 — Check my actual evidence:** locally check owned originals, text reproducibility and existing AI quotation support without another model call or writes. Show distinct intact/missing/OCR/partial/unsupported states with text and accessible indicators, then open the document for inspection. A passing technical check must not imply semantic or exhaustive correctness.
- **US47 — Source-selected competencies:** suggestions use original wording and a skill label found in their own quote. Show nearby same-document context proof or unknown context; preserve course/list limitations and require separate user confirmation. Invalid items cannot turn an unrelated valid quote into invented experience. Older results reopen safely without rewriting confirmed claims.

## Resumed document/profile slice

- As a candidate, I approve full documents once and the system handles portions automatically. Acceptance: full editable previews, no manual part selection, source coverage and resumable owned progress.
- As a candidate, I review distinct explicit technologies and contributions grouped by supported company/project. Acceptance: editable AI descriptions, exact multi-source evidence, conservative deduplication, search/category filters and no automatic confirmation.
- As a candidate, I receive prefilled employment/project/education drafts and supported profile summaries. Acceptance: unknown dates/interests remain unknown, user edits and confirms explicitly, and career-entry evidence remains revision-linked.
- As a candidate, I reach documents, competencies and career history through clear profile sections. Acceptance: dashboard links select the destination and mobile review fits the screen.
- As a candidate, I retain useful work on provider failure. Acceptance: saved portions remain visible, full cooldown is respected, no automatic retry/model switch and explicit continuation.

## AI provider integration

- As a pilot user, I see which AI recipient/model will receive my reviewed data and explicitly approve each new analysis. Backend and UI reject stale configuration approvals without sending to a new recipient or model. Gemini document/profile tasks use Flash-Lite defaults with task overrides; moving a stored Flash plan to Lite requires renewed approval.
- As a returning user, I can inspect stored document progress after configuration changes; it never silently resumes with another provider.
- As a job seeker, I receive explicit responsibilities/mentoring/release skills alongside technologies, retain original evidence and can edit drafts before confirming. Source-backed education/interests survive a shorter final summary.

## AI recovery and provenance refinement — 2026-10-08

As a pilot user, I can choose a configured alternate AI provider after a quota failure without restarting the app or discarding completed document work. Acceptance: the actual model/provider is shown before sending and with the result; private recipient changes clear consent; no hidden retries occur; owned run revision/source checks remain; a changed visible preview cannot send old text; prior result metadata is preserved; server cooldowns and overall budgets remain enforced. Backend-configured alternatives require backend-only keys. Missing model metadata is labeled honestly.

As a document reviewer, I can switch between competencies, profile summary and career history. Repeated labels share context cards, while different contributions keep their own editable drafts and evidence.

- As a candidate, I see an animated status while AI is responding and a distinct waiting state during quota/pacing delays. Acceptance: truthful labels, retained prior results, disabled duplicate submissions, reduced-motion support and independent source/analysis model identities.

## Document-derived profile and review queue

- As a candidate, I can let approved document processing populate literal sourced competencies and editable career history without retyping them. Documentary evidence and personal confirmation have distinct labels.
- As a candidate, I see how many competency contributions still await review; approved, documented, saved drafts and rejected/removed items are outside that queue and remain separate after reopening.
- As a candidate, I can approve, edit, save as draft or reject directly, with expandable exact evidence and a compact responsive list. My edits and decisions survive reanalysis.
- As a candidate, I see the newest saved AI presentation with actual provider/model attribution; viewing my profile does not trigger another provider request.
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

## Requirement coverage and answer continuity — 2026-10-09

- As a candidate, I can review later source-backed criteria after saving/matching, rather than losing everything beyond twelve. Defensive bound: 128; no promise of exhaustive extraction.
- I can distinguish unassessed AI output from a question about my experience. Missing output does not ask me to create a competency, and incomplete coverage is provisional.
- I can see, edit and retry confirmation of an existing personal answer without duplicating it. Editing uses current revision checks; rejected answers are not silently restored. AI still assesses actual relevance.
- I can search and filter a long match and inspect document-source passages in a compact table, including by keyboard and on mobile. Supplementary help dismisses before the containing reader on Escape.

## Evidence-based application priorities — 2026-10-09

- I can distinguish direct experience from a supported analogy without having inferred skills added to my profile. Transferable evidence never receives full coverage, and related practical experience cannot establish a formal qualification.
- I can see unresolved mandatory qualification counts on saved cards and review sources before applying. Explicit alternatives offered by the employer remain relevant; an unknown qualification is not a proven gap.
- I can expand documented examples, transferable experience and qualifications in application preparation, inspect their sources, and recognize stale guidance. No extra provider call or claim confirmation follows reading these groups.
- Older stored results remain readable without invented labels. Actual base-CV visibility assessment is still pending.
