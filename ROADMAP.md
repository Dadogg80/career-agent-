# Career Agent roadmap

## Saved-opportunity UI refresh — 2026-10-12

Implemented for review: readable primary action contrast; source-aware responsive cards; search and deterministic sorting; clear saved/provisional/stale/unmatched assessment panels and saved model identity. Existing weighted score and matching refresh rules remain unchanged. No backend/schema/default-model change. CV artifact integration and independent final document review remain the next substantive roadmap stage.


Status checked against remote main on 2026-10-09. Deliver tested slices of a joined user journey; a specification or branch is not a released capability. Do not assume authorization to merge subsequent PRs.

## Current status

Remote main `217192c` includes documentary profile imports, grouped skills, source-backed history, persistent competency review, candidate presentation and explained matching/inline clarification. PRs #20–24 add selectable Flash/Lite, source inventories, bounded follow-up, context/date corrections, revision-aware career links and offline expected-fact benchmarking. PR #25 includes the full supported confirmed profile automatically and shows saved coverage on job cards. PR #26 adds conservative period/source comparison; it does not persist conflict decisions.

## Current priority: joined journey through CV text tailoring

The owner adopted [the 71-section product standard](docs/JOB_MATCHING_AND_CV_TAILORING_STANDARD.md). That document maps product principles to current foundations, missing behavior and acceptance fixtures. Prioritize the following sequence over further isolated period-review work:

1. Review and test login → documents/profile → ad analysis → saved job → complete-evidence match; identify real UX and failure-recovery defects. Distinguish mocked browser, real persistence/identity and actual provider tests.
2. Add “Apply for this job” on cards/results, guided readiness, base-CV selection and clear upload prerequisites. This opens preparation and never submits externally. Introduce short page guidance, contextual help and an optional skippable tutorial.
3. Compare current-CV visibility with confirmed evidence and propose section/paragraph changes: exact old/new text, reasons, requirement/evidence references and approve/edit/reject. Review all relevant sections, not just the opening summary. Preserve the original; no new tailored CV file/version in this milestone.
4. Measure cross-profession requirement/evidence coverage, especially the current 12-requirement limit. Add explicit transferability, recruiter/hiring-manager assessment and positively evidenced barriers without confusing uncertainty with a real gap. Keep full confirmed evidence until a measured retrieval alternative is accepted.
5. Verify the joined flow again with mobile/keyboard UX, quotas, invalid/partial model output, unreadable documents, consent changes, missing/stale evidence and source reading order. Publish actual validation and remaining limits.
6. Later: tailored versions/export, application answers/letters, final package gate, discovery/interview support and online hosting. Durable period decisions and broader knowledge normalization remain later slices.

Milestone: a candidate reaches useful reviewed role-specific text proposals with minimal manual work. This is not APPLICATION_READY. Existing standard export and manual tracking remain available independently. The current preparation branch implements the apply entry, readiness/base-CV selection, a skippable local guide and evidence-linked old/new text proposals. Proposal review is page-session-only, not a durable changeset or exhaustive visibility analysis. Richer recommendations and broader tutorial coverage remain pending.

| Capability | Actual status |
| --- | --- |
| Next.js + Kotlin/Spring Boot, Norwegian default / English | Implemented and merged |
| TanStack Query and shadcn/ui foundation | Implemented, required by AGENTS.md |
| Public ad text analysis, NAV API and bounded FINN browser import | Implemented and merged; FINN excerpts may be partial/stale |
| Independent job-ad retrieval and requirement-analysis choices | Existing flow merged; expanded source choices locally implemented on `fix/source-retrieval-model-options`: six Gemini Flash/Lite and Groq 20B/120B. Lite 3.5 successfully retrieved an approved public FINN link; other model readiness is not established by catalog presence |
| Shared eight-model selector across structured AI tasks and supported source retrieval | Implemented locally on `feat/full-model-selection-and-document-diagnostics`; provider-specific structured/retrieval protocols remain separate, defaults and recipient-bound approvals are preserved, and configured keys do not guarantee live access or quality |
| Compact requirement filters/detail dialogs, pacing and DEV diagnostics Sheet | Implemented and merged |
| Explicit local AI prompt/input/schema/response inspection beside job analysis, opened saved-job matching, active document analysis and CV preparation, with bounded volatile multi-call capture | Implemented locally on `feat/full-model-selection-and-document-diagnostics`; overview pages do not mount the panel, and calls are scoped to the active job/document workflow. Focused verification is recorded in `docs/DEVELOPMENT_LOG.md` |
| PostgreSQL/Flyway and local OIDC/PKCE basic profile | Implemented and merged, PR #12 |
| Responsive document checks/reader, missed-passage recovery and compact profile identity with private photo | Implemented and locally verified: backend suite, frontend production build/typecheck and all 127 production Playwright tests pass |
| Wrapped FINN title repair / handled-error console warning | Implemented and merged, PR #13 |
| Two-column original-wording ad overview / visible ad on AI failure | Implemented and merged, PR #14 |
| Owned competency statements, explicit review and revision history | Implemented and merged, PR #14 |
| Local DOCX/PDF original upload, text inspection, master selection and source-selected claims | Implemented and merged, PR #14 |
| Opt-in single/combined document AI summaries and source-backed suggestions | Implemented and merged, PR #14 |
| Competency search/status dashboard, wider document review Sheet, improved source coverage and local rereading/OCR | Merged in the tested local pilot |
| Reviewed typed career history, role/client distinction and revision review | Merged in the tested local pilot; real PostgreSQL and browser checks |
| Public landing, dedicated sign-in, workspace overview and responsive navigation | Merged in the tested local pilot; production/development browser checks |
| Whole-document sourced profile/competency/history review | Merged in PR #16; explicit per-run approval and factual confirmation |
| Task-specific model configuration and safe token/cache usage logging | Merged in PR #16; default unchanged, synthetic Gemini validation passed |
| PDF character-spacing/column repair | Merged in PR #17; locally checked against seven unique private documents |
| Documentary profile imports, history drafts and persistent review queue | Merged in PR #18 (ADR 0027) |
| Candidate presentation, automatic matching evidence, percentages and inline clarification | Merged in PR #18; newest-analysis synthesis, deterministic coverage |
| Revision-aware competency-to-career links and compact review | Merged in PR #23 (ADR 0029) |
| Offline expected-fact benchmark and cross-portion list recovery | Merged in PR #24; main Foundation CI passed |
| Adjacent-skill inference, full normalized employment/project graph | Not implemented |
| Owned saved job snapshots and searchable library | Merged in the tested local pilot |
| Approved personal requirement-to-claim matching | Merged in the tested local pilot |
| Reviewed CV selection, preview and immutable standard DOCX/PDF export | Merged in the tested local pilot; real identity/storage and automated checks |
| Manual application cases, exact approved CV references, history and follow-up dates | Merged in the tested local pilot; real identity/storage and automated checks |
| Local advertisement recovery, richer received text, UTF-8 TXT/Markdown and conservative multi-source deduplication | Merged in the tested local pilot; real identity/storage and automated checks |
| Source-selected document competencies, context proof and local original/text/quote check | Merged initial evidence checks; current recovery/refinements tracked separately |
| Automatic CV rewriting, discovery, interview/academy/analytics and browser submission | Not implemented |

