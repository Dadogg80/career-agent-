# Beslutningsregister

Confirmed records explicit user requirements; recommendations record design proposals. Implementation has started, and the user has delegated routine choices. Accepted implementation decisions identify their scope and do not imply that the full MVP is approved or completed.

## Bekreftede føringer

| ID | Føring | Grunnlag og konsekvens |
| --- | --- | --- |
| D-001 | Ingen applikasjonsimplementasjon før klarsignal. | Opprinnelig instruksjon. Klarsignal til første lille implementasjon er nå gitt; se D-012. |
| D-002 | Norsk først, engelsk fra første versjon. | Brukerens eksplisitte språkkrav; UI og dokumentspråk må skilles. |
| D-003 | Langsiktig målgruppe er alle jobbsøkere. | Brukerens svar; modellen skal ikke være utviklerspesifikk. |
| D-004 | Produkteieren er eneste pilot og trenger rask praktisk nytte. | Brukerens svar; prioriter hele, små brukerflyter. |
| D-005 | Ingen tilgjengelig finansiering; gratis under pilot/testing. | Brukerens svar; ikke anta betalt drift eller AI-budsjett. |
| D-006 | Senere mulig salg til veiledere og organisasjoner. | Brukerens svar; tilrettelegg for eierskap uten å bygge organisasjonsprodukt nå. |
| D-007 | Erfaring skal aldri oppdiktes. | Produktvisjonen; inferens og ekstraksjon blir ikke automatisk CONFIRMED. |
| D-008 | Modular monolith først; Kotlin/Spring Boot foretrekkes. | Opprinnelig produktvisjon; endelige versjoner og modulgrenser gjenstår. |
| D-009 | PostgreSQL er ønsket system of record. | Produktvisjonen; vector search er en avledet retrieval-mekanisme. |
| D-010 | Beslutninger, planer og fremdrift skal lagres i dedikerte Markdown-filer. | Gjeldende brukerforespørsel; dokumentasjon er del av hver senere endring. |
| D-011 | Fortsett selvstendig med dokumentasjon og Git-publisering. | Brukerens instruksjon etter foreslått neste steg; ikke en eksplisitt bestilling på applikasjonsimplementasjon. |
| D-012 | Start første avgrensede utvikling. | Brukerens «vi kan vel kanskje starte utviklingen nå?» er tolket som klarsignal, med omfang forklart før arbeidet. Ingen betalingsautorisasjon. |
| D-013 | Use English for GitHub communication. | Explicit user requirement: commits, PR titles/descriptions and other GitHub communication. |
| D-014 | Groq for the bounded advertisement pilot. | User supplied access; authenticated model listing and fictional extraction verified. Delegated implementation choice in ADR-0007; no private CV processing or paid fallback. |

## Anbefalinger for diskusjon

| ID | Anbefaling | Hvorfor / konsekvens |
| --- | --- | --- |
| R-001 | Samle vurdering, søknadsmateriale og enkel CRM i én MVP-flyt. | Gir praktisk nytte fra analyse til søknad uten å bygge alle langsiktige funksjoner. |
| R-002 | Lokal pilot før nødvendig skydrift. | Reduserer kostnader; maskinkapasitet og AI-kjøreform må avklares. |
| R-003 | Én kontrollert eksportmal fremfor vilkårlig DOCX-layout. | Begrenset rendringsrisiko; original beholdes, men layout bevares ikke nødvendigvis i ny eksport. |
| R-004 | Tekstimport som garantert annonseinntak; URL-import som tillegg. | Jobbsøkingen kan fungere selv om en kilde blokkerer henting. |
| R-005 | Bare godkjent kandidatgrunnlag i eksporterte faktapåstander. | Reduserer oppdiktning; effektiv claim-gjennomgang blir nødvendig. |
| R-006 | Ingen fremtredende totalscore i første versjon. | Prioriter forklarbare vurderinger per krav fremfor falsk presisjon. |
| R-007 | Utsett Kafka, Temporal, Redis og pgvector til dokumentert behov. | Mindre drift og raskere pilot; varig jobbtilstand er fortsatt nødvendig. |
| R-008 | EU/EØS som føring for senere drift og databehandlere. | Reduserer noen personvernkomplikasjoner; erstatter ikke leverandørvurdering. |
| R-009 | Native frontend/backend og mulig lokal AI på Apple M1; PostgreSQL i container. | Pilotmaskinen har 16 GB delt minne. Begrens samtidighet og valider modellkvalitet før leverandørvalg; se LOCAL_DEVELOPMENT.md. |

## Formelle arkitekturbeslutninger senere

