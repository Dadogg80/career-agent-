# Beslutningsregister

## Task-specific AI model choices — 2026-10-14

Accepted: use the owner's existing full selector as the canonical catalogue in every AI-call model menu: Groq `openai/gpt-oss-20b` and `openai/gpt-oss-120b`; Gemini `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash` and `gemini-3.8-flash`. Route choices through their provider-specific protocols; do not silently omit these models from structured-generation tasks. The resumable document workflow remains one approved provider/model plan for both extraction and profile synthesis, so choices must work for both stages. Configured-key status is not a promise of live model access, quota, quality or availability. Preserve defaults, per-recipient approval, budgets, saved work and explicit recovery; never rotate models automatically. Show safe task-specific failure categories and downstream document-validation outcomes without exposing provider payloads.

## Saved-job presentation — 2026-10-12

Accepted: reuse existing owner-scoped saved-match queries and score calculation, improving presentation without triggering AI or changing scoring. Show stale/provisional states in text as well as color. Identify both Gemini/Groq browser excerpts as excerpts; retain unknown facts instead of inferring employer/deadline. Search/sort are local and deterministic; a single visible card receives full desktop width. Separate the primary apply class from the outline/open class that previously forced dark text onto a dark green background. Explicit header/content classes match the actual local Card API instead of nonexistent data-slot attributes.

## DEV panel placement — 2026-10-14

Accepted: mount the local DEV diagnostics panel only alongside the AI workflow it inspects. Keep it off saved-job/document/profile/dashboard/CV/application overview pages; show it in job analysis, an opened saved-job match, active document analysis and CV preparation. Scope opened-job calls to that job and document calls to the active workflow. The prior global `Foundation` mount caused the overview-page leakage. This keeps diagnostic context aligned with its owner and avoids a global panel that obscures unrelated navigation.


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

ADR 0037 extends the FINN retrieval choice without replacing the Groq default: the user may separately select Gemini 3.8 Flash URL Context or Groq Browser Search for public FINN links. Retrieval and analysis approvals remain distinct; exact-URL retrieval and citation checks are mandatory, and Gemini output is labeled as an AI-prepared excerpt. No automatic fallback or paid upgrade is authorized.

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

D-021 (Accepted, explicit profile UX request): add an optional private profile photo to the signed-in owner's compact profile identity card. Accept bounded JPG/PNG input, validate and normalize it server-side, store the JPEG against the existing profile owner, and serve it uncached only through authenticated same-origin proxies. Photo changes do not change profile facts/revision and do not enter AI requests. Keep profile preferences limited to existing name/language until additional personal data and visibility are explicitly designed. See ADR 0036.

D-022 (Accepted, explicit developer-tool request): provide one local DEV Sheet beside relevant AI workflows that shows actual instructions, user input, schema/tool configuration and provider response. Do not surface it on unrelated workspace pages or the saved-job list; an opened saved-job match panel filters calls to that exact job. Private text capture is off until explicit in-app start, restricted to loopback diagnostics, never logged/persisted, bounded to 200 calls/12 million characters, expires after 10 minutes, and automatically stops after 30 minutes. Stop preserves the short-lived buffer for inspection; clear deletes immediately. Keep the existing public-ad event log content-free and separate from this local private-content trace. No live AI request is made by opening the panel.


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


## 2026-10-09 — Lightweight workspace onboarding

Use existing owned metadata queries and a local optional tutorial for next-step guidance. Do not infer match readiness from saved-job existence, require a separate competency selection or start unapproved AI work. Unavailable metadata remains unknown. Keep guide position transient rather than introducing a persisted journey state. This is a UI slice, with no migration or provider/default change.

The owner requested lower development token consumption: prefer affected checks, terse output and no live provider test calls by default. Retain required CI validation and meaningful checks; local tests do not themselves spend provider tokens.

## 2026-10-09 — Job-specific wording proposals

Accepted implementation slice: [ADR 0031](adr/0031-job-specific-cv-wording.md). A dedicated owned preparation page connects saved jobs/current full-profile matching to a separate approved AI writing request. Exact source passages and confirmed-reference indexes constrain output, while semantic wording remains a user-reviewed draft. Review state is explicitly page-session-only; no original, knowledge fact or CV version is written. Broader visibility/recruiter assessment and durable changesets remain pending.

