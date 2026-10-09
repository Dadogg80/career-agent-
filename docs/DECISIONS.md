# Beslutningsregister

Confirmed records explicit user requirements; recommendations record design proposals. Implementation has started, and the user has delegated routine choices. Accepted implementation decisions identify their scope and do not imply that the full MVP is approved or completed.

## Bekreftede føringer

### Knowledge-model review and maintenance — 2026-10-08

The owner supplied a review explicitly requesting a pause in document/profile feature implementation and a relational knowledge-model proposal before further implementation. The [proposal](CAREER_KNOWLEDGE_MODEL_PROPOSAL.md) covers schema, aggregates, staged migration, legacy compatibility, scoped confirmations, source conflicts and deletion. Its policies and schema remain PROPOSED, not accepted or implemented. Unfinished full-document/PDF experiments are unpublished. Existing advertisement analysis and quota-handling defects are separately authorized maintenance. Per-capability model selection is a possible next experiment, not an implemented automatic fallback or a confirmed independent-quota strategy.

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

## 2026-10-07 — Reviewed history and product entry redesign

Accepted delegated implementation: add a small reviewed typed career-entry model before standard CV export, distinguishing titles, delivery roles, organizations/clients and known versus unknown periods (ADR 0019). Reuse profile ownership/revisions and separate review; no AI auto-confirmation.

Accepted explicit UX direction: the pilot needs a public landing page, dedicated sign-in and an intuitive consistent workspace, with freedom to improve functionality and usability. Use fixed existing OIDC callbacks to dashboard/sign-in, retain deliberate guest analysis, show actual overview data, and use the required shadcn/TanStack foundation (ADR 0020). CV and CRM remain the next working destinations; do not advertise unfinished routes. Keep changes local and unpublished as requested. Meaningful browser/backend checks and visual review precede completion claims.

## Local pilot recovery, evidence and materials — 2026-10-08

Accepted under the owner's autonomous pilot instruction: received source text takes priority over successful AI structuring; use labelled local fallback without extra provider calls. Extend evidence imports with bounded UTF-8 TXT/Markdown, conservatively deduplicate identical experience while preserving sources/company context, and expose long-document windows with approval per call. Standard CV export and manual application cases follow the owner's earlier template/local-hosting decisions. These features do not introduce paid services, automatically confirm competencies or submit applications. See ADRs 0021/0022.

## Source-selected competencies and local document checks — 2026-10-07

Accepted under the owner's request to test actual uploaded evidence: separate literal document extraction from generative writing. The model selects numbered evidence; the application supplies source wording, validates skill labels and nearby same-document context proof, and exposes unknown associations. Reopened old suggestions obey this presentation rule without altering saved claims. Add a read-only original/text/quote check and smaller optional detail windows, without provider retries, automatic confirmation, paid services or publication. See ADR 0023. A green technical check never claims semantic or exhaustive correctness.


## Resumed document/profile review — 2026-10-08

The owner explicitly resumed the planned implementation and reiterated automatic whole-document processing, prefilled career history, editable AI summaries/competencies, improved profile navigation, PDF readability, model configuration and the incremental domain model. Accepted implementation scope is ADR 0024. Keep existing disclosed source-deletion semantics, per-run provider consent and explicit factual confirmation. Task model overrides are implemented but defaults remain unchanged pending live quality comparison; there is no automatic quota fallback. The full proposed domain schema is not accepted wholesale. The latest development instruction to defer publishing remains in effect for this branch.

## 2026-10-08 — Gemini and related knowledge quality

Accepted: Gemini adapter behind explicit task routing, recipient/model-bound private approval and independent cooldowns (ADR 0025). Gemini-specific first model is stable 3.5 Flash after synthetic pipeline verification; 3.8 Flash returned 503. Existing unset-provider behavior remains Groq. Prioritize whole-document/PDF quality → competency coverage/deduplication → profile/history presentation. Keep this continuation unpublished. No paid upgrades or automatic failover.

## 2026-10-08 — Owner-directed provider recovery

Accepted: allow a user to retry an AI operation with Gemini after a Groq quota failure through a compact dynamic provider/model control. Use renewed private recipient approval and preserve existing evidence/progress; no silent model rotation or budget bypass. Implemented in ADR 0026. Native Gemini FINN retrieval is not part of this change.

Queued owner requests: automatic document-grounded profile population, automatic evidence selection for matching, explainable percentage scores, inline user clarification/confirmation and an incrementally refreshed AI presentation. The owner asked to distinguish document-confirmed facts from inferred skills. Current delivery retains explicit factual review; those domain/status changes are not yet implemented or claimed complete.

