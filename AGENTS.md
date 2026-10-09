# Arbeidsregler for Career Agent

## GitHub and documentation language

- Use English for all commit messages, PR titles and descriptions, issues, review comments, release notes, and branch names.
- Write new technical documentation and code comments in English. When editing existing Norwegian documents, preserve their meaning and translate the affected section when practical.
- The application remains Norwegian by default and supports English. Conversation with the user can remain Norwegian.
- Every PR handoff must include an English title and a complete English description, with actual validation and limitations.

## Gjeldende fase

### Active scope — 2026-10-08 knowledge review

The owner explicitly resumed document/profile implementation after the knowledge-model review. Use [the staged proposal](docs/CAREER_KNOWLEDGE_MODEL_PROPOSAL.md) as design guidance; it does not authorize inventing facts or implementing every proposed table at once. The saved workflow/PDF experiments are restored on `feat/full-document-career-review`; retain tested source, ownership and pacing invariants. Current scope: complete-document analysis with owned resumable progress, editable sourced competency/history/profile drafts, compact profile navigation, conservative PDF readability fixes, and configurable task-specific AI model selection with unchanged defaults until quality validation. Preserve explicit per-run consent, exact source evidence, user confirmation and existing document-deletion disclosures. No silent automatic model switching after a quota failure. The owner subsequently authorized explicit in-app alternate-provider recovery: follow ADR 0026, clear private consent when the recipient/model changes and preserve saved sources/progress. The owner explicitly authorized publication and merge of this continuation on 2026-10-08, followed by the related quality priorities. Verify remote main and required checks before merging.

Implementation is authorized in small coherent increments. The foundation is merged; current slices include direct URL analysis, sourced overview facts, and an opt-in PostgreSQL/Flyway foundation alongside bounded FINN and NAV import. Browser excerpts must never be presented as verified complete original advertisements. Optional local OIDC/PKCE sign-in and user-owned basic profiles (name/language/revision) are now implemented; owned reviewed competency claims, local DOCX/PDF sources and opt-in single/combined AI summaries are merged in PR #14. The merged pilot improved competency UX, bounded source selection, existing-original rereading and explicitly requested local Tesseract OCR. The current branch replaces manual document portions with resumable full-source review and sourced editable drafts. The owner also authorized optional Groq summarization and competency proposals from single or multiple uploaded documents before merge (ADR 0016). Require owned private endpoints, reviewed bounded previews and explicit per-run approval; output remains unverified until user review. Reviewed typed career history and a public landing/dedicated sign-in/workspace overview are added locally; root analysis moves to /jobs/analyze and fixed OIDC callbacks use /dashboard or /login?login=failed. Owned saved job snapshots and per-analysis-approved matching are now implemented on the local branch; adjacent-skill inference and production identity remain pending. The owner approved relevant CONFIRMED claims plus advertisement text for future Groq matching only with preview and per-analysis approval. First pilot hosting is local on the owner's Mac; online hosting is deferred. Private content must never enter public advertisement endpoints or advertisement diagnostics. The local pilot also includes reviewed standard CV export, manual application tracking, UTF-8 TXT/Markdown evidence, conservative multi-source competency deduplication and local advertisement recovery. Document AI now selects numbered evidence and uses source wording, with literal skill validation and nearby context proof or unknown context (ADR 0023). Read-only owned document checks validate original/text/quotes without AI calls; green checks never establish semantic completeness. Keep future increments small and tested; the owner explicitly authorized pushing this delivery and merging it to main on 2026-10-08. Do not build the full system at once. No paid services, plan upgrades or infrastructure costs are authorized.

## Produktføringer