## 2026-10-09 — Requirement coverage and persistent answer review

Accepted implementation slice: [ADR 0032](adr/0032-requirement-coverage-and-clarification-review.md). Request distinct whole-source requirements and preserve up to 128 across the joined pipeline. Separate absent AI assessments from personal questions and label incomplete coverage provisional. Persist/reuse personal answers with revision-aware editing, and provide compact source tables and help. Do not equate personal confirmation with direct requirement relevance or silently retain previous model classifications as facts. No migration, automatic retry, provider default change or destructive duplicate cleanup.

### 2026-10-09 — Source-backed evidence relations and application guidance

Accepted ADR [0033](adr/0033-match-evidence-relations.md): new matching output distinguishes DIRECT/TRANSFERABLE/UNKNOWN and FORMAL/PRACTICAL/OTHER. Apply conservative classification guards without inventing positive qualifications or actual gaps. Store nullable metadata in existing result JSON, retain legacy shape/readability, and derive compact application priorities from saved sources without extra AI calls. The relation/nature remain AI judgments; base-CV visibility and semantic factual verification are not completed by these tags.

The owner additionally requested clearer clarification confirmation/rejection UX. Reuse the existing revision-checked claim review API and all owned answer statuses for display. Rejection is an excluded statement, not negative competency evidence or an actual skill gap. Keep history and allow deliberate same-entry correction/reconfirmation. Compact writing-scope aids are local guidance, not persisted match classifications.

## 2026-10-09 — Source-bound base-CV presentation review

Accepted [ADR 0034](adr/0034-base-cv-visibility.md). Combine visibility and wording in the same recipient-approved request. Require exact CV citations and current criterion evidence; uncertain matching cannot become an established CV presentation gap. Missing/invalid visibility becomes unassessed while valid proposals remain usable. Read-only compact review does not confirm facts, change percentages or write originals. Semantic quality, durable changesets and tailored files remain future slices.

## 2026-10-09 — Approved wording plain-text handoff

Accepted [ADR 0035](adr/0035-reviewed-cv-text-handoff.md). Offer explicit local preview/copy from the exact base source and approved changes, preserve untouched text and reject stale/current-invalid output. Clipboard denial is recoverable through the preview. No persistent CV version, original mutation, provider request or profile confirmation is implied.

## Source-neutral advertisement details — 2026-10-09

Accepted [ADR 0038](adr/0038-source-neutral-advertisement-details.md): literal received-text practical fields supplement partial AI results and saved snapshots; conservative source wording governs new requirement importance. No provider default, consent, URL adapter or database migration changes. Complete original received text remains available, with explicit disclosure of missing details and existing snapshot bounds.

### AI configuration recovery — implemented 2026-10-09

Shared model selectors expose metadata retrieval failures and missing task configuration with an explicit retry of `/api/ai/config`. Recovery does not start an AI request, silently choose an alternate provider or reuse consent for a changed selection. Historical missing attribution is labeled as unrecorded. This is a frontend recovery improvement within the existing approval contract, with no new provider routing or persistence decision.

### Explicit base-CV identity — implemented 2026-10-09

Use the existing master-document designation for automatic CV preselection; otherwise require a source choice in application preparation. Upload order and filename are insufficient to establish CV identity. This frontend guard preserves all available confirmed matching evidence and existing backend source/consent validation. Short extraction guidance uses a bounded text-length check, not a semantic claim that a document is a complete CV.

### Shared profile-evidence freshness — implemented 2026-10-12

Use one frontend cache-refresh helper for competency mutations: invalidate owned claims and all saved-match query keys. Confirmed evidence is shared across jobs, so refreshing only the open job after an inline clarification is insufficient. Refetch active saved assessments through existing owned GET endpoints; keep inactive assessments invalidated for their next mount. Preserve server staleness/revision checks, historical results and explicit approval for AI reruns. This adds no provider call, score recomputation or persistence schema.

### Edit without advancing guided review — implemented 2026-10-12

An edit within a review queue saves an unconfirmed correction and returns to that item's confirmation view. Saving alone does not advance the queue or establish personal truth. The subsequent confirmation uses the saved revision. Existing individual edits outside the queue keep their behavior; source quotations and confirmation boundaries are unchanged.

### Results-first completed-document review — implemented 2026-10-12

