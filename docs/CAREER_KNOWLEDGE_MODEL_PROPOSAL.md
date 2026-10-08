# Career Knowledge Base: incremental relational model

Status: The full normalized target remains PROPOSED. Prepared on 2026-10-08 for the owner's domain review; subsequent explicit instructions resumed the document/profile slice. ADR 0024 implements only the initial run-state and career-entry evidence subset. This proposal alone does not authorize all target migrations.

## Recommendation and existing foundation

Keep the Kotlin/Spring modular monolith, PostgreSQL and explicit SQL/JDBC repositories. Extend existing owned career entries, competency claims, evidence and revision histories. Do not introduce JPA, a graph database, Kafka, Temporal, pgvector or a generic agent framework to normalize knowledge.

The merged pilot already contains reviewed career entries, owned documents, claims, saved jobs, matching, standard CV export and manual application tracking. It does not yet have a normalized concept catalog, independent reusable confirmation evidence, structured claim-to-career-entry relationships, durable clarification questions or explicit conflict records. At the original review pause, full-document workflow and PDF extraction experiments were unfinished and unpublished, preserved in the named local stash `Pause document workflow and PDF extraction prototypes pending domain review` (object `00f914c2f64826a73d5b4399bb4425c14ecf214c`). They were not enabled in the maintenance working tree. The owner subsequently resumed the document/profile slice; the restored experiments are repaired and tested on `feat/full-document-career-review`. ADR 0024 implements only owned progress and revision-linked career-entry quotations, while the normalized catalog/context/conflict target remains proposed.

Start with three new relationship/catalog tables plus aliases; introduce entry-evidence links, conflicts and questions in later small migrations. The complete target below is seven new tables, not seven tables required before delivering any value. A separate Candidate table adds no value while one personal account owns one profile. Adviser/organization access must later use explicit grants, not implicit access through membership.

## Proposed schema

Existing IDs and ownership remain stable. Every personal relationship uses owner-scoped foreign keys, including revision identity where content matters. UUID knowledge is never authorization.

| Table | Important fields and responsibility |
| --- | --- |
| `skill_concept` (new) | `id`, unique stable `key`, canonical name, category, Norwegian/English display labels. Curated shared vocabulary; no personal project information. |
| `skill_alias` (new) | `concept_id`, locale, normalized alias. Only equivalent terms; ambiguous aliases require disambiguation. Preserve punctuation in C, C++, C#, .NET and Node.js. |
| `competency_claim` (extend) | Keep current ID, owner, statement, skill label, context, status and revisions. Add nullable `concept_id`, typed predicate, contribution scope, creation origin and semantic content fingerprint. Unknown concepts remain valid reviewable drafts. |
| `claim_context` (new) | Owner, claim ID/revision, career-entry ID, relationship such as IN_PROJECT or IN_EMPLOYMENT. Context must be supported or reviewed; do not guess an employer from a nearby heading. |
| `competency_evidence` (evolve) | Independent immutable evidence ID, owner, source type, document reference/hash, extraction version, source-text hash, quote and optional section/offset locator; or authenticated user confirmation/correction with actor, timestamp and reviewed content fingerprint. |
| `claim_evidence` (new) | Owner, claim ID/revision, evidence ID, relationship SUPPORTS or CONTRADICTS. One passage can support multiple distinct claims without duplicating the source. |
| `career_entry` (extend) | Existing typed entries/revisions remain. Add optional same-owner employment reference for project engagements, a distinct formal title and date precision. Do not manufacture months from year-only dates. |
| `career_entry_evidence` (new, later) | Owner, entry ID/revision, evidence ID, optional field/predicate and SUPPORTS/CONTRADICTS. History needs provenance as much as skills do. |
| `claim_conflict` (new, later) | Owner, two alternative claim IDs/revisions, disputed predicate/context/period, OPEN/RESOLVED/DISMISSED, reviewed resolution. Different formal and delivery roles are not inherently conflicting. |
| `clarification_question` (new, later) | Owner, hypothesis claim/revision, optional saved-job requirement reference, question, rationale, PENDING/ANSWERED/DECLINED/CANCELLED, answer, authenticated decision metadata and scoped idempotency key. |