The [ADR index](adr/README.md) is the authoritative list of accepted/proposed architecture records. ADR 0013 records local identity/basic profile ownership. Production identity and private-document processing still require separate decisions.

Arbeidsmåten er `main` med korte arbeidsbranches, uten permanent `development`, valgt under den delegerte instruksjonen om å fortsette. Se [Git-arbeidsflyten](GIT_WORKFLOW.md). Branch protection er ikke konfigurert.

## Accepted implementation decisions — 2026-10-07

- D-015: Use TanStack Query and shadcn/ui for frontend work, as explicitly requested by the user. Next.js routing stays in place; further TanStack packages require a concrete need. ADR-0009.
- D-016: Use NAV’s official free vacancy API for the first URL adapter. Do not scrape FINN or Arbeidsplassen websites without permission. Public experiment token is for the local pilot; production registration/compliance remains pending. ADR-0008.
- R-012: Investigate Groq Browser Search as a possible additional source capability. The user’s Playground result is a useful UX example, not independently verified source evidence or proof of API/free-tier availability.

## FINN Browser Search — 2026-10-07

D-017 (Accepted, local pilot): Support modern FINN job URLs through Groq's documented browser_search capability using the existing key/model. Separate provider-mediated source retrieval from structured analysis; use exact-link tool output only, show provenance and potential incompleteness, and bound attempts. The earlier R-012 investigation is completed for API feasibility, with production terms/quota questions remaining. ADR-0010. No plan upgrade, paid fallback or direct FINN website scraper.

## Compact analysis and profile-first follow-up — 2026-10-07

D-018 (Accepted delegated UI decision): use compact grouped tiles/category filters and the official shadcn Dialog for per-requirement inspection. Keep quote/category guidance/source context distinct; no new model calls. TanStack Query/shadcn remain mandatory.

R-013 (Recommended implementation sequence): after the compact-result delivery, prioritize identity/PostgreSQL/manual profile → bounded CV import and claim confirmation → evidence-based matching/CV recommendations. These are multiple small PRs. Template upload precedes layout-preserving rendering/export; the latter is not claimed as part of upload. ROADMAP.md now consolidates actual implementation status and the next three deliveries instead of stale merge-pending entries.

## Direct URL analysis and sourced job overview (2026-10-07)

Selecting **Analyze link** retrieves the public advertisement and immediately analyzes the retrieved text. The previous mandatory import/review step is superseded by the product owner's explicit instruction. Manual pasted text remains editable. Retrieval and analysis each keep their existing concurrency, quota, validation and error boundaries; there are no automatic retries. If analysis fails after retrieval, the text remains available under Paste text for retry without another search.

The overview contains up to ten useful, variable facts: employer description, role/responsibilities, deadline, location/work model, contacts, benefits, salary or application process when explicitly present. Every fact carries a verbatim source quote. Missing data is omitted with an explicit notice rather than guessed. Quote membership validation establishes provenance, not semantic correctness of the AI's paraphrase. Browser excerpts can still be partial/stale; this limitation and the original link remain visible. Full source text is expandable, not a required intermediate screen. Requirement tiles/details remain unchanged.

No candidate matching, private profile storage or company research is implied by this overview. All extracted facts are AI suggestions from the advertisement. Existing source quotes and optional source review remain available; older mandatory review instructions do not apply to this flow.

## 2026-10-07 — Opt-in PostgreSQL foundation

Accepted: implement local PostgreSQL Compose, Flyway migrations and real migration tests as the next profile prerequisite. Preserve public-ad startup without a database. Use JDBC first; no need for JPA before domain repositories exist. Initial identity/profile schema establishes integrity, not authorization. OIDC/owner enforcement and profile UI follow separately. See ADR 0011.

## 2026-10-07 — Source formatting and provider rate limits

Accepted: preserve exact source proof while handling wrapped FINN titles, normalize emphasis before AI extraction, expose partial evidence omissions, reuse fetched text on manual retries and propagate provider cooldowns. This supersedes all-or-nothing quote rejection for well-shaped results with independently valid cards. Shape/bounds validation and all-unsupported rejection remain. No automatic retries or paid upgrades. See ADR 0012.

## 2026-10-07 — Inspectable paced analysis before profile work

Accepted, explicit product-owner priority: finish a working, observable URL → analysis → usable result loop before the next profile/CV milestone. Use a truthful staged loader and decorative document/cards animation, a default configurable 10-second pause after FINN retrieval, stop/resume without refetching, and collapsible development diagnostics with sanitized console events. NAV/pasted text normally skip this inter-Groq pause. Source bodies can be explicitly inspected in the UI but never added to logs.