## 2026-10-08 — Documentary profile population and compact review

Accepted owner requests are implemented in ADR 0027: separate documentary/personal basis, atomic automatic literal imports and history drafts, persistent processed/pending queue, newest saved candidate presentation, automatic bounded matching evidence, explained percentages and inline personal clarification. This supersedes the queued status above for these specific capabilities, not the full semantic knowledge-model roadmap. No additional AI call is made for review decisions, local list recovery, presentation reads or initial evidence planning.


## 2026-10-08 — One skill card and independent contribution review

Owner-requested: consolidate the profile's repeated skill cards across contexts, using combined existing descriptions, preserving individual evidence and edit/review operations. No AI call or destructive record merge is needed for this presentation. Keep confirmed and draft content visibly separate. Extend ADR 0027 with independent manual-contribution identities, durable source blockers and conservative legacy review recovery; do not let a shared source quotation collapse unrelated decisions. Flash-Lite 3.5 is supported and passed the synthetic pipeline; retain configured defaults and renew approval when task models change. Antigravity is not a selectable model ID in this application's generateContent adapter.

## 2026-10-08 — Accepted Gemini Lite document/profile defaults

The owner explicitly accepted Lite where suitable following synthetic extraction/profile validation. Gemini document extraction and profile summaries default to `gemini-3.5-flash-lite` independently of a pre-existing general `GEMINI_MODEL`. Task-specific overrides remain authoritative. Job analysis and personal matching retain Flash, with their existing general fallback. Provider defaults and budgets are unchanged; no quota bypass or silent rotation. Existing Flash workflows require renewed model-bound approval before continuing on Lite; saved results retain their actual original metadata. This supersedes only the unchanged-model-default decision above.

## 2026-10-08 — Model selection and independent application cooldowns

Accepted maintenance: expose Groq, Gemini 3.5 Flash and Gemini 3.5 Flash-Lite as explicit choices for supported AI tasks. Bind each choice to its existing approval fingerprint; private tasks still require renewed consent whenever the recipient/model changes. Keep cooldowns per provider/model and share each across features using that same model. This prevents one model's application cooldown from suppressing another model, without bypassing provider-enforced project/account quotas or changing retry/budget behavior.

## 2026-10-08 — Source usage audit and bounded extraction follow-up

Accepted under the resumed document-quality request: inventory explicit source passages and compare validated quotation links, locally recover missed named list items and use one disclosed bounded follow-up round for other missing evidence. Defaults apply only to new consented runs, with at most four calls/two per document, preserved provider/model approval and normal quotas. Show remaining excerpts without calling the result exhaustive or confirmed. ADR 0028 records heuristics and limits.

## 2026-10-08 — Literal subsection context and explicit month endpoints

Accepted extraction correction within the resumed source-quality work: technical subsections retain a literal enclosing employer/project header only across compatible boundaries. Global sections and same-level Markdown sections reset it. Normalize explicit local/ISO month endpoints independently while retaining original periods and year precision. Reuse parsed heading inventories across batches/lists/coverage checks. Existing saved content and review decisions are not rewritten; no generalized context graph or conflict arbitration is introduced.

## 2026-10-08 — Revision-aware competency career context

Accepted small domain increment within the resumed document/profile work: add owned revision-linked competency/career events with exact unique shared documentary proof, explicit owner association/removal, tombstones and read-time stale checks (ADR 0029). Relationship decisions never change factual confirmation, do not require AI calls and do not rewrite existing job/CV snapshots. Broad conflict/catalog normalization remains proposed.

## 2026-10-08 — Offline expected-fact measurements and list continuity

Accepted small quality slice after verified PR #23: use a developer-only evaluator against independently chosen source-backed expectations rather than interpreting passage usage as competency recall. Match individual labels without collapsing punctuation-sensitive technologies; check employer/project fields, source identity, explicit month precision and reviewed prose terms independently. Additional source links can satisfy the same fact only for that linked document. Count unsupported literal evidence separately; uncatalogued output is not automatically unsupported. The evaluator does not judge every assertion in generated prose.

Replay local list-section state for normal approved portions and emit each full source row in the portion containing its end. This restores list recovery after a boundary without transmitting more data, adding calls or changing profile review. Existing budgets, output limits, recipient approval, provider defaults and source retention remain unchanged. A local test manifest and recorded analysis need no new production table/API. Private originals/results/checklists stay outside Git.

### 2026-10-09 — Complete confirmed-profile matching