Do not split Employment, Project, Role and every kind of education into separate persistence hierarchies immediately. Typed career entries can represent candidate-specific engagements while their relationships become explicit. Introduce a participation join only when a real project engagement must relate to multiple employments. Employer, client, project and actual delivery role remain distinct fields. A generic free-text `context` remains an adapter/display field, not the authoritative relationship after migration.

Suggested initial claim predicate is SKILL_EXPERIENCE, with separate RESPONSIBILITY, ACHIEVEMENT, FORMAL_ROLE and DELIVERY_ROLE introduced as reviewed use cases require them. Preserve SELF, TEAM and UNCLEAR contribution scope; a team outcome must not become personal ownership.

## Confirmation, inference and matching invariants

- Document extraction creates UNVERIFIED proposals. Reasoning creates INFERRED hypotheses. Neither confirms experience.
- CONFIRMED means the user reviewed this specific content and context. Record confirmation as independent evidence, rather than only overwriting a status field.
- Semantic edits create a new revision and invalidate the old confirmation for current use. A cosmetic label change or an exact alias annotation must not silently invent or remove experience.
- Model confidence is an uncalibrated prioritization signal for questions, not the probability that an experience is true. Never translate a high confidence into CONFIRMED.
- REJECTED is scoped to the claim and context; it does not prove a universal skill gap.
- Quotes prove the words exist in a source, not that an AI interpretation is correct. Both source support and human review are necessary for outward-facing factual claims.
- Related terms are not aliases. Background jobs are not always equivalent to all asynchronous processing; Kafka is not equivalent to event-driven architecture; React Native is not React.
- Personal matching and CV generation share one eligibility policy: current confirmed content, owned context/evidence and no unresolved material contradiction. Historical approved CV artifacts keep their original snapshot; new knowledge does not rewrite a submitted CV.
- Missing knowledge means unknown or needs clarification. A genuine gap needs an explicit answer or reviewed basis. Matching should distinguish direct experience, related experience, uncertainty and a confirmed gap without arbitrary percentages.
- CV visibility is relative to a particular CV version and wording. Keyword absence alone is not proof that experience is missing from that CV.

A profile summary is a versioned derived view, not a competing biography. A draft summary may include visibly unverified document findings; approved outward-facing summaries use reviewed facts. Interests, motivations and goals require explicit source/user statements and must not be guessed from a technology stack or advertisement.

## Aggregates and commands

Use small aggregates: Profile/settings, CareerEntry, Claim, immutable Evidence, Clarification and Conflict; the shared concept catalog has separate administration. Do not load the candidate's entire history as one aggregate for every edit.

Review commands write the revised content, confirmation evidence, relationship changes and audit record in one database transaction. Resolving a question can update its hypothesis and create confirmed content in the same transaction. This needs neither Kafka nor Temporal.

The eventual document workflow reads the complete selected documents in internally bounded, observable batches, produces typed history/skill/summary drafts, links exact source evidence and presents one review queue. A user should not select numbered chunks manually. Separate failures/coverage per document must remain visible; partial success must not imply complete extraction. Combining sources should preserve provenance and conflicting context rather than flattening everything into one paragraph.

AI-prefilled proposals remain editable. One explicit confirmation action can save and confirm reviewed content atomically; two redundant clicks are not required, provided the audit records both creation and confirmation. Bulk approval must clearly show the selected content and must never approve hidden guesses. Existing limits of 100 claims/50 entries need deliberate pagination/capacity design before enabling workflows that can create hundreds of proposals.

## Worked examples

Examples use fictional employers/projects to keep personal CV information outside Git.

**Payment integration:** A user has a confirmed claim that they implemented Stripe in AsterHealth, an engagement at Example Digital AS. Stripe maps to its concept and the claim links to that project and the user's confirmation/source evidence. The runtime may propose an INFERRED webhook claim, with the original Stripe fact as its rationale. Ask whether events arrived through webhooks, polling, a plugin or another mechanism, allowing “unsure”. Confirmed webhook implementation gets its own contribution, context and confirmation evidence. This does not confirm Kafka, idempotency, retries or responsibility for the team's entire event architecture.