The current job-analysis branch also refreshes the workspace and independently routes advertisement retrieval and requirement analysis, with separate user approvals. The source menu now includes Gemini 3.5/3.1 Flash-Lite and 3.5/3.6/3.7/3.8 Flash, alongside Groq 20B/120B. Configured choices do not guarantee live capacity. Completed generation results require same-candidate exact-URL SUCCESS metadata; the existing 3.8 Interactions route retains its additional citation check. All results remain AI-prepared excerpts. NAV retrieval remains the direct NAV API, and no automatic provider fallback is used. Antigravity is not offered because no supported provider/API integration was confirmed.

The previous delivery scope was the three deliveries already listed: ad overview, competency review and initial CV import. Saved jobs/matching were excluded from that earlier delivery; the latest instruction authorizes publishing and merging the tested local pilot workflow. The owner subsequently added AI competency summarization across uploaded documents before merge. Upload/extraction remain local; a separately approved Groq call creates stored source-backed suggestions, and an explicit user save creates UNVERIFIED claims. See docs/CV_IMPORT.md and the actual validation in docs/DEVELOPMENT_LOG.md.

## Current delivery completion criteria

1. Display employer source paragraphs left, collapsible role/applicant/offers right, then practical metadata and existing requirement cards. Contact has a stable honest unknown slot. Received advertisement text remains visible when AI structuring fails, with manual source-reusing retry and safe diagnostic reasons.
2. Sign in, save/reopen competencies, separately confirm/reject, reset confirmation on edit, inspect history and explicitly delete. Verify cross-identity isolation, CSRF and revision conflicts against PostgreSQL.
3. Upload bounded PDF/DOCX/UTF-8 TXT/Markdown evidence, retain/download original, declare language/select master, inspect local text, create an UNVERIFIED claim from an exact source excerpt and then review it. Confirm storage and source history across reload/restart. An optional owned single/combined AI analysis follows reviewed previews and per-run approval. Show partial coverage and exact document sources, persist suggestions, and never promote generated wording into confirmation. ADR 0027 adds literal documentary confirmation with distinct basis on the current branch. Optional local OCR and rereading are added in the current workspace slice; layout-preserving generation is not implemented.

## Authorized local-pilot increments

The owner expanded the pilot with public entry, dedicated sign-in and a serious UX/UI redesign. Public entry, CV generation and application tracking are implemented, tested and merged. Standard CV generation uses reviewed selections; automatic AI rewriting and the full normalized employment/project graph remain separate future increments. The owner authorized publication and merge on 2026-10-08; long-term product phases remain separate. See docs/UX_DESIGN.md.

1. Owned saved advertisement snapshots and reviewed typed employment/projects are implemented. A full normalized career graph remains future work.
2. Personal requirement-to-confirmed-claim matching, explicit uncertainty/clarification and explainable CV wording recommendations. Undocumented experience is unknown, not automatically a skill gap. The owner approved relevant CONFIRMED claims plus ad text with preview and approval per analysis; production provider/privacy policy remains separate.
3. Controlled CV version/artifact generation and a simple application CRM recording the exact materials used. Use the owner-approved standard template for first DOCX/PDF export, keep originals, bind approvals to versions and postpone arbitrary imported-layout adaptation.

Automatic job discovery/digests → interview/follow-up → browser application copilot → academy/analytics follow later. Introduce Kafka, Temporal, pgvector and Redis only when an implemented workload justifies them. No paid services or account upgrades are used.

## Completion discipline

Update stories/flows, decisions, security and the development log. Published branches remain pending until an actual authorized merge is verified. Local tests do not establish GitHub Actions execution or fresh-task cloud restoration. Production identity, provider/source terms, account export/deletion, retention, backup and object storage remain unresolved before external rollout.

## Current Gemini continuation — 2026-10-08

Merged in PR #16: explicit Groq/Gemini task routing, recipient/model-bound private approval, persisted run protection, Gemini cooldown and sanitized token logging. Stable 3.5 Flash passed synthetic extraction/profile checks; 3.8 Flash generation returned 503. The related document-quality slice adds explicit responsibility coverage and prevents final synthesis from erasing already sourced profile sections. Real-document Gemini quality remains pending recipient-approved testing. Next: measured document coverage/PDF reading → conservative competency reconciliation → profile/history UX. Native Gemini PDF/URL retrieval, full normalized catalog/conflict model and later discovery/interview/browser/academy features remain separate.

## Prior recovery slice — 2026-10-08 (merged in PR #17)

PR #16 is merged (`5c18439265e6fa2b9852b1a16c631d5ba7be6dc7`); both pre-merge Foundation checks passed. The related `feat/document-evidence-quality` branch adds mixed-layout PDF reading/context preservation, compact grouped document review and approved per-operation Groq/Gemini recovery with actual provider/model identities (ADR 0026).