Collapse processing/source-check details by default after completion, while keeping result review and a clear completeness limitation visible. Active/paused processing stays expanded. Preserve the mounted source-check subtree and all existing source/promotion actions; expanding details is local UI behavior, not a new analysis. No change to evidence, confirmation, model routing or budgets.

### Document display filters and CV-tailoring pause — implemented 2026-10-12

Library search/filtering uses metadata locally and does not change the collection used by combined analysis. Reading status remains technical, separate from competence truth/analysis status; unknown metadata is not a success indicator.

The owner requires advance notice and a joint discussion of their external assistant's flow before further CV-tailoring implementation. Document/profile/competency work continues; current CV functionality is retained. This explicit instruction overrides earlier continuation priorities.

### Long technology-list recovery — implemented 2026-10-12

Raise the local per-row item bound from 30 to 300, matching the existing retained-suggestion bound, so otherwise valid explicit lists are not entirely lost. Keep the 600-character row bound, per-label constraints, exact quotations, context proof, deduplication and total workflow limits. No new inference, provider request, storage migration or historical-result rewrite is introduced.


## Durable CV wording and approved roadmap — 2026-10-12

Accepted: retain existing providers, modules and truthful evidence model; extend CV workflow incrementally. The owner approved standard export first and automatic documentary profile information with explicit basis distinctions. Store generated source/match/model/prompt snapshots separately from user wording decisions under owner locks/expected revisions. New generation preserves earlier sessions. Review never promotes wording to knowledge facts or final document approval. Current bound: 30 private sessions per owner; latest session is exposed, older snapshots are retained. Session data follows saved-job/account deletion and may retain original source quotations after source-file deletion. Stable sections, historical-session selection/deletion, semantic edit validation and tailored artifacts remain follow-up scope.


## Preliminary source-bound CV section plans — 2026-10-12

Accepted under the approved incremental roadmap: use conservative explicit headings to group all existing passages with IDs bound to the exact source revision. Retain uncertain/mixed text as UNCLASSIFIED. Review every section in the existing approved call; missing/invalid/conflicting outcomes remain unassessed NEEDS_REVIEW. Keep recommendation, wording acceptance, factual truth and final document approval separate. Persist optional sections/plans without modifying legacy snapshots. A separate strategy approval stage and reliable DOCX template slots remain future work.


## Coverage declarations and conservative numerical wording — 2026-10-12

Accepted incremental checks: require full ordered section passage declarations on new AI responses; retained sessions keep immutable historical metadata. Validate numeric additions against original wording and referenced evidence, and retain original year-shaped values for classified history/education. Apply the same lexical rule to new ACCEPTED wording reviews; PENDING/REJECTED drafts stay saveable. These checks cannot verify semantics, units or factual truth. Do not present declared coverage or a passing numeric check as independent verification. No extra model calls, migration or model-default changes.

## Saved library metadata and contained model choices — 2026-10-12

Accepted: project source-specific metadata from the existing owned analysis/run records into the document list, with no extra provider calls or per-document full-run fetches. Prefer the latest saved result, using the run status for tied workflow/snapshot records; only completed non-partial processing earns the completed label. Counts include primary/additional source references and do not represent confirmed skills or exhaustive recall. Older results without model identities disclose unavailable identities. Existing changed-text reread/deletion invalidation applies.

Keep shared model menus in normal card flow with bounded scrolling rather than absolute overlays clipped by enclosing cards. Analysis details use a fixed portal tooltip to avoid the same clipping problem; mouse/focus/touch access, Escape/blur/resize dismissal, visible-anchor scroll repositioning, offscreen dismissal and viewport bounds are preserved. Career confirmation reuses existing mutations and revision rules with clearer fact grouping and edit/cancel actions.

## Reviewed wording handoff and explicit batch review — 2026-10-12

Accepted ADR 0041: reuse owned CV versions for immutable reviewed-text drafts, with exact substitution, complete source references and an explicit export gate. No factual promotion, original-file edit, generated artifact or final readiness claim.

Use a shared frontend confirmation selection for competencies/history, reusing existing revision-checked mutations sequentially. Snapshot rows/revisions on dialog opening; no auto-selection or silent rejected-record revival. Preserve successful rows across retries and show partial failures/progress. This is not an all-or-nothing backend transaction. Shared modal styling retains Radix focus/escape behavior and contextual widths. Public model menus are positioned using trigger/viewport geometry, while document menus stay in card flow to avoid clipping.