**Formal title versus delivery role:** A certificate says Software Developer at Example Digital AS; a reviewed project account describes a Tech Lead delivery role in AsterHealth. Store the formal title and delivery role separately, with their own evidence and periods. Both can be true. If two sources give different formal titles for the same period, open a conflict instead of choosing silently. Evidence ranking can help frame the question, but a certificate must not automatically override the user's explicit correction. Unresolved material contradictions require review before confident CV wording.

## Migration and compatibility plan

Main currently has migrations V1–V11. There is an unpublished V12 document-run migration in the working directory. Inspect each pilot's actual Flyway history before allocating versions; never edit or renumber an already-applied migration.

| Stage | Change | Compatibility condition |
| --- | --- | --- |
| 0 | Close unfinished workflow ownership/authorization and deletion gaps before enabling that workflow. | No new private endpoint becomes usable through the public advertisement path. |
| 1 | Add concepts/aliases, claim-context and claim-evidence relationships plus nullable claim metadata. | Existing APIs, IDs, approved versions and snapshots continue working. Only exact reviewed alias matches are backfilled automatically; free-text context is not guessed. |
| 2 | Make evidence independently reusable, add entry-evidence links and migrate genuine confirmation records. | Backfill from actual recorded confirmation actions tied to content; do not fabricate confirmation timestamps/actors merely because a legacy row says CONFIRMED. Keep a transparent legacy basis until reviewed migration is possible. |
| 3 | Add typed review commands and adapter reads; transactional dual-write during transition. | Compare old/new read results and ownership before switching authority. No wholesale reconfirmation or loss of legitimate confirmed claims. |
| 4 | Add conflicts and scoped clarification questions. | Existing manual review stays usable. Repeated questions are idempotent for the same context/evidence revision; new context can warrant a fresh question. |
| 5 | Add CV visibility checks, then retire obsolete evidence-to-single-claim coupling. | Remove legacy columns only after complete backfill, consumer migration and tested restoration. Never regenerate previously sent documents automatically. |

Use integration tests with real PostgreSQL for owner-scoped relationships, migration/backfill parity, idempotent review, semantic-edit confirmation invalidation, question resolution, conflicting roles and deletion. Validate backup restoration as well as forward migration. Schema diagrams and migration design are proposals here; no executable migration is added by this review.

## Deletion and source authority need explicit policies

Proposed deletion choices: (1) source only, explicitly retaining selected quoted evidence; (2) source plus evidence, retaining claims only where independent current user confirmation or another reviewed basis remains; (3) source, evidence and selected dependent claims. Recommend option 2 as the default preview, subject to owner approval. Removing evidence should mark unsupported remaining drafts for review, not assert they are false.

Deletion must inventory originals, extracted text, workflow run JSON, draft summaries, claim/entry revisions, CV snapshots, match archives and backups. The unfinished document-run prototype currently needs such cleanup. Historical artifacts can contain source quotes; source deletion alone cannot claim all copies are gone. Define archival retention/removal explicitly without silently rewriting approved application material. Account deletion is a separate complete ownership cleanup.

Source ranking should be fact-specific and advisory. For example, an employment certificate can be strong evidence for formal title while a reviewed project account is more relevant to delivery responsibility. A user correction can challenge either. There is no universally authoritative master CV.

## Extraction quality and decisions before implementation resumes

Maintain private golden fixtures from the supplied documents, with expected literal facts, employer/project attribution, source coverage and hypotheses marked separately. Commit only fictional regression fixtures. Measure extraction recall, incorrect attribution, duplicate proposals and unsupported claims; readable PDF output and intact files are not evidence of semantic completeness. Compare independent extraction with actual Groq output using the same reviewed source input.

Targets such as 95% employer or 90% project attribution are proposed acceptance targets, not measured results or guarantees. Define the denominator and difficult cases before accepting them. Zero unsupported outward-facing claims remains a product invariant enforced by review and eligibility rules.

Remaining owner choices are the default deletion/archival policy, how to present conflicting source authority, and acceptance criteria for extraction quality. Technical defaults above do not require introducing more infrastructure. Resume implementation only after agreement on the model and staged scope.