The priorities listed for that slice (document-grounded population, presentation and matching UX) are now implemented on the current ADR 0027 branch. Full conflict/catalog normalization, native Gemini source/PDF tools and the later discovery/interview/browser/academy roadmap remain separate. This slice does not claim those features are complete.

## Current delivery and next quality work

- Merged foundation: ADR 0027, V13 documentary basis/owner ledger, atomic profile population, durable review decisions, compact counted queue, editable sourced candidate synthesis, matching automation/clarification and bounded advertisement readers. PRs #21–22 add source-usage checks, nested context preservation and explicit month normalization. The current relationship delivery is listed below.
- Next: broader semantic expected-evidence inventory and measured recall, relationship/date conflict reconciliation. The initial independent local reading/list audit across seven supplied originals passed without provider calls. ADR 0028 adds an initial lexical source inventory and bounded follow-up, not the full semantic repair loop. Explicit-list recovery covers only named list items.
- Later: normalized reusable knowledge graph, broader model-quality comparison, advanced CV/discovery/interview features and online hosting. No paid infrastructure or automatic AI submission is introduced.

## Structured context delivery — 2026-10-08

PR #22 is merged with successful Foundation checks. The merged PR #23 implements ADR 0029: one owner/revision-scoped relationship table, exact unique documentary linking during approved population, explicit link/review/unlink controls and a compact searchable career picker. Existing record statuses and job/CV snapshots are unchanged.

Next priorities remain semantic expected-evidence benchmarking, explicit company/project/date conflict handling and measured extraction improvements. The normalized catalog and broader knowledge model are still proposed; this delivery does not complete them. Flash Lite remains an available choice for all four supported analysis tasks.

## Expected-fact quality delivery — 2026-10-08

The current continuation measures independently selected competencies, responsibilities, employer/project attribution, career month precision and substantive profile terms against recorded results. Counts distinguish captured, missing, wrong-context, wrong-field and unsupported-evidence findings. This is a developer benchmark, separate from the in-app source-usage panel; it never spends AI quota. A separately enabled synthetic Gemini check uses the same evaluator.

A failing regression demonstrated local list-state loss when a long skills section crossed automatic portions. Recovery now carries source section state locally, emits complete rows once and preserves global/employer boundaries. Existing approved workflow persistence and review rules remain. No extra AI calls, schema migration or model changes are needed.

Next: collect recipient-approved recorded model outputs against independently reviewed private checklists, use measured misses for targeted extraction improvements, then add explicit employer/project/date conflict review. The evaluator checks the chosen expectations and literal evidence; it does not prove every competency or every generated description is correct.

## Full-profile matching continuation — 2026-10-09

The owner prioritized complete automatic matching and job-card percentages ahead of career-period conflict review. On the current branch: all supported CONFIRMED contributions are approved together, literal repeated passages are packed once without losing skill/revision identities, full saved advertisement text is included, and new confirmations invalidate automatic-evidence results. Cards read the saved percentage without another AI request. Provider quotas/context remain external limits. Explicit company/project/date reconciliation is still next; no conflict records or resolution UI were added in this slice.

## Career history comparison — 2026-10-09

PR #25 is verified merged at `d2fbf25`. Current `feat/career-period-review` adds a local candidate-difference panel for exact role/employer/client/delivery-role identities with known overlapping, unequal month periods. Unknown dates, different roles/clients and disjoint rehires are not automatically flagged. Any two active history entries can be compared manually, including company/project wording and on-demand exact documentary evidence. Corrections reuse existing revision-checked editing and require renewed factual confirmation. No automatic merging, AI request or new persistence is introduced. Durable keep-both/dismissal records, aliases, source-authority ranking and generalized company/project/period reconciliation remain pending.

## Job-specific application preparation — 2026-10-09

Based on verified merged PR #27 (`217192c`). Saved cards and match results now link to `/jobs/{jobId}/apply`. The page retains job context, checks confirmed evidence/current automatic match/readable base CV, defaults to the owned master document, and explains source formats and requirement percentages. An optional short guide is skippable.

A separate recipient/model-approved `CV_TAILORING` task receives the entire supported base text and confirmed match snapshot; long paragraphs are automatically divided into literal passages, not sampled. Suggestions expose exact original text, editable proposed wording, reasons and claim/criterion references. Approved/rejected wording leaves the pending queue. No profile fact, original or exported CV version is written. Suggestions/decisions are page-session-only and disappear on navigation/reload. Changes to match/evidence/source invalidate current approval; valid references are not a guarantee that generated prose is semantically true.

Next: measure cross-profession requirement recall (including the existing 12-criterion ceiling), improve CV visibility/transferability assessments and broader joined onboarding. Durable proposal review/export, letter writing and submission remain deferred.


## Guided workspace continuation — 2026-10-09

An independent frontend slice from PR #30/main `9df2ae4` adds an optional five-step dashboard guide, document metadata counts/direct navigation and saved-data-aware next actions. PR #31 (base-CV visibility) remained open with both Foundation checks successful when this work started; this slice does not depend on it or merge it. Opening the guide spends no AI quota.

Next: measure matching/visibility semantics against independently reviewed cross-profession expectations, then inspect the joined document/profile → saved match → preparation journey for concrete UX defects. Durable proposal persistence, tailored files, letters/submission and hosting remain later. Development validation is focused on affected behavior, with no live provider calls by default; GitHub retains the required full regression.

## Requirement and clarification quality slice — 2026-10-09

Implemented on `feat/job-requirement-coverage` (ADR 0032): whole-source criterion instructions, removal of the twelve-criterion selection across storage/matching/tailoring references, defensive 128 requirement bound, explicit unassessed status/provisional coverage, search/filters, saved personal-answer continuity and compact document review/source tables. Exact source checks, full confirmed evidence and separate AI approvals remain.

Next priorities:
1. Independently benchmark criterion recall and clarify semantic mismatches; add explicit transferability/formal-barrier explanations and base-CV visibility outcomes.
2. Review the joined upload/profile → advertisement → match → application-preparation journey, including guidance and source/context uncertainty. Existing duplicates are retained safely, not destructively repaired.
3. Durable reviewed writing proposals and conflict decisions, then tailored file/version generation, letters and later roadmap features. The current milestone remains reviewed wording suggestions, not a completed application package.

