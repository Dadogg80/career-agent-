# Career Agent

AI-støttet jobbsøking med etterprøvbar kandidatkunnskap, kompetanseavklaring og brukerens kontroll over søknadsmaterialet.

The merged local pilot provides a landing page, dedicated sign-in, dashboard, owned profiles/documents, saved jobs, reviewed standard CV export and manual application tracking. Advertisement analysis is at `/jobs/analyze`; Norwegian is the default, with English throughout. Gemini Flash/Lite and Groq are selectable with recipient/model-bound approval. Documentary profile imports, grouped skill cards, a persistent review queue, candidate presentation and explained matching/inline clarification are merged through PR #21, including source-usage checks and bounded targeted follow-up (ADR 0028). PR #22 corrects nested source context and explicit local-format month endpoints. PR #23 adds merged revision-aware competency-to-career links with exact shared source proof and explicit local review (ADR 0029). PR #24 merged offline expected-fact measurements and cross-portion list recovery; main Foundation CI passed. PR #25 merged complete confirmed-profile matching, literal passage packing and saved-job coverage badges at `d2fbf25`. PR #26 merged conservative period differences and on-demand side-by-side history/source comparison at `289dcd1`. The [job matching and CV tailoring standard](docs/JOB_MATCHING_AND_CV_TAILORING_STANDARD.md) defines the next joined journey through editable CV text proposals; the current preparation slice adds job-specific readiness, base-CV selection and separately approved, editable old/new text suggestions. Suggestions and review decisions remain page-session-only; no tailored file/version is created. See [run instructions](docs/RUNNING.md), [Gemini setup](docs/GEMINI_SETUP.md), [whole-document review](docs/FULL_DOCUMENT_REVIEW.md) and [pilot testing](docs/TESTING_PILOT.md).

Supported links are individual `https://arbeidsplassen.nav.no/stillinger/stilling/<uuid>` advertisements available in NAV’s API. FINN links in the form `https://www.finn.no/job/ad/<id>` support separately selected Groq Browser Search or Gemini 3.8 Flash URL Context retrieval; requirement analysis uses its own independently approved model choice. FINN results are labeled AI-prepared excerpts and may be incomplete, stale or paraphrased, never verified original page text. The Gemini route requires successful URL Context retrieval and a citation to the exact requested advertisement URL; it does not silently fall back to another provider. Selecting Analyze link retrieves and analyzes in one action, with a configurable 10-second pause between FINN calls when the Groq-to-Groq flow requires it; source evidence and the original link remain available for inspection. Both provider keys remain backend-only, with separate bounded source budgets and no paid upgrade or quota guarantee. Other unsupported sources retain the Paste text alternative.

## Lesestart

| Dokument | Innhold |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | Produktvisjon, målgruppe, språk og foreslått MVP |
| [USER_FLOWS.md](USER_FLOWS.md) | Brukerflyt, avklaringer, godkjenning og feiltilstander |
| [USER_STORIES.md](USER_STORIES.md) | Stories med akseptansekriterier og foreslått prioritet |
| [ROADMAP.md](ROADMAP.md) | Foreslåtte leveranser og ferdigkriterier |
| [SECURITY.md](SECURITY.md) | Foreløpige sikkerhets- og personvernkrav |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Systemgrenser, modulansvar, AI og varig arbeid |
| [DOMAIN.md](DOMAIN.md) | Domenebegreper og invarianter |
| [docs/adr/README.md](docs/adr/README.md) | Arkitekturbeslutninger med eksplisitt status |
| [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) | Branches, commits, push og review |
| [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) | Foreslått lokal drift og AI-utprøving på Apple M1 |
| [docs/AI_OPTIONS.md](docs/AI_OPTIONS.md) | AI-kandidater, gratisnivåer og nødvendige kontroller |
| [docs/RUNNING.md](docs/RUNNING.md) | Installasjon, lokal kjøring og tester for første utviklingsversjon |
| [docs/GROQ_SETUP.md](docs/GROQ_SETUP.md) | Sikker deling av Groq-nøkkel og hva som gjenstår |
| [docs/TESTING_PILOT.md](docs/TESTING_PILOT.md) | Local pilot test guide, scope and limits |
| [docs/DEBUGGING.md](docs/DEBUGGING.md) | Staged loading, pacing, source inspection and development diagnostics |
| [docs/DOCKER_STRATEGY.md](docs/DOCKER_STRATEGY.md) | Recommended Docker usage and tradeoffs |
| [docs/NEXT_DELIVERY.md](docs/NEXT_DELIVERY.md) | Proposed URL ingestion and richer job overview delivery |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Bekreftede føringer og anbefalinger som ikke er vedtatt |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Uavklarte spørsmål og konsekvenser |
| [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) | Hva som faktisk er gjort og kontrollert |
| [AGENTS.md](AGENTS.md) | Arbeidsregler for utvikling og dokumentasjon |

## Dokumentasjonsprinsipp

Dokumenter beskriver enten krav, forslag eller faktisk implementert atferd. Disse skal skilles tydelig. Ingen foreslått funksjon skal omtales som ferdig uten implementasjon og verifikasjon.

Markdown-filene er prosjektets felles hukommelse. De skal ikke inneholde pilotens CV, private søknader, kontaktopplysninger eller hemmeligheter.

Arkitektur- og domenedokumentene er foreløpige design. ADR-indeksen og beslutningsregisteret viser hva som er vedtatt og hva som fortsatt er foreslått.

### Direct job analysis