Queued owner request: choose individual generated profile sections for a durable presentation. Existing summary edits remain tied to the latest saved analysis; no adoption state is claimed in this delivery.


## 2026-10-12 — CV tailoring readiness guidance

Keep tailoring consent unavailable until the existing evidence/source/current automatic-match gates pass. Explain active blockers beside consent rather than weakening source freshness. Source refresh temporarily blocks new consent while checks run; recovery buttons only reload metadata or open existing review, never start an AI request.


## 2026-10-12 — Selected presentation sections and Documents navigation

ADR 0042 accepts an owner/language presentation row with six selected section kinds and revision-checked source snapshots. New document analyses never silently mutate it; wording selection is independent from competency/history confirmation. Dedicated Documents navigation is the next owner-authorized slice.


## 2026-10-12 — Project history extraction correction

Allow empty organization only for PROJECT, where own work may have no employer/organization. Never fabricate employer identity or month precision to satisfy validation. Request a separate PROJECT draft for each explicitly named project with candidate work; contents-only headings are not experience. Dated experience coverage must cite history entries rather than competency/profile quotes. Existing opt-in follow-up bounds remain unchanged.


## 2026-10-12 — Dedicated library and retained profile review

Reuse DocumentPanel in library and compact-review modes. Both open the existing workflow; old profile hashes remain valid. Model switching requires renewed consent. Move only uploads/overview, preserving original storage/endpoints/statuses and all profile review capabilities.


## 2026-10-12 — One profile presentation and direct main CI repair

Use one profile presentation, preserving explicit selection as the source of its content. Remove the latest-synthesis profile fetch/display. Reuse established presentation styling and maintain document-summary editing/adoption; do not promote new AI wording into selection automatically.


## 2026-10-12 — Reviewed CV file drafts

ADR 0043 extends reviewed-text drafts with immutable standard DOCX/PDF previews. Mechanical character readback must pass before artifacts are stored; source/revision guards are rechecked under the owner lock. DRAFT remains distinct from final document approval. No migration or provider call is needed.


## 2026-10-13 — Joined journey quality and CV coverage

Accept ADR 0044: preserve DOCX paragraph boundaries for new extraction/explicit rereading and consistently support 40 bounded wording proposals. Never migrate stored source indexes silently. Invalid proposals cannot establish complete section review. Contacts/match-repeatability/component design audit continue under docs/JOURNEY_QUALITY_REVIEW.md.


## 2026-10-13 — CV passage review transparency

Reuse existing source-bound section plans/proposals for a read-only passage ledger. Never infer individual keep/completed review from a whole-section plan or proposal absence. Show original AI wording separately from the existing user-edited/approved proposal cards. No new API, AI call or persistence fields.


## 2026-10-13 — Individual CV passage assessments

Accept ADR 0045: validate and persist optional source-bound individual passage plans in the existing approved call; invalidate complete section declarations if any unit is incomplete. Preserve legacy snapshots and separate AI reasoning from user acceptance. CV-only output ceilings become 16,384 tokens for Groq/Gemini; no additional calls or global model/default changes.


## 2026-10-13 — Regular Gemini Flash selection

The owner approved regular Flash 3.6 as the default Gemini job/match fallback and selectable Flash alternative, retaining Flash-Lite defaults, Groq defaults, source retrieval and explicit environment overrides. Provider availability and quality require separate validation; no additional model family, automatic fallback or billing change is authorized.

## 2026-10-14 — Logical CV source units and geometric PDF paragraphs

Accept [ADR 0046](adr/0046-logical-cv-source-units-and-pdf-paragraphs.md): create bounded application-owned UTF-16 source ranges only for new tailoring generations and reuse them throughout planning, review and assembly. Recognized identity/headings/dated entry headers stay protected. Optional metadata lives in existing immutable JSON; absent/null preserves the legacy algorithm and indexes, while invalid stored ranges fail closed. PDFBox paragraph gaps change only new extraction/explicit rereading, with original bytes preserved. Conservative geometry/context labels do not establish template fidelity, exhaustive recall or factual truth. Retain full confirmed evidence, existing consent/defaults and one-call budgets. Bundle related source-quality corrections in one coherent PR, use focused validation and do not merge automatically.


## Source model selection extension — 2026-10-14