Accepted for this continuation: use the entire supported confirmed competency set rather than ranked/manual 30-item selection. Pack identical literal passages once, preserving every skill/revision and exact validation; retain explicit per-run provider/model approval and all existing factual statuses. Saved job cards read the persisted deterministic requirement coverage. Profile additions invalidate new full-evidence assessments. See ADR 0030. Period/company conflict reconciliation is deferred until this owner-prioritized matching slice is verified.

## 2026-10-09 — Conservative career comparison (accepted implementation slice)

Derive possible period differences from already owned saved records in the browser, rather than asserting conflicts or introducing a full conflict graph. Require identical literal role/employer/client/delivery-role identity, known month endpoints (or explicit ongoing), overlapping intervals and unequal periods. Missing precision is unknown. Manual comparison allows broader company/project wording review without fuzzy identity inference. Sources retain their import revision and deleted-original disclosure; corrections use existing revision/CSRF-protected editing, invalidate confirmation and leave other records untouched. Closing retains both entries. No AI call, migration, automatic merge or durable dismissal decision is added. Generalized reconciliation and persistent keep-both decisions are later slices.

## 2026-10-09 — Adopt matching and tailoring product methodology

Accepted: the owner-supplied 71-section work-agent methodology is preserved as an English, profession-independent [product standard](JOB_MATCHING_AND_CV_TAILORING_STANDARD.md), with original section numbering, implementation matrix and testable delivery sequence. It is product behavior, not a giant runtime prompt. Existing owner decisions remain explicit: full confirmed matching evidence, recipient/revision-bound consent, unknown versus proven gaps, original preservation and standard-template export first. Source quality never silently overrides personal corrections.

Priority is the joined candidate journey through editable CV text proposals, with readiness guidance and optional onboarding/help. Tailored file/version creation, letters and final application-package readiness are deferred; the independent existing export is unchanged. New taxonomy, gap/visibility/recommendation enums and per-stage AI calls are target design, not implemented contracts. No new paid service, infrastructure, API, model default or auto-submission is authorized by adopting the document.

## 2026-10-09 — Job-specific wording proposals

Accepted implementation slice: [ADR 0031](adr/0031-job-specific-cv-wording.md). A dedicated owned preparation page connects saved jobs/current full-profile matching to a separate approved AI writing request. Exact source passages and confirmed-reference indexes constrain output, while semantic wording remains a user-reviewed draft. Review state is explicitly page-session-only; no original, knowledge fact or CV version is written. Broader visibility/recruiter assessment and durable changesets remain pending.

## 2026-10-09 — Requirement coverage and persistent answer review

Accepted implementation slice: [ADR 0032](adr/0032-requirement-coverage-and-clarification-review.md). Request distinct whole-source requirements and preserve up to 128 across the joined pipeline. Separate absent AI assessments from personal questions and label incomplete coverage provisional. Persist/reuse personal answers with revision-aware editing, and provide compact source tables and help. Do not equate personal confirmation with direct requirement relevance or silently retain previous model classifications as facts. No migration, automatic retry, provider default change or destructive duplicate cleanup.

### 2026-10-09 — Source-backed evidence relations and application guidance

Accepted ADR [0033](adr/0033-match-evidence-relations.md): new matching output distinguishes DIRECT/TRANSFERABLE/UNKNOWN and FORMAL/PRACTICAL/OTHER. Apply conservative classification guards without inventing positive qualifications or actual gaps. Store nullable metadata in existing result JSON, retain legacy shape/readability, and derive compact application priorities from saved sources without extra AI calls. The relation/nature remain AI judgments; base-CV visibility and semantic factual verification are not completed by these tags.

The owner additionally requested clearer clarification confirmation/rejection UX. Reuse the existing revision-checked claim review API and all owned answer statuses for display. Rejection is an excluded statement, not negative competency evidence or an actual skill gap. Keep history and allow deliberate same-entry correction/reconfirmation. Compact writing-scope aids are local guidance, not persisted match classifications.

## 2026-10-09 — Lightweight workspace onboarding

Use existing owned metadata queries and a local optional tutorial for next-step guidance. Do not infer match readiness from saved-job existence, require a separate competency selection or start unapproved AI work. Unavailable metadata remains unknown. Keep guide position transient rather than introducing a persisted journey state. This is a UI slice, with no migration or provider/default change.

The owner requested lower development token consumption: prefer affected checks, terse output and no live provider test calls by default. Retain required CI validation and meaningful checks; local tests do not themselves spend provider tokens.
