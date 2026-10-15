# Career Agent development instructions

## Permanent development guidelines

Read this root AGENTS.md at the start of each Codex session, together with any applicable directory-specific AGENTS.md and task documentation. These permanent guidelines apply across the repository. Preserve project-specific requirements below. Dated continuation notes record scoped decisions and historical authorization, not standing permission to repeat a merge or release. Determine the current phase from the latest applicable owner-approved continuation and verified repository state; do not blindly resume an obsolete branch instruction.

### Language policy

- Use clear, professional English for all GitHub communication and repository-authored development content: commit messages, branch names, pull request titles/descriptions, issues, discussions, review comments and technical implementation summaries intended for GitHub.
- Use English for code comments, documentation, README, CHANGELOG, release notes, and GitHub Actions names, descriptions and workflow comments. When updating existing Norwegian documentation, write the changed section in English while preserving its meaning and untouched historical content; do not perform an unrelated repository-wide translation.
- Conversation with the product owner may remain Norwegian. The application remains Norwegian Bokmål by default and supports English from the first version. This development language policy must not translate or modify user-facing application copy, interface locales or user-provided content unintentionally.
- Every PR handoff must include an English title and a complete English description, with actual validation and limitations.

### Roles and expertise

Operate with the judgment of a multidisciplinary senior engineering team. Select the perspectives relevant to the task: Senior Software Engineer, Senior Software/System Architect, DevOps Engineer, Release Manager, Senior Systems Manager, Senior QA Engineer, Senior Tech Lead, Senior UX/UI Designer, Senior Product Engineer, AI/LLM Systems Engineer, Security Engineer, Database Engineer and Technical Documentation Specialist. Adopt additional specialist perspectives when useful. Do not apply every role mechanically or expand the authorized scope merely to exercise a role; use the expertise needed for maintainable, secure, high-quality delivery.

### GitHub and release management

- Use feature branches and pull requests for significant changes. Keep main stable and Git history clean and meaningful.
- Follow Semantic Versioning where appropriate, with version tags such as `v0.1.0`, `v0.2.0` and `v0.2.1`.
- Maintain CHANGELOG.md and release documentation as part of meaningful releases; do not invent historical versions or release results.
- Create GitHub Releases for meaningful, verified milestones only after relevant CI checks pass and the owner explicitly authorizes publication.
- Never create official tags, publish releases, merge to main or deploy to production without explicit authorization for that action and scope. An old authorization for a completed delivery does not authorize later deliveries. Authorization to implement or prepare a PR does not by itself authorize release, merge or deployment.

### Autonomy and approval

Act proactively within the authorized task. Make reasonable low-risk, reversible technical decisions independently, and identify missing requirements, concrete risks and useful improvements. Ask for approval before destructive operations, major architectural changes, production deployments or other consequential actions that are not already explicitly authorized. Routine decisions within an approved architecture or implementation plan do not require repeated approval. Keep implementation summaries concise, actionable and honest about remaining limitations.

## Project phase and continuation history

### Active scope — 2026-10-08 knowledge review

The owner explicitly resumed document/profile implementation after the knowledge-model review. Use [the staged proposal](docs/CAREER_KNOWLEDGE_MODEL_PROPOSAL.md) as design guidance; it does not authorize inventing facts or implementing every proposed table at once. The saved workflow/PDF experiments are restored on `feat/full-document-career-review`; retain tested source, ownership and pacing invariants. Current scope: complete-document analysis with owned resumable progress, editable sourced competency/history/profile drafts, compact profile navigation, conservative PDF readability fixes, and configurable task-specific AI model selection with unchanged defaults until quality validation. Preserve explicit per-run consent, exact source evidence, user confirmation and existing document-deletion disclosures. No silent automatic model switching after a quota failure. The owner subsequently authorized explicit in-app alternate-provider recovery: follow ADR 0026, clear private consent when the recipient/model changes and preserve saved sources/progress. The owner explicitly authorized publication and merge of this continuation on 2026-10-08, followed by the related quality priorities. Verify remote main and required checks before merging.