## Evidence relation and application priorities slice — 2026-10-09

Implemented on `feat/match-evidence-explanations` from merged PR #29 (ADR 0033): explicit direct/transferable/unknown relations and formal/practical/other criterion nature, conservative server classification constraints, source-backed match tags and saved-card qualification counts. Preparation uses the saved assessment to organize documented examples, transferability limits and unresolved mandatory qualification requirements. This adds no AI call or new factual confirmation. Old snapshots remain readable without retroactive labels.

Next: base-CV visibility outcomes against confirmed evidence, then a measured cross-profession joined journey review and broader onboarding. Independent semantic recall/qualification benchmarks and durable writing review/conflict decisions remain pending. Tailored versions, letters and submission remain deferred; current preparation stops at reviewed wording suggestions.

The same slice also improves clarification review: compact status/context cards, personal/related-scope writing guidance, explicit reversible rejection with retained history, feedback and same-entry editing. Rejected answers are shown as excluded and are not automatically restored or sent to AI.

## Base-CV visibility continuation — 2026-10-09

ADR 0034 adds source-bound criterion visibility to the existing approved tailoring request: compact search/count filters, exact CV excerpts, confirmed contribution sources, conservative uncertainty and explicit unassessed recovery. This shares one call with wording proposals; original files and profile facts are unchanged. PR #30 is now verified merged at `9df2ae4`; this follow-up is prepared against that main without automatic merging.

Next: independently measure semantic visibility/criterion recall across professions and review the joined onboarding → documents/profile → saved job/match → preparation journey. Improve concrete mobile/readiness defects from those tests. Durable text changesets, tailored file/version creation, letters, submission and online hosting remain separate later work. Citation validation and source coverage are not guarantees of semantic completeness.

## Reviewed CV text handoff — 2026-10-09

PR #31 and #32 are verified merged, with successful pre-merge Foundation checks. From main `e7f18bf`, ADR 0035 adds local full-text preview/copy incorporating approved wording substitutions only, exact-source preservation and clipboard-failure recovery. No AI calls, backend change or tailored file/version is introduced.

Next priorities remain independent cross-profession semantic matching/visibility evaluation and concrete joined-flow improvements. Durable reviewed changesets, export/layout, letters and submission stay separate later milestones. Keep local validation focused and avoid live provider calls by default.

## Source-neutral advertisement quality — 2026-10-09

Prepared from merged PR #34/main `c07244e`: literal practical-field recovery and merged saved facts across received sources, plus conservative source-based requirement importance (ADR 0038). Direct URL adapters remain FINN/NAV; other employers' received/pasted text is supported. No automatic caching, platform-summary stripping, full linguistic guarantee or new provider default is claimed.

Next priority resumes the joined document/profile → saved job/full-profile match → reviewed CV wording journey. Keep independent semantic evaluation, broader source adapters, durable review decisions and tailored file/version generation as distinct follow-ups. Avoid additional live-provider comparison by default.

### Joined journey: AI configuration recovery

Implemented compact, shared configuration loading/failure/unavailable states and an explicit metadata-only retry across model selectors, including CV preparation. Source/results, actual attribution and recipient-bound consent remain unchanged. This is configuration recovery, not provider quota removal, silent fallback or automatic analysis resumption. Continue with joined-flow verification and source/profile/match quality; durable tailoring decisions and file generation remain deferred.

### Joined journey: base-CV selection

Application preparation now defaults only to an explicitly marked master CV. With no master, it asks for the wording source without guessing document type. Added local short-text recovery guidance and preserved full confirmed evidence, source checks and consent reset. This does not add semantic CV detection, automatic OCR or tailored file generation.

### Joined journey: shared profile/match freshness

Competency/profile mutations now invalidate the full cached saved-match family alongside owned claims. This closes the stale-card gap when an answer for one job changes the candidate evidence used by other jobs. Document population/source promotion/deletion share the same refresh; server revision checks remain authoritative. Visible status refreshes are read-only, with no AI rerun. Cross-tab synchronization and broader end-to-end identity/persistence review remain subsequent work.

### Competency review: edit within the queue

Guided review now supports prefilled editing, a return without saving and a return to the same item after saving. Explicit confirmation remains separate and uses the edited revision. This improves review continuity without bulk factual confirmation, new AI calls or source rewriting. Broader document review/layout and joined-flow quality remain next priorities.

## Pilot roadmap checkpoint — 2026-10-12

The joined local pilot has implemented identity/private storage, document reading and sourced profile drafts, advertisement analysis/snapshots, automatic full-confirmed-evidence matching with explained coverage/clarification, and job-specific editable CV wording review. Individual workflows and recent recoveries have focused tests; this is not a claim of a completed real-identity/database whole-journey audit or exhaustive semantic extraction/matching quality. PRs #36–#39 are merged with successful Foundation checks.

Current delivery concentrates on usability and integrated quality: compact completed-document results, preserving source/review identity, profile/match freshness, and safe transitions into CV proposals. Next: wider document/profile usability review, joined login/upload/profile/job/match/tailoring verification and independently expected source/criterion quality checks. Source routing supports FINN/NAV URLs plus pasted text; general URL adapters remain pending. Tailored CV files/durable wording review, letters, interview support and online hosting remain later deliveries. Independent standard CV export/manual application tracking already exist; they are distinct from job-tailored file generation.

### Completed-document overview

Added a compact completion strip and on-demand processing/source-check disclosure; active/paused runs retain expanded progress. Review actions, literal quotations, saved model attribution and completion limitations are preserved. This changes presentation only, with no provider call or automatic factual confirmation.

### Document library and owner CV-tailoring gate — 2026-10-12

Implemented filename search, technical reading/master filters, compact source rows and a combined-analysis shortcut above the library. Retained complete collection preview, source actions and explicit AI approval. Continue document/profile/competency usability and quality work.