The delay is a browser-side UX/pacing policy, not account-wide rate-limit enforcement or a token availability forecast. Keep existing reactive provider cooldowns, manual retry and backend bounds. No new queue, provider calls, paid upgrades, dependencies or persisted diagnostic data. Production hides diagnostics unless explicitly opted in at build time. See DEBUGGING.md.

## 2026-10-07 — Right-side diagnostics and owned basic profiles

D-019 (Accepted, explicit UI requirement): move development diagnostics into the official shadcn Sheet, opened by a right-edge DEV tab. Keep it nonmodal so analysis remains usable while inspecting progress. Reuse the existing Radix dependency; no extra AI calls or diagnostic persistence.

D-020 (Accepted, delegated local-pilot decision): use optional local Keycloak with Spring Security OIDC/PKCE before storing career evidence. This provides real authentication without a paid provider or custom password service. Implement owned name/language/revision first, with CSRF, same-origin proxies and PostgreSQL isolation/conflict tests. No private data goes to Groq. Production IdP, HTTPS and private-document/privacy policy remain separate work. See ADR 0013 and IDENTITY_SETUP.md.


## 2026-10-07: approved delivery scope and defaults

Accepted: finish the sourced two-column job overview, manual competency review and initial CV/source import. The owner clarified that this request does not add saved jobs or personal matching. Narrative ad sections use original quotes; contact/location/deadline have stable unknown slots. Retain received advertisement text when AI validation fails rather than suppressing the advertisement. Keep strict evidence checks and the existing two-call FINN flow.

Accepted local defaults: 100 owned claims, 20 documents, latest 20 revision snapshots in responses; explicit owner confirmation, edit invalidation and permanent claim-history deletion. Use local DOCX/PDF extraction and user-selected exact source excerpts, without private Groq processing or paid infrastructure. Original/template retention precedes layout preservation/generation. Document deletion detaches source references but leaves created claim quotes as explicitly explained in the UI. See ADR 0014/0015; production privacy/backup policies remain open.

## 2026-10-07 — AI summaries from all competency documents before merge

Accepted, explicit owner instruction: extend this same CV/competency branch before main merge with opt-in Groq summaries and source-backed proposals from uploaded CVs and other competency documents, individually or together. Preview/edit and per-run provider approval are explicit; upload makes no AI call. Validate quotes against the identified owned source and submitted excerpt, persist the latest owned result, preserve previous analysis on failure and save chosen claims as UNVERIFIED with separate confirmation. Use one bounded call, existing free-tier credentials, no new dependency/paid upgrade and no automatic retry. ADR 0016 supersedes ADR 0015 private-AI deferral for this local pilot; external rollout/privacy remains unresolved.

## 2026-10-07 — Competency workspace and recoverable document reading

Accepted, owner requested a UX/UI rethink and better extraction before advancing. Keep TanStack/shadcn, separate source review from suggestions in a wide Sheet, show recorded-data status counts/search and document readability. Redistribute the bounded AI input budget across complete short documents and start/middle/end passages of long ones; permit up to twenty concise proposals, with exact source attribution and separate user review. Do not promise exhaustive reading or auto-confirm. Add owned existing-original rereading and explicitly requested free local Tesseract OCR for textless PDF pages, without a cloud OCR provider/new JVM/npm dependency. Preserve originals/claims, invalidate changed-source analyses and reject stale in-flight saves. See ADR 0017; scan support remains bounded and optional.

## 2026-10-07 — First CV export uses a standard template

Accepted, explicit product-owner answer: use a controlled clean standard template for the first DOCX/PDF export and always preserve the uploaded original. This resolves the initial layout priority in Q-004. Arbitrary imported DOCX-layout adaptation is a later capability, not a requirement for first export. Bind approval/export to versioned content and template; do not infer application submission from download. Template design/language details can use Norwegian-first/English defaults. Export is not implemented by this workspace branch.

## 2026-10-07 — Personal matching approval and local pilot hosting

Accepted, explicit owner answers: personal job matching may send relevant CONFIRMED competency statements together with advertisement text to Groq only after a visible editable preview and approval for each analysis. Existing document-analysis consent does not authorize this future flow. Keep UNVERIFIED/INFERRED items separate, minimize shared personal details and preserve evidence/revisions in any future comparison. Matching remains unimplemented; define its owned endpoints and tests in a separate increment.

Accepted: the first working pilot runs locally on the owner's Mac; online hosting follows later. No deployment, paid infrastructure or plan upgrade is authorized. Routine UI, testing and implementation decisions remain delegated. Backup/export and production provider/privacy decisions remain open before broader rollout.