Accepted owner request: expand only the public-source chooser to the application's six supported Gemini Flash/Lite IDs plus Groq 20B/120B, preserving defaults, explicit overrides and independent approval fingerprints. ADR 0037's dated extension introduces generateContent URL Context for the additional Gemini choices with same-candidate exact-URL SUCCESS metadata and STOP text. The existing 3.8 Interactions citation contract remains unchanged. Metadata is not an independent output citation or completeness proof. No dynamic unbounded catalog, automatic fallback, private-task expansion or billing change.


## CV continuity and repeated source labels — 2026-10-14

Implementation correction within ADR 0046/0023: repeated geometric right-column starts anchor skills grids even when a longer cell narrows the gutter. Known metadata label/value rows retain row association. Compound conjunction prose is not an undated entry header; unfinished wrapped contributions retain their entry. For multi-passage evidence, require one distinct literal source span within the existing bound; reject competing spans and retain field/ID/quote limits. Do not widen limits or rewrite saved sources/ranges to hide extraction errors.

## Whole-criterion and localized wording instructions — 2026-10-14

Refinement of the accepted matching/CV standard, not a new architecture: assess complete literal scope and stated alternatives; keep unsupported qualifiers unresolved rather than promoting keyword overlap. Explicitly request the selected language for all user-facing wording/review fields and complete protected-unit declarations. New source-unit wording snapshots use v7; previous v5/v6 snapshots remain readable and unchanged. A match classification is never an additional confirmed fact. Existing reference/lexical checks are not semantic entailment validation; bounded follow-up results retain that quality limitation. Model defaults, complete evidence inclusion, explicit consent and provider routing remain unchanged.

## Match-bound visibility and structured request rejection — 2026-10-14

Reuse the existing match/result IDs and source metadata to display relevance alongside CV visibility. Do not infer full qualification from visibility or substitute the latest match into an older CV result. This adds no persisted assessment snapshot or automatic reanalysis; an overwritten old assessment remains explicitly unavailable.

Groq structured HTTP 413 becomes AI_REQUEST_TOO_LARGE/413 rather than AI_UNAVAILABLE/503. Preserve only the safe code through the affected proxies, exclude provider text and Retry-After, and do not create a quota cooldown. Request-size rejection can reflect provider request/token capacity; no fixed account limit or automatic evidence truncation is introduced. Existing explicit model/recipient approvals govern recovery. No model defaults, schema migration or new provider calls are required.


## Optional saved-wording source opinion — 2026-10-14

Accepted incremental continuation: [ADR 0047](adr/0047-optional-wording-source-review.md). Use a separately approved review of saved draft wording rather than treating lexical guards or generation judgments as semantic proof. Reuse existing owned sessions, task routing/model choices and safe error handling. Results remain read-only, revision-bound AI opinions; no automatic acceptance, factual promotion, extra generation call or final-file approval is introduced.


## 2026-10-14 — Bound optional review output; defer shared evidence dictionaries

Accepted refinement of ADR 0047: the optional review sends complete per-draft evidence and known entry context, with a request-local output reservation of max(2,048, min(16,384, 1,024 + 384 × proposal count)). Existing task defaults, provider selection, consent and source/revision guards remain unchanged. Both structured provider protocols must honor an explicit limit; unsupported adapters fail closed. No evidence trimming or automatic retry/fallback is introduced.

A private six-call comparison used independent synthetic expectations and frozen real-document excerpts. Both models passed the synthetic controls, but actual excerpts exposed incorrect support and quote/language failures. Experimental shared dictionaries reduced bytes only when sources repeated; semantic outcomes varied across model/format. Defer that representation change rather than treating byte savings as proven quality preservation. These findings do not establish a universally superior model or final-file safety. Source opinions remain advisory.


## 2026-10-14 — Source-only judgments with numbered citations and localized issue explanations

Accepted ADR 0047 v2 refinement. Initial generation retains job requirements and full supported evidence; the optional factual-support opinion uses only saved wording, linked confirmed source text and known entry scope. Exclude original CV wording, advertisement criteria, skill-label metadata and previous model judgments from this extra call. Supply all source statement/context text as numbered literal passages with preserved IDs/revisions and qualifiers. Validate references against the individual draft, rather than allowing provider-written quotation text.