Further CV-tailoring development is explicitly paused by the owner: notify them clearly before starting, wait for their supplied user/process flow, and discuss the approach before implementation. A generic continuation does not lift this gate. Existing CV proposal functionality is retained.

### Source-quality continuation: long explicit lists — 2026-10-12

An independent expected-fact regression exposed local recovery dropping whole explicit technology rows over 30 items. Aligned that item bound with the existing 300-suggestion workflow bound, retaining row-length/per-item/source checks. Verified empty-model-output recovery, employer context, punctuation and deduplication against a two-employer expected inventory. This is a narrow recall fix, not a live model benchmark or complete semantic/document audit. Continue document/profile/competency quality; the owner gate for CV tailoring remains in force.


## Approved CV-tailoring roadmap — 2026-10-12

Owner approval resumes CV tailoring after the supplied process/audit. First delivery: durable owned generated snapshots and revision-checked wording decisions, latest-session recovery and explicit draft saves. Next: stable CV sections, visibility/strategy, section-aware review, versioned standard export, supported Falck DOCX layout/conversion, independent actual-file review and application integration. Existing functions remain. No full-journey or live-model quality claim is made by this first delivery.


## CV section-review checkpoint — 2026-10-12

Implemented conservative explicit-heading sections and preliminary section outcomes/priorities within the existing approved wording call. Every literal passage remains available; invalid/missing outcomes cannot imply completed review. Section navigation/filtering and immutable session persistence are implemented. This is not a separately approved strategy-before-generation workflow. Next: deepen section-specific wording coverage and supported template structure, then connect approved changes to immutable standard artifacts; independent actual-DOCX/PDF review remains required before CV_READY.


## CV review-coverage and numerical wording checkpoint — 2026-10-12

New AI section plans declare all ordered source passages; incomplete declarations remain unassessed. Expanded profession-independent profile/skills/experience/education instructions and lexical numerical/source-year checks now apply to AI suggestions and new wording approvals. Unsupported wording remains a draft for clarification. This does not complete semantic fact verification, template fidelity or final document readiness. Next: connect current approved wording to immutable standard-document drafts, preserving readiness distinctions and actual-file review requirements.

## Document UX correction — 2026-10-12

Implemented for review: unclipped shared model menu; saved owner-scoped library analysis metadata with accessible interactive details; compact responsive career confirmation. No new AI calls, schema migration or provider default changes. Next approved CV slice remains accepted wording into an immutable standard CV draft/export, followed by independent actual DOCX/PDF review.

## Current handoff — 2026-10-12

Completed for review: immutable reviewed-text CV draft/library handoff (ADR 0041), grouped competency/career confirmation using existing review endpoints, shared dialog/sheet styling and non-expanding public model menus. No new AI calls or migrations.

Next priority from owner feedback: explicit individual profile-summary adoption into a durable chosen presentation, preserved across new analyses; current presentation still reads the newest saved document synthesis and edits that analysis. Follow with generated standard DOCX/PDF draft artifacts and independent final-document review. This delivery does not implement those next stages or CV_READY.


## 2026-10-12 — CV tailoring readiness guidance

Delivered: actionable CV-tailoring readiness explanations and direct navigation to update stale matching. Durable presentation-section adoption and generated tailored artifacts with independent final review remain subsequent slices.


## 2026-10-12 — Selected presentation sections and Documents navigation

Delivered: durable explicit per-section presentation selection with saved source snapshots, language separation and owned revision checks. Next priority: dedicated Documents page using the existing components/endpoints; update navigation, onboarding and all repair/source links. Then continue standard tailored DOCX/PDF generation and independent final review.


## 2026-10-12 — Project history extraction correction

Delivered: project-specific extraction instructions, unknown-organization support across history parsing/storage/review, and dated experience coverage that requires actual history evidence. The dedicated Documents page and reviewed standard file drafts are now implemented. The 2026-10-13 quality continuation aligns per-item evidence limits with the provider schema and aggregates reworded dated history without changing personal reviews. This is a targeted correction, not guaranteed project recall. Next: measure project capture on a newly approved analysis; preserve advertisement contact metadata and improve criterion quality; recover nontechnical candidate facts such as languages; split PDF CV text into meaningful editable sections/passages before further tailoring quality work.

The source-check continuation adds persisted, bounded omission categories with an expandable bilingual explanation and legacy fallback. It does not weaken validation or assess semantic completeness. Next quality gate: controlled project-capture validation with the corrected contract before declaring this extraction milestone complete.

The bounded live project probe was blocked by provider 503/JSON validation failures; project recall remains unverified. Advertisement retention now prioritizes returned source-supported contacts/deadline/location before narrative metadata at the existing ten-fact bound. Recovering omitted source contacts, removing related advertisements, semantic criterion validation, candidate language extraction and PDF passage structure remain pending.

The contact continuation now recovers exact bounded contact sections containing email/labeled phone details after a valid analysis response, consolidating overlapping literal partial facts without another AI call. Explicit related-job sections stop this contact scan; they are not yet removed from the AI requirement input. Name-only/ambiguous contacts, missing source metadata, semantic criterion validation, candidate languages and PDF passage structure remain pending.


## 2026-10-12 — Dedicated library and retained profile review

Delivered /documents upload/library navigation while preserving profile source/AI review and original storage, plus a visible completed-analysis rerun action. Owner clarification narrowed the move to upload/library only. Generated tailored DOCX/PDF and independent final file review remain next after validating this slice.


## 2026-10-12 — One profile presentation and direct main CI repair

Delivered locally: one chosen presentation using the previous suggestion-card design, with drafts retained in source review. CI repair is pushed directly to main with owner authorization; independently validated presentation simplification is kept as a separate change while full main checks complete.


## 2026-10-12 — Reviewed CV file drafts

Delivered for review: standard DOCX/PDF draft generation from immutable reviewed wording, independent actual-file character readback, revision/source-guarded artifact persistence and draft downloads (ADR 0043). Next: independent semantic, structural and visual review of both actual files and explicit readiness approval. Supported Falck/template fidelity remains later work. Character preservation alone is not CV_READY.