- Norsk bokmål er standardspråk; engelsk skal støttes fra første versjon.
- Langsiktig målgruppe er alle jobbsøkere. Produkteieren er første og foreløpig eneste pilot.
- Pilot og testing er gratis for brukeren. Ikke pådra prosjektet kostnader uten eksplisitt autorisasjon.
- Ikke finn på erfaring. Skill mellom UNVERIFIED, INFERRED, CONFIRMED og REJECTED.
- AI-ekstraksjon er ikke bekreftelse. Bekreftede påstander skal ha sporbar kilde eller bekreftelse.
- Brukeren skal godkjenne innsending, sending av meldinger, vesentlige profilendringer og aksept av vilkår.
- Bevar originaldokumenter og dokumenter hvilken versjon som hører til en søknad.
- Hold kandidatopplysninger, dokumentinnhold og hemmeligheter utenfor Git og prosjektdokumentasjon.

## Product methodology and current journey priority — 2026-10-09

Read [Job matching and CV tailoring standard](docs/JOB_MATCHING_AND_CV_TAILORING_STANDARD.md) before changing extraction, matching, clarification or CV/application behavior. The owner supplied this profession-independent methodology as product direction. Its 71 numbered sections and delivery matrix distinguish target rules from current implementation; it is not a prompt to send wholesale to a provider.

Current priority: review/test the joined login → document/profile → advertisement → saved job → full-profile match → Apply for this job → editable CV tailoring journey. Add compact readiness guidance, an optional tutorial and contextual help. The next milestone stops at reviewed text proposals; tailored file/version generation and letters/submission are deferred. Preserve full confirmed evidence inclusion, explicit recipient/model-bound approvals, original documents and source/revision checks. Unknown evidence is not a proven gap. Do not silently trade these owner decisions for prompt instructions about token reduction, source ranking or new enums. PR #26 is verified merged at `289dcd15e20d5b9887202425cd9360e22082d19b`. Implement and test coherent slices of the joined journey; do not merge later PRs automatically.

## Før og under implementasjon

Når implementasjon er eksplisitt autorisert:

1. Undersøk eksisterende kode og relevante dokumenter først.
2. Planlegg en liten, sammenhengende endring.
3. Implementer med relevante tester.
4. Kjør testene og rett feil. Rapporter hva som ikke kunne verifiseres.
5. Unngå unødvendige dependencies og omskriving av fungerende kode.
6. Forklar viktige arkitekturvalg og oppdater dokumentasjonen.

Hver cloud-task har allerede et isolert miljø. Bruk eksisterende checkout; ikke opprett Git worktree uten uttrykkelig forespørsel.

## Dokumentasjon som en del av arbeidet

- Les README.md og dokumentene som gjelder endringen.
- Oppdater USER_FLOWS.md ved endret brukerflyt og USER_STORIES.md ved endrede krav.
- Oppdater ROADMAP.md ved endret omfang eller ferdigstatus.
- Registrer beslutninger med status, begrunnelse og konsekvenser i docs/DECISIONS.md. Bruk ADR for vesentlige arkitekturvalg når de vedtas.
- Før korte, faktiske oppføringer i docs/DEVELOPMENT_LOG.md: endring, validering og gjenstående arbeid.
- Registrer uavklarte spørsmål i docs/OPEN_QUESTIONS.md. Et forslag er ikke en bekreftet beslutning.
- Oppdater eksisterende dokument fremfor å lage parallelle, motstridende beskrivelser.
- Bevar historikken når en beslutning erstattes; marker den som erstattet og lenk til etterfølgeren.
- Når en publisert branch er klar for brukerens PR/merge: oppgi base- og head-branch, PR-tittel og full beskrivelse med faktisk validering og begrensninger. Ikke merge til main på brukerens vegne uten instruksjon. Sjekk oppdatert remote main før neste arbeidsbranch.
- Ikke lagre rå samtalelogger eller persondata for å øke dokumentmengden. Dokumenter relevant hensikt, krav, begrunnelse og resultat.

## Frontend implementation rule

Use TanStack Query for server queries and asynchronous mutations. Use shadcn/ui components, kept in `apps/web/components/ui`, as the UI foundation. Keep Next.js routing; do not introduce TanStack Router or Table without a concrete need. Norwegian remains the default. Preserve visible evidence, accessible controls, responsive layouts and honest feature availability; no fake match scores or inactive navigation presented as working features. Disable automatic retries for AI mutations.