Use typed findings and short verbatim problematic draft phrases to render bounded app-owned Norwegian/English reasons. This guarantees explanation language and literal source provenance for valid items, not correct entailment. Preserve partial unassessed recovery, current ownership/source/revision checks, recipient-bound consent, existing output/count budgets, no retries and unchanged public/factual states. Four frozen comparison calls exposed continuing Groq scope errors; no automatic verification, model-default change or best-model claim is authorized by these results.

## 2026-10-15 — Initial wording evidence contract (ADR 0048)

Accepted [ADR 0048](adr/0048-initial-cv-proposal-source-excerpts.md): new v8 generations retain complete claim text, separate job/relevance metadata from proof, require exact per-claim proposal excerpts and persist them additively. Preserve existing sources, legacy snapshots, full evidence, one-call consent and defaults. Controlled generation still produced unsupported specialist wording with literal citations, so this decision establishes provenance only; semantic correctness and useful group reasoning remain unresolved.


## 2026-10-15 — Explicit OpenAI generation provider (ADR 0049)

Accepted [ADR 0049](adr/0049-optional-openai-responses-provider.md): reuse AiModel/routing/consent with a separate OpenAI Responses adapter, unchanged generation prompts and source validators, no retrieval tools/default changes/fallback, and dated token-derived cost estimates. Managed cloud credentials use CAREER_OPENAI_API_KEY because OPENAI-prefixed names are reserved there. Current authentication failures are not model-quality results; the approved comparison remains pending. No six-point pipeline improvement or official release is authorized by this provider addition.

## 2026-10-16 — Measured extraction and alternative-criterion corrections

The owner authorized a private live comparison of advertisement analysis, complete-document extraction and personal matching across Groq, Gemini and OpenAI, plus fixes demonstrated by the comparison. The first comparison has an OpenAI ceiling of USD 2; it does not authorize changing defaults, paid-plan upgrades, factual confirmation, release or merge. Private originals, expected facts, request/response snapshots and experimental match inputs remain outside Git and application persistence.

New advertisement results preserve short, simple source OR alternatives as one literal criterion; compound clauses remain subject to semantic review. A separately named preferred example following `gjerne`/`helst`/`preferably` retains scoped preferred importance without weakening the general capability. Extraction instructions explicitly cover duties independently of qualifications. Document list recovery recognizes additional common skills-grid subsection headings and language labels sharing a table row with their heading. Source quotations and factual-review rules remain authoritative. Document instructions prioritize each role's introductions/contributions and require the existing nonempty institution/employer fields; matching instructions explicitly respect an employer's sufficient interest/experience alternative. These instructions are not semantic guarantees or automatic factual promotion.

A measured intermediate result improved technology recall while reducing work-contribution recall. Keep those dimensions separate; successful JSON, item counts, source citation and high match percentages do not establish completeness. Assess provider/schema failures separately from successful-output quality. No new provider fallback, automatic retry, schema migration, stored-source rewrite or CV-tailoring behavior is introduced.

The repeated private controls also demonstrated intermittent omission of entire duty sections despite explicit instructions. New analyses therefore recover bounded literal rows from recognized duty-section headings without an extra model call, preserve original quotes, suppress already represented rows and retain the existing 128-criterion limit with omission reporting. This narrow structural recovery does not infer qualifications or claim arbitrary-heading/semantic completeness. Wrapped comma/conjunction skills lists retain their final short multiword item; a following narrative is not treated as a new list item.

## 2026-10-16 — OpenAI reasoning and generation headroom

The owner authorized medium/high reasoning, larger configurable output budgets and a fresh private OpenAI comparison. Default reasoning is medium; output defaults are 32,768 tokens except 16,384 for profile summaries, with global/task overrides up to 65,536. Explicit smaller per-call bounds remain authoritative. The owner limited provider waits to five minutes: configurable 30–300 seconds, default 300. AI proxy requests allow five seconds of transport margin, while ordinary reads retain their short bounds. Sequential document workflows may take longer overall. No automatic retry, model fallback, provider-default change or evidence/consent relaxation is introduced.

Focused verification: 11 backend OpenAI adapter tests, two frontend OpenAI contracts and TypeScript checking passed. The fresh private benchmark uses equal medium reasoning and token/time budgets; earlier attempts are retained separately for cost accounting. Quality conclusions remain fixture-specific until held-out professions/layouts are tested.