## 2026-10-13 — Joined journey quality and CV coverage

Prioritize joined journey quality before final-file readiness: DOCX paragraph boundaries and 40-proposal coverage (ADR 0044), followed by contact/source completeness, frozen-input match repeatability and a component-wide styling/accessibility audit. See docs/JOURNEY_QUALITY_REVIEW.md for acceptance criteria and pending work.


## 2026-10-13 — CV passage review transparency

Delivered for review: source-passage ledger within selected CV sections, with exact original wording, original proposal/reason and explicit missing individual-suggestion status. This improves review transparency; finer AI per-entry/per-passage judgments, advertisement contact recall, matching repeatability and the component-wide audit remain pending.


## 2026-10-13 — Individual CV passage assessments

Delivered for review: source-unit AI reasons and explicit keep/change/review outcomes in the same approved tailoring call (ADR 0045), with missing/invalid assessments visible and preventing complete section declarations. Next: advertisement/contact recall, frozen-input matching repeatability and the wider component audit before independent final-file readiness. Canonical per-employment/project grouping and live semantic quality evaluation remain pending.


## 2026-10-13 — Regular Flash model update

Implemented the owner-requested 3.6 regular Flash selection while retaining Flash-Lite defaults and model-bound approval. Focused adapter/routing checks passed. This is a configuration update, not evidence that 3.6 outperforms Lite or that private-document extraction is complete.

## 2026-10-13 — Advertisement and candidate evidence-quality bundle

Implemented for review: exclude exact related-job headings and recognizable repeated platform-footer cards from new advertisement analysis/matching input while preserving saved original excerpts; conservatively reject negated stack expectations, offered benefits and unsupported language labels, and consolidate formatting-equivalent repeated criteria. Legacy criteria outside the retained advertisement remain unassessed in matching; new CV proposals require advertisement reanalysis before a provider call.

Local language recovery now retains literal natural-language labels and stated proficiency from explicit rows/sections, including bounded PDF row pairs and wrapped oral/written qualifiers. Documentary facts use existing population/review rules and enter the full confirmed matching set; coverage distinguishes LANGUAGE passages. No provider/default changes, evidence subsetting or new AI calls. Lexical guards and bounded language-row grammar do not establish semantic completeness or a best model.

Next: verify controlled project capture when providers permit; split PDF CV profile paragraphs, competency groups and employment contributions into source-bound editable units; then repeat a low-call frozen-input model comparison. Independent final-document readiness and broader design review remain pending.

## 2026-10-14 — Logical CV source units and PDF paragraph bundle

Implemented with focused validation, ready for review: application-owned exact source units for new tailoring generations, shared AI/planning/review/assembly metadata, protected recognized identity/headings/dated headers and unchanged legacy session indexes (ADR 0046). PDF paragraph-gap preservation applies only to new uploads/explicit rereading; originals stay unchanged. Geometry and conservative context recognition do not establish exhaustive recall or template fidelity. Retain full confirmed evidence and existing approvals/defaults without extra calls.

Next: required Foundation CI and owner review for this related bundle, then controlled frozen-input Gemini/Groq comparison and project-recall validation. Independent semantic/structural/visual file review, supported template fidelity and broader design review remain pending. Prepare a reviewable PR without automatic merge.


## 2026-10-14 — CV continuity and controlled model findings

Reviewed owner PR #64 on main d7c5f34 and retained its full model selection/opt-in diagnostics. Implemented for review: stable right-column boundaries for narrow skill grids, row association for known metadata labels, conservative compound-description/unfinished-bullet handling, and unique bounded literal evidence spans when contents headings repeat. Original files, saved source text/ranges, review decisions and model defaults are unchanged.

Completed a bounded comparison using the complete current two-page CV, two detailed project pages, six independently reviewed frozen criteria and documentary test fixtures. Flash-Lite 3.5 completed extraction, matching and wording; offline replay after the source correction recovered two supported projects. Groq 20B encountered schema/429 issues; Groq 120B supplied more cautious match judgments; both Groq wording requests hit HTTP 413. This is limited case evidence, not a universal model ranking or full project-document benchmark.

Next: tighten complete-criterion evidence assessment (including agentic versus assisted development and experience scope), replace generic/English CV review reasons with specific localized reasoning, and explain/measure oversized Groq requests without dropping confirmed evidence. Then repeat the same frozen comparison. Final file review and broader UX work remain pending.

## 2026-10-14 — Scope and wording contract refinement

Continued from merged PR #65/main 53ef8ae. New matching instructions require complete literal criterion scope rather than keyword overlap. New wording instructions explicitly localize every reason, retain individual protected-unit coverage, and treat an optimistic match as an interpretation rather than a confirmed fact. New source-unit wording sessions record v7 without rewriting earlier snapshots.

Five bounded follow-up calls used frozen candidate/ad data: Lite 3.5 and Groq 20B both assessed the specialist AI criterion as partial, while disagreeing on duration. A wording intermediate introduced unsupported specialist terminology despite passing existing lexical/source checks; the revised instruction's final sample made no proposals and retained all 43 individual/6 section assessments. Reasons were Norwegian but still sometimes terse/generic, and visibility under the deliberately reused optimistic match remained too generous. This is contract refinement, not completed semantic validation or proof of universally better output.

Next: strengthen unsupported-scope and visibility review, improve useful per-group wording explanations, and handle Groq HTTP 413 accurately before measuring capacity-preserving compaction. Keep complete confirmed evidence, exact source units and user approval; do not force edits merely to increase proposal counts. Full browser CI remains a delivery gate; repair stale model-availability fixtures instead of weakening product guards.

The owner prioritized faster development validation: one Foundation run per PR update, cancellation of superseded runs, cached Gradle dependencies, two CI browser workers and a separate server-free lane for six existing data/proxy contracts. Focused local checks remain the development default. Measure the first complete CI run before claiming a total speedup; further pruning should remove demonstrated overlap while retaining source/ownership/data-preservation coverage.

## 2026-10-14 — Match-bound visibility and request-limit recovery