## Gemini continuation — 2026-10-08

The owner authorized implementation of Gemini and immediate prioritization of related document/competency/profile/history quality work. Follow ADR 0025: explicit task routing and recipient/model-bound private approvals, retain source checks and factual confirmation, no automatic provider/model switch after failures, no paid services. Gemini-specific first model is tested 3.5 Flash; existing unset provider remains Groq. Do not send owner documents to Google under an old Groq approval. Publication and merge of this continuation are explicitly authorized on 2026-10-08; subsequent changes should use a new branch from the verified merged main.

## Current evidence-quality continuation — 2026-10-08

PR #16 merged at `5c18439265e6fa2b9852b1a16c631d5ba7be6dc7`; both Foundation checks passed. Current work is on `feat/document-evidence-quality`: mixed-layout source reading, context-preserving compact competency review and owner-authorized explicit Groq/Gemini recovery. Read ADR 0026. Automatic document-confirmed profile imports, dynamic candidate presentation and automatic matching evidence/scores/inline clarification are queued owner requests, not completed implementation. Retain recipient consent, exact evidence, budgets and ownership in this recovery slice. Private fixtures and extracted text stay outside Git.

## Document population and matching continuation — 2026-10-08

PR #17 is verified merged at `922c6171d32af654d99100625b94670a2d479ac3` with both Foundation checks successful. Current branch is `feat/document-profile-population`; follow ADR 0027. The owner explicitly authorized automatic documentary facts, sourced history/profile drafts, easier approval with processed items outside the pending queue, automatic matching evidence, explained percentages and inline personal clarification. Documentary CONFIRMED facts must preserve literal evidence and DOCUMENT basis; personal attestation uses USER basis. Generated prose is not documentary confirmation. Preserve edited/rejected/deleted targets across reanalysis. Retain explicit recipient/model-bound AI approval and no silent provider switching. Test and prepare a new PR; do not assume authorization to merge this subsequent branch.


## Consolidated profile skill continuation — 2026-10-08

PR #18 is verified merged at `5c896707202678e7fde339a994787654007ab0f2` with both Foundation checks successful. Current branch is `fix/competency-review-identity`: owner-requested one-card-per-skill profile presentation with preserved contribution/source/review identity; repair independent review keys under ADR 0027. Grouping must not merge factual status or overwrite source evidence. Gemini 3.5 Flash-Lite passed the bounded synthetic extraction/profile pipeline; configured defaults remain unchanged. Test and prepare a new PR without assuming authorization to merge it.

## Gemini Lite defaults — 2026-10-08

PR #19 is verified merged at `5bc9a3e84ad46273c80b7e483906063c55af4956`; continue on `feat/gemini-lite-defaults` from that main. The owner explicitly accepted Lite where suitable: Gemini document extraction/profile synthesis use `gemini-3.5-flash-lite` independently of the general `GEMINI_MODEL`; explicit task overrides still win. Gemini job/match retain Flash and the general model fallback. Unset providers still select Groq. Renew recipient/model-bound approval when a stored Flash run moves to Lite; preserve original saved result metadata. Test and prepare a new PR without merging it automatically.

## Document coverage continuation — 2026-10-08

PR #20 is verified merged; main `520bbe70869cc176f41585f457fd3a03cc911a34` adds explicit Flash/Lite options and per-model cooldowns, with successful Foundation CI. Current branch: `feat/document-coverage-audit`, ADR 0028. Owner resumed document-quality work and reiterated that Flash Lite must remain available across analysis tasks. Preserve those choices. Inventory source usage conservatively, disclose at most four follow-up calls on new approved runs, keep old runs unchanged and never label passage coverage as exhaustive competence. Private audit files remain outside Git. Test and prepare a PR without assuming merge authorization.

## Context and period continuation — 2026-10-08