Select **Analyser lenke / Analyze link** to retrieve and analyze a supported public URL in one action. Results now lead with a compact, source-based employer and role overview, who the employer is seeking, what they offer, and practical details such as location, contact and deadline. Explicitly labeled source fields can fill a missing extracted practical fact; other unknowns remain visibly unknown. Requirement categories follow the overview, with quotations and context available on demand. If source-backed suggestions are omitted, users can inspect the received text, manually add a detail with an exact quotation, and include it only by explicitly saving the job snapshot. The source model selector opens a compact menu, and full source text remains expandable. If AI structuring fails, the received advertisement remains visible as plain text, with a manual retry; unsupported AI suggestions are never accepted merely to fill cards. Browser excerpts remain explicitly labeled as potentially partial/stale. Reviewed competencies and local CV import are available behind local sign-in. The basic profile is separate from public-ad analysis.

### Optional persistence foundation

PostgreSQL Compose and Flyway migrations are available behind the `persistence` Spring profile. See [local PostgreSQL setup](docs/POSTGRES_SETUP.md). The backend test suite now requires Docker for real migration/integrity tests. Public advertisement startup remains database independent. Optional profile login/API/UI require both `persistence,identity`; see [identity setup](docs/IDENTITY_SETUP.md).

### Rate limits and retries

A fresh FINN analysis uses separately selected browser retrieval followed by structured extraction. The selected provider/model and approval are independent for each task. The application keeps a bounded cooldown per provider/model, shared across backend features using that same model. A manual retry for the same fetched URL reuses the current text instead of repeating browser search. Source-unsupported suggestions are omitted with a visible count; wholly unsupported or invalid results still fail. See ADR 0012, ADR 0037 and docs/GROQ_SETUP.md.

The frontend now shows retrieval → pause → analysis with honest loading statuses and a decorative animation. FINN retrieval and requirement analysis each have an independent backend-approved model choice; a model change is bound to a distinct approval fingerprint. Development includes a hidden right-side shadcn Sheet, opened from the DEV edge tab, with status lights, received-source inspection and sanitized console events. Set `NEXT_PUBLIC_ANALYSIS_DELAY_SECONDS` in `apps/web/.env.local` to adjust the default 10-second Groq FINN pause. This does not guarantee quota availability. See [debugging instructions](docs/DEBUGGING.md).

## Document AI competency summaries

Merged PR #14 added opt-in Groq analysis of one document or all readable uploaded CVs/certificates together. Review editable excerpts, approve sending, inspect source-backed summaries/suggestions and explicitly save selected drafts as UNVERIFIED before separate confirmation. Nothing is sent during upload. Uses the existing backend GROQ_API_KEY, local identity/persistence and a bounded single provider call. See [CV_IMPORT.md](docs/CV_IMPORT.md) and [ADR 0016](docs/adr/0016-opt-in-document-ai-analysis.md).

## Improved competency workspace

Search recorded competencies by skill/project/source and filter their review status. Document review uses full editable previews and sequential owned progress; manual source portions are no longer required in the primary workspace. Source-backed competencies, profile summaries and career history have separate result views. The profile groups repeated skills across projects/documents into one card with combined existing explanations; confirmed evidence and drafts stay separate. Expand the card for each original contribution, source and edit/review controls. Document extraction proposals retain their company/project grouping. Read-only document checks and explicitly requested local OCR remain available. See [whole-document review](docs/FULL_DOCUMENT_REVIEW.md) and [CV import](docs/CV_IMPORT.md) for source limits and Mac setup.

## Local job library and matching

The current branch adds owned saved advertisement snapshots and a searchable library, plus approved personal matching against selected CONFIRMED statements. Save/reopen makes no AI call. Each match shows exact preview/revision references and requires approval before one private Groq request. Changed evidence marks the result stale; undocumented skills remain unknown. See [Saved jobs](docs/SAVED_JOBS.md), [Matching](docs/MATCHING.md) and [Roadmap](ROADMAP.md). The owner authorized publishing and merging this local-pilot delivery on 2026-10-08.

### Whole-document review and Groq optimization

Merged PR #18 includes automatic document portions, editable sourced profile/history/competency drafts, documentary population and section-based profile navigation. See [the workflow and limits](docs/FULL_DOCUMENT_REVIEW.md) and [Groq documentation findings/configuration](docs/GROQ_OPTIMIZATION.md). Model defaults remain unchanged pending live quality comparison.

## Opt-in Gemini analysis

Gemini is available through explicit task routing; Groq remains the default unless configured otherwise. Add GEMINI_API_KEY to the existing ignored backend `.env` and load it into the backend process. The UI names recipients/models and requires new private-data approval; stored Groq runs cannot migrate implicitly. FINN retrieval has a separate choice between Groq Browser Search and Gemini 3.8 Flash URL Context; neither a retrieval approval nor a model's presence in the selector certifies provider availability or result completeness. See [Gemini setup](docs/GEMINI_SETUP.md).

## Latest delivery and AI recovery

The Gemini/whole-document continuation was merged in [PR #16](https://github.com/Dadogg80/career-agent-/pull/16) on 2026-10-08. The evidence-quality improvements merged in PR #17; PR #18 added documentary profile population and matching UX. The current follow-up consolidates profile skill cards and protects independent review decisions. With both backend keys configured, choose **Try with Gemini** after a Groq quota failure, review/approve the new recipient and continue the saved work. Actual provider/model badges retain older result attribution. For FINN, Gemini URL Context retrieval is an explicit separate choice, not an automatic recovery from Groq failure; budgets and account quotas still apply. See [ADR 0026](docs/adr/0026-approved-ai-provider-recovery.md) and [ADR 0037](docs/adr/0037-gemini-finn-url-context.md).