Implemented for review: visibility items show existing relevance/scope explanations from the exact associated match ID. Missing/overwritten assessments disclose their absence instead of substituting a newer match. New Groq structured HTTP 413 responses retain a distinct sanitized code/status through public/private proxies and explain model recovery without truncation, automatic retries or false quota waits. Original sources, saved proposals, consent and defaults remain unchanged.

Next: independently check factual scope in proposed wording and improve useful section/group reasoning. An exact match association and literal quotation do not establish semantic entailment. Measure compact request representations against provider limits while retaining all confirmed evidence; no evidence-dropping fallback is authorized. Database-test startup reuse remains a separate measured efficiency opportunity.


## 2026-10-14 — Optional saved-wording source review

Implemented for review under ADR 0047: a separate recipient/model-approved, read-only AI opinion on saved active wording proposals. The input omits generation reasons and match judgments, retains referenced confirmed sources and entry context, and uses revision/source checks before and after the call. Invalid/missing literal support becomes unassessed; the UI distinguishes uncertainty from support and marks earlier results after edits. No automatic extra generation call, factual promotion, approval change, migration or model-default change.

Next: measure this review's semantic quality with independently selected expectations before claiming reliable detection; improve passage/group reasoning and measure capacity-preserving request/output budgets. Durable review findings, enforcement of resolved findings and independent semantic/structural/visual review of actual DOCX/PDF remain pending. Page-session opinions do not complete final-file readiness.


## 2026-10-14 — Measured source-review capacity and unresolved semantic quality

Continued from merged PR #68/main 3c06809. Implemented request-local output limits for the optional saved-wording source opinion, preserving full per-draft evidence and unchanged generation/matching defaults. Corrected a residual hyphen/conjunction split in new employment prose source units without rewriting stored sources/ranges.

Six explicitly authorized live calls compared Flash-Lite 3.5 and Groq GPT-OSS 20B: both met all eight synthetic expectations, but six real-document excerpt controls exposed false support, nonliteral quotations and language failures. Shared dictionaries saved 5.4% input bytes in that fixture but added 11.2% in the synthetic case; contradictory scope outcomes prevent a quality-preserving compression claim. Keep the existing nested evidence representation. One sample per model/format is not a repeatability benchmark or best-model ranking.

Next: retain these independently chosen controls, isolate missing per-proposal support from true competency gaps, improve literal-quotation fidelity and Norwegian reasoning, and verify stability before further compaction or default changes. Broader project recall, complete matching/generation journey checks and independent final-file review remain separate unfinished milestones. No automatic semantic approval or merge.


## 2026-10-14 — Source-only review and application-resolved citations

Continued from merged PR #69/main f1ac5c1. Implemented v2 of the optional source opinion: exclude advertisement/original wording from candidate proof, preserve full linked statements/context under each proposal, return numbered literal source references and typed findings, and render concise localized explanations with exact problematic draft phrases. Long-source qualifiers and distinct claim revisions remain intact; existing public results, consent, one-call/output budgets, immutable sources and human decisions are preserved.

Four controlled live calls on frozen fixtures returned valid references in all 28 assessments. Both Lite 3.5 and Groq 20B met eight synthetic expectations; the six real-document controls yielded six expected Lite outcomes and four Groq outcomes. Groq still accepted unsupported scope, so semantic reliability remains unfinished. Neither defaults nor factual approval rules change.

Next: carry stronger source discipline into initial proposal generation and rerun the joined project-extraction/matching/whole-CV wording journey on frozen inputs, with limited calls and separate recall, scope, linkage and writing-quality measures. Additional semantic stability/held-out checks and independent final-file readiness remain distinct milestones. Avoid multiplying advisory calls to hide unresolved generation defects.

## 2026-10-15 — Initial generation provenance and measured remaining defects

Continued from merged PR #70/main 3759980. New v8 CV proposals require literal excerpts from every linked claim, retain complete claim text and omit previous match classifications/reasons/questions from writing proof. Validated excerpts survive immutable snapshot storage; legacy sessions and the approved one-call workflow remain unchanged (ADR 0048).

Nine bounded live attempts included a final equivalent-input comparison: Lite extracted one project from one detailed page, both models processed six frozen criteria with differing scope judgments, Lite returned three CV changes with 41/42 valid individual assessments, and Groq 20B failed project schema/large-CV capacity. Literal source checks still accepted a semantically unsupported specialist expansion from Lite. This is not completed factual validation, all-project recall or a full login-to-export journey.

Next: address unsupported assertion scope before adding more advisory layers; improve specific skills-group/employment reasoning and inspect rejected match evidence. Measure Groq's complete request/output reservation without dropping confirmed evidence. Structured project dates/history reconciliation, broader recall and independent final-file review remain separate milestones. No model/default change or automatic approval.


## 2026-10-15 — Optional OpenAI baseline integration

Added an explicit Responses API generation adapter, provider-bound approvals, frontend result compatibility and non-content usage/cost estimates under ADR 0049. Existing Groq/Gemini defaults, FINN retrieval, prompts and source validators are unchanged. Offline verification is complete; the approved four-analysis comparison remains blocked by Responses `invalid_api_key`. Next: correct the environment binding, run three Mini analyses and one GPT-5.4 reference within the approved USD 0.50 budget, then assess concrete criterion coverage and separate model/system failures. The original six pipeline improvements remain deferred.

## 2026-10-16 — Private multi-provider analysis comparison and focused corrections

The local OpenAI authentication blocker is no longer reproduced: actual structured Mini generation succeeds. The owner approved a new private advertisement/document/match comparison plus demonstrated improvements, initially capped at USD 2 for OpenAI. This supersedes the earlier blocked-comparison status for the current local environment only; it does not establish a repair of other secret bindings.

Implemented source-only recovery for explicit duties, simple alternative preservation, scoped preferred examples, additional skills-grid headings/wrapped final items and inline language rows. Document instructions cover each role's contributions, including page continuations; model defaults, factual confirmation, private approvals, original files and existing saved snapshots remain unchanged.