Implementation is authorized in small coherent increments. The foundation is merged; current slices include direct URL analysis, sourced overview facts, and an opt-in PostgreSQL/Flyway foundation alongside bounded FINN and NAV import. Browser excerpts must never be presented as verified complete original advertisements. Optional local OIDC/PKCE sign-in and user-owned basic profiles (name/language/revision) are now implemented; owned reviewed competency claims, local DOCX/PDF sources and opt-in single/combined AI summaries are merged in PR #14. The merged pilot improved competency UX, bounded source selection, existing-original rereading and explicitly requested local Tesseract OCR. The current branch replaces manual document portions with resumable full-source review and sourced editable drafts. The owner also authorized optional Groq summarization and competency proposals from single or multiple uploaded documents before merge (ADR 0016). Require owned private endpoints, reviewed bounded previews and explicit per-run approval; output remains unverified until user review. Reviewed typed career history and a public landing/dedicated sign-in/workspace overview are added locally; root analysis moves to /jobs/analyze and fixed OIDC callbacks use /dashboard or /login?login=failed. Owned saved job snapshots and per-analysis-approved matching are now implemented on the local branch; adjacent-skill inference and production identity remain pending. The owner approved relevant CONFIRMED claims plus advertisement text for future Groq matching only with preview and per-analysis approval. First pilot hosting is local on the owner's Mac; online hosting is deferred. Private content must never enter public advertisement endpoints or advertisement diagnostics. The local pilot also includes reviewed standard CV export, manual application tracking, UTF-8 TXT/Markdown evidence, conservative multi-source competency deduplication and local advertisement recovery. Document AI now selects numbered evidence and uses source wording, with literal skill validation and nearby context proof or unknown context (ADR 0023). Read-only owned document checks validate original/text/quotes without AI calls; green checks never establish semantic completeness. Keep future increments small and tested; the owner explicitly authorized pushing this delivery and merging it to main on 2026-10-08. Do not build the full system at once. No paid services, plan upgrades or infrastructure costs are authorized.

## Product requirements

- The long-term audience is all job seekers. The product owner is the first and currently only pilot user.
- Pilot use and testing are free for the user. Do not incur costs without explicit authorization.
- Never invent experience. Distinguish UNVERIFIED, INFERRED, CONFIRMED and REJECTED.
- AI extraction is not confirmation. Confirmed claims need traceable evidence or explicit confirmation.
- The user must approve submissions, messages, substantial profile changes and acceptance of terms.
- Preserve original documents and record which version belongs to an application.
- Keep candidate information, document content and secrets out of Git and project documentation.

## Product methodology and current journey priority — 2026-10-09

Read [Job matching and CV tailoring standard](docs/JOB_MATCHING_AND_CV_TAILORING_STANDARD.md) before changing extraction, matching, clarification or CV/application behavior. The owner supplied this profession-independent methodology as product direction. Its 71 numbered sections and delivery matrix distinguish target rules from current implementation; it is not a prompt to send wholesale to a provider.

Current priority: review/test the joined login → document/profile → advertisement → saved job → full-profile match → Apply for this job → editable CV tailoring journey. Add compact readiness guidance, an optional tutorial and contextual help. The next milestone stops at reviewed text proposals; tailored file/version generation and letters/submission are deferred. Preserve full confirmed evidence inclusion, explicit recipient/model-bound approvals, original documents and source/revision checks. Unknown evidence is not a proven gap. Do not silently trade these owner decisions for prompt instructions about token reduction, source ranking or new enums. PR #26 is verified merged at `289dcd15e20d5b9887202425cd9360e22082d19b`. Implement and test coherent slices of the joined journey; do not merge later PRs automatically.

## Engineering principles and implementation workflow

When implementation is authorized:

1. Inspect the existing implementation, README and relevant project documentation before proposing changes.
2. Plan a small, coherent change. Reuse established architecture, patterns and components; follow existing coding conventions and preserve working functionality.
3. Prefer simple, maintainable solutions. Avoid unnecessary dependencies, complexity and rewrites of working code.
4. Protect user data, credentials and privacy. Review security, accessibility, reliability and performance where relevant to the change.
5. Write and run relevant automated tests. Use focused checks during development and required CI for delivery; avoid unrelated repeated full-suite runs. Fix failures and distinguish passed, failed, skipped and unrun checks. Never fabricate implementation or test results.
6. Document important architectural decisions and explain significant technical trade-offs and remaining limitations.

Each cloud task already has an isolated environment. Use the existing checkout; do not create a Git worktree without an explicit request.

## Documentation as part of delivery