PR #21 is verified merged at `ccae0ed53ef10bb74b5c12c36dd8599dbda60731`; push/PR/main Foundation checks passed. Continue on `fix/document-context-and-periods` with a small extraction correction: retain literal employer/project context through nested technical subsection headings, reset at global or same-level Markdown boundaries, and normalize explicit local month dates without inventing months from year-only endpoints. Preserve original periods, existing stored content, evidence, budgets and manual review behavior. This is not the generalized claim-context graph or conflict resolution. Test and prepare a new PR without merging automatically.

## Structured context continuation — 2026-10-08

PR #22 is verified merged at `182c22ca71dff1776258e81ebd222af8e82a530e`; push/PR/main Foundation checks passed. Continue on `feat/competency-career-context`, ADR 0029, with one owner-scoped revision-aware relationship table. Automatic links require a unique untouched career entry and exact shared documentary evidence; explicit review/removal preserves factual statuses and survives reanalysis. Existing job/CV snapshots, provider choices (including Flash Lite), AI approvals and source-deletion policy remain unchanged. This is a small domain slice, not the full proposed graph/conflict model. Test and prepare a PR; no automatic merge authorization.

## Expected-fact benchmark continuation — 2026-10-08

PR #23 is verified merged at `f0223f51cb18271f753fbe28b05343cbebf9bf53`; both pre-merge Foundation checks succeeded. Continue on `feat/document-semantic-benchmark` with a developer-only offline expected-fact evaluator and a demonstrated skills-list continuation correction. Independently select expectations; measure facts, context, explicit date precision and profile substance separately from quotation usage. Recorded private analyses/checklists/originals remain outside Git. No automatic provider calls, new table, default/model change or user review reset. Full semantic judging and company/project/date conflict reconciliation remain future increments. Test and prepare a PR; do not merge it automatically.

## Complete matching continuation — 2026-10-09

PR #24 is verified merged at `dafe2c385152d9993f9225abbbd5b4d6b21b7758`; main Foundation passed. The owner prioritized automatic full-profile matching over period conflict review. Continue on `feat/full-profile-job-match`: remove manual competency selection and the 30-item match cutoff, preserve exact owned CONFIRMED revision sets, literal evidence and recipient-bound consent, pack repeated statement/context pairs without dropping skill IDs, and display persisted coverage on saved-job cards. Do not imply provider quotas or context limits are removed. Do not merge automatically.

## Career comparison continuation — 2026-10-09

PR #25 is verified merged at `d2fbf252bf52063b4729b682f23327eb3a037b35`. Continue on `feat/career-period-review`: a conservative local history comparison, exact identity/known overlapping period candidate detection and on-demand documentary evidence. Never infer that parallel roles or older ongoing CVs are wrong; no fuzzy alias merge or automatic factual edit. Corrections reuse existing revision/confirmation rules. Durable dismissals and generalized conflicts remain pending. Test and prepare a PR; do not merge automatically.

## Job-specific preparation continuation — 2026-10-09

PR #27 is verified merged at `217192cd856dbac14ca05eb3640483c94130d9ac`. Continue on `feat/job-application-preparation`, ADR 0031. The current slice joins owned saved jobs/current automatic full-profile matching to selected base-CV text proposals. Retain complete supported confirmed evidence, exact source-text rechecks, CSRF/ownership and separate `CV_TAILORING` recipient/model consent. Wording review is page-session-only; never imply persisted changesets, factual promotion, a new tailored file or external submission. Original/reference snapshots remain readable after staleness. Broader requirement recall/visibility/transferability and onboarding are next slices. Test and prepare a PR; no automatic merge authorization.

## Requirement coverage continuation — 2026-10-09

PR #28 is verified merged at `e0f87ca1fb6bf5533f011c2ad5a6f38f40134830`. Continue on `feat/job-requirement-coverage` under ADR 0032: whole-source distinct criteria, defensive 128-criterion end-to-end bound, explicit unassessed output/provisional coverage, persisted answer continuity and compact source review. Keep personal confirmation separate from semantic relevance; never freeze a previous model judgment as a fact or silently resurrect rejection. Existing duplicates/legacy snapshots remain source-preserving. No new schema migration or provider defaults. Validate and prepare a PR without merging automatically; transferability/visibility and durable proposals remain next slices.