Remaining priorities: independently test sufficient-alternative judgments and literal evidence selection; diagnose Groq structured-generation failures and Gemini availability separately; repeat held-out cross-profession controls before changing defaults. Success on one private CV is not general semantic completeness, a production quality gate or a CV-tailoring milestone. No merge/release is authorized by this comparison.

## 2026-10-16 — Sol/Luna options and reviewed next-slice proposal

PR #73 is verified merged at `31cea3e` with successful Foundation CI. The owner authorized explicit Sol/Luna choices, implemented on `feat/openai-sol-luna-options`: complete twelve-model structured catalog, bounded frontend capacity, unchanged defaults/retrieval and retained model-bound consent. This is model availability in the application, not account access or universal quality certification.

Proposed next PR, for owner review: **joined evidence-to-wording quality controls**. Align with the latest journey-quality priorities, ADR 0048 and the approved master specification rather than rebuilding existing sections, durable review or standard exports.

1. Define independently reviewed synthetic controls across at least three non-technology occupations and contrasting layouts; track source extraction, employer/project attribution, full-profile matching and initial CV wording separately. Include sufficient alternatives, formal qualifications, coursework versus delivered work, team versus personal responsibility and unsupported scope expansion.
2. Reuse the existing source-unit, literal-excerpt and saved-wording review contracts. Add meaningful regression controls for demonstrated source/reference/scope defects and make narrowly evidenced corrections; preserve complete confirmed input, original files, exact revisions and one approved generation call. No extra automatic advisory layer or model-default change.
3. Publish captured/unknown/incorrect-context/unsupported-proposal findings separately from count or quotation coverage. Use explicitly authorized bounded live calls only if needed to establish semantic behavior. Broader employer/project reconciliation, Groq capacity work and independent semantic/structural/visual review of actual DOCX/PDF remain distinct later slices.

This is a proposal, not authorization to implement the full semantic or final-file review architecture.

## 2026-10-16 — First evidence-to-wording quality increment

The owner confirmed PR #74 merged at `c0f58ad` and resumed the proposed quality slice. Its full CI later exposed one stale browser catalog-limit assertion (169 other browser tests passed); PR #75 isolates that test-only correction.

Implemented for review on `fix/cv-statement-evidence`: independently specified non-technology source controls (healthcare TXT, retail DOCX table, trades PDF page continuation) and a demonstrated context-only citation correction. New CV proposals require a statement excerpt per referenced claim and retain incomplete review after omitted proposals. The v9 contract preserves full confirmed inputs, one-call consent/revision rules and old snapshots. These automated controls use frozen matching and mocked provider output; they do not complete semantic model evaluation or the whole live login-to-export journey.

Next: use the independent scope rubrics for bounded, explicitly approved generation/matching evaluations, inspect whether responsibility, qualification and own/team contribution are actually entailed, and correct measured defects with useful section/group explanations. Employer/project reconciliation and independent actual-file semantic/structural/visual review remain separate later increments.

## 2026-10-16 — Independent source-scope controls and positive-opinion correction

Continued from merged PR #75/#76/main `65d7e68`. A failing regression exposed context-only positive optional opinions. New v3 opinions require a statement passage from each claim cited as proof; context remains supplementary. Edited drafts can use fewer originally linked claims. Missing statement references become unassessed without changing saved proposals, factual statuses, human decisions, defaults or approved call counts.

Added an explicitly enabled, one-request evaluation with 21 independently specified fictional controls across healthcare, retail, trades, logistics, catering and finance. The final equal-input Sol/Luna calls each met 21/21 coarse support expectations with valid application assessments and localized explanations. Earlier results are retained: Sol met 15/15 baseline and 21/21 expanded expectations; Luna's intermediate result had one semantic false negative and two conservative citation rejections under the subsequently discarded all-linked-claims rule. Final success does not establish stability, exact finding-code equivalence or an improvement in semantic accuracy. Five completed development calls used medium reasoning and five-minute limits; standard-rate total estimate USD 0.05043, not confirmed billing.

Next: evaluate initial generation and matching with held-out evidence containing less explicit limitations and more complex employment/project scope; measure useful per-group reasons separately. Avoid overfitting these controls or multiplying automatic opinions. Actual-file semantic/structural/visual review remains a later milestone. No model/default change or automatic merge is authorized.

## 2026-10-16 — Joined matching and initial-wording quality increment

Continued from merged PR #77/main `f8b382e` on `fix/match-wording-scope`. New held-out fictional healthcare, retail and trades cases pass actual model-generated matching through a controlled saved result into initial CV wording, preserving every confirmed source. Independent controls cover sufficient alternatives, formal qualifications, coursework, personnel scope, overlapping periods, supervised work and planned delivery. Identity/repositories are fixtures; this is not a complete sign-in/import/export journey.

Baseline Sol and Luna each met 12/12 expected match classifications and returned ten source-valid proposals. A separate assistant review identified one Luna suggestion that removed the unrecognized `Ferdigheter` heading. A separate regression exposed loss of different quotations sharing one claim ID. Correct both narrowly: protect the recognized skills heading in new source units and preserve distinct claim/quotation pairs within the existing five-excerpt bound. Existing saved results/ranges, facts, scores, defaults, approvals and call counts remain unchanged.

After correction, replayed matching is allowed only under exact frozen model/reasoning/prompt/schema/input equality. Six fresh wording calls retained the protected headings, produced nine Sol/seven Luna proposals without omissions and returned valid individual assessments for all 33 source units per model. These declarations are not semantic completeness. Separate assistant review found no unsupported qualification/responsibility expansion in these samples; reasons were localized and source-specific, but Luna remained more cautious about the unspecified extent of an offered practice alternative. Keep that difference visible rather than treating a prior STRONG judgment as fact. Eighteen completed calls used medium reasoning and five-minute request bounds; total standard-rate estimate USD 0.27510, not confirmed billing.

Next: repeat independently selected ambiguous/multi-source criteria and assess disagreement between match and wording reasons without adding unadvertised thresholds. Broader source recall, employment/project reconciliation, useful group reasoning stability and independent actual-file review remain separate milestones. No default-model change, automatic extra call, merge, release or deployment is introduced.