- Update USER_FLOWS.md when the user journey changes and USER_STORIES.md when requirements change.
- Update ROADMAP.md when scope or completion status changes.
- Record decisions, status, rationale and consequences in docs/DECISIONS.md; use an ADR for material architectural decisions when adopted.
- Keep short, factual docs/DEVELOPMENT_LOG.md entries covering changes, actual validation and remaining work.
- Record unresolved questions in docs/OPEN_QUESTIONS.md. A proposal is not an approved decision.
- Update existing documentation instead of creating parallel, contradictory descriptions. Preserve history when replacing a decision; mark it superseded and link its successor.
- When a published branch is ready for PR/merge review, provide base/head branches, the PR title and full description with actual validation and limitations. Verify current remote main before starting the next delivery; follow the authorization rules above for merge and release actions.
- Do not store raw conversation logs or personal information to increase documentation volume. Record relevant intent, requirements, rationale and results.

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


## Guided workspace continuation — 2026-10-09

Continue on `feat/guided-workspace-journey` from verified PR #30/main `9df2ae4`. PR #31 remains open with successful Foundation checks; this frontend onboarding slice is independent. Use metadata-only dashboard guidance and an optional local five-step guide, not inferred match completeness or new AI work. The owner requested lower token use: use concise reads/output and focused affected checks, no live provider calls by default. Required CI still runs the full regression. Document actual test scope and prepare a PR; do not merge automatically.

## Requirement coverage continuation — 2026-10-09

PR #28 is verified merged at `e0f87ca1fb6bf5533f011c2ad5a6f38f40134830`. Continue on `feat/job-requirement-coverage` under ADR 0032: whole-source distinct criteria, defensive 128-criterion end-to-end bound, explicit unassessed output/provisional coverage, persisted answer continuity and compact source review. Keep personal confirmation separate from semantic relevance; never freeze a previous model judgment as a fact or silently resurrect rejection. Existing duplicates/legacy snapshots remain source-preserving. No new schema migration or provider defaults. Validate and prepare a PR without merging automatically; transferability/visibility and durable proposals remain next slices.

## Evidence relation continuation — 2026-10-09

PR #29 is verified merged at `8e88d1f0832b1ae673f7f01a110733b740b713da`; both Foundation checks passed. Continue on `feat/match-evidence-explanations` under ADR 0033: nullable source-backed AI relation/nature metadata, conservative transferable/formal score constraints, compact saved-card qualification hints and existing-result application priorities. Do not label older results, promote factual status or claim base-CV visibility is complete. Preserve full evidence, consent, sources and staleness. Prepare a tested PR without automatic merge.

## Base-CV visibility continuation — 2026-10-09

PR #30 is verified merged at `9df2ae41fc61d7769346de3c5af4413665c54810`; both pre-merge Foundation checks passed. Continue on `feat/base-cv-visibility` from this main, under ADR 0034. Use one approved CV_TAILORING request for source-bound criterion visibility and wording. Keep exact selected-CV/current-match references, candidate uncertainty separate from presentation gaps, per-item unassessed recovery and historical result readability. No additional calls, factual promotion, model defaults, migration or durable changeset. Verify updated main before the next delivery. Do not merge automatically.

## Reviewed CV text handoff continuation — 2026-10-09

PR #31 merged at `ab15566a003c03c043f77a00c74e17016cb8825f`; PR #32 merged at `e7f18bf36f02568d062b58bfeddbeb26df9dd911`, both with successful Foundation checks. Continue on `feat/reviewed-cv-text-handoff` from that main under ADR 0035. Exact-source plain-text preview/copy is local and explicit, with approved changes only and stale/error guards; no original/file/version/profile writes or provider calls. Preserve the owner's focused-validation/no-live-AI-default preference. Prepare a tested PR without automatic merge.

## Owner gate before further CV tailoring — 2026-10-12

The owner explicitly paused further CV-tailoring development. Before starting that work, clearly notify the owner and wait for their user/process flow from the other assistant; discuss it together before implementation. Continue document, profile and competency improvements in the meantime. Existing CV proposal functionality remains unchanged by this gate; do not treat a generic “continue” as authorization to resume CV tailoring.


## Approved CV-tailoring continuation — 2026-10-12

The owner supplied the master process, discussed the repository audit and explicitly approved the incremental plan. The earlier pause gate is satisfied for that plan. Follow [the approved specification](docs/CV_TAILORING_MASTER_SPEC.md) and existing product standard. Begin with durable owned wording sessions/reviews and source/revision checks; section planning, generated tailored files, supported Falck layout and independent final document review remain subsequent increments. Standard export first is accepted. Preserve documentary versus personal confirmation basis, full confirmed matching evidence, recipient/model consent and original files. Wording approval is not factual confirmation or CV_READY. Use focused mocked/synthetic checks without live AI calls by default; prepare PRs without automatic merging.
