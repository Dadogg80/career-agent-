# ADR 0047: Optional saved-wording source review

Status: Accepted incremental continuation, 2026-10-14.

## Context

The current numerical guard and exact source/ID checks establish limited lexical/provenance constraints, not semantic truth. The controlled comparison showed unsupported specialist wording could pass those checks. A generation reason or optimistic match must not become proof of the generated statement. The approved master specification requires evidence review and visible uncertainty where verification is unreliable.

## Decision

Keep generation unchanged and add a separate optional source-opinion action on the latest owned durable wording session. One explicit action reviews all active, non-rejected proposals, up to the existing 40-proposal bound. The initial contract read the current saved draft, original passage, entry context, referenced claims and criteria. The v2 refinement below supersedes that input/output contract: only saved wording, known immutable entry context and the proposal's referenced confirmed sources are sent; original CV prose, advertisement criteria, match classifications and generator reasons are excluded. Reviewing this bounded evidence does not subset the full-profile matching input. Original CV text and job criteria are not additional factual confirmation.

Reuse the existing CV_TAILORING routing capability/model catalog without changing defaults. Give this review its own preview and recipient/model-bound per-run approval; old generation consent never starts it. The action makes at most one call, without automatic retries/fallbacks, and uses a separate process-local WORDING_REVIEW_AI_MAX_REQUESTS budget, default 5. It shares the selected provider/model's existing cooldown and output limits. No live availability/quality guarantee follows from an available choice.

The owned authenticated/CSRF-protected endpoint accepts session ID, revision and unique proposal indexes, never replacement client text/evidence. Recheck ownership, current sources and exact saved revision before and after the call. A concurrent edit or changed source rejects the response. A model-change approval mismatch rejects before sending data.

The initial response used free-prose reasons and copied quotations. The v2 contract below replaces them with typed findings, literal draft phrases and request-local source IDs, resolved to exact saved quotations and localized explanations by the server. A SUPPORTED opinion requires valid evidence; missing, duplicated or invalid per-item support is UNASSESSED. Valid other items remain readable. These checks cannot prove entailment. The UI says AI found support, scope needs review, potentially unsupported claim or unassessed; it never labels these as verified facts. The prompt checks every factual assertion and its qualifiers across professions without rewriting the text.

Findings are read-only and page-session-only, bound to the exact saved revision/text. Retain them after failures and display the original reviewed wording with an earlier-result warning after changes. Save edits before another review. No profile/snapshot/wording/approval/score/file is written by this action; existing human wording decisions and numerical/protected-field rules remain unchanged. This is an additional drafting opinion, not AI-13 final-file review or CV_READY.

## Consequences and limits

No schema migration or new dependency. The user can explicitly choose the same or a different supported model for a second opinion. The additional quota use is visible and optional. Source-bound AI opinions can still be wrong and require independent benchmark/human assessment; no detection accuracy is claimed from mocked tests. Persisted findings, resolved-finding gates, capacity optimization and independent semantic/structural/visual inspection of actual DOCX/PDF are later work. Generation retains the single-call invariant from ADR 0046; this explicit separate action does not silently extend it.


## Capacity refinement and live-quality limits — 2026-10-14

Keep the original nested per-draft evidence/context/criteria input. Optional review alone uses a request-local output budget of `(1024 + 384 * proposalCount).coerceIn(2048, 16384)`. Route that exact budget to the approved provider/model, bounded by its existing task limit. Generation, other task defaults and complete matching evidence remain unchanged. The formula is a reservation bound, not a prediction of provider token usage or a completeness guarantee. Existing incomplete-output/invalid-item behavior, separate consent and no retries remain.

An explicitly authorized private comparison made six live calls: two synthetic model checks and four checks of the same six real-document controls across nested/shared input forms. Both models met eight synthetic expectations. On real excerpts, false support and nonliteral quotes remained; shared versus nested outcomes varied. Input bytes were 5.4% lower for shared real excerpts but 11.2% higher for the low-sharing synthetic fixture. No claim of token/latency improvement, semantic equivalence or universal model superiority follows. Shared evidence dictionaries are not shipped; further compaction requires independent quality/stability evidence. Real documents, outputs and the private harness stay outside Git. Persisted findings and actual final-file review remain deferred.


## Source-only contract v2 — 2026-10-14

The controlled comparison found advertisement requirements used as candidate proof, quotations paraphrased by providers and English reasons under a Norwegian request. Separate factual support from job relevance in this optional action. Send saved draft wording, known immutable entry scope and every statement/context character from the draft's referenced confirmed claims. Exclude advertisement criteria, original CV wording, skill labels, generator reasons and match judgments from this source-only model input. This does not change the evidence or job criteria supplied to matching or initial CV generation.

Keep sources nested per draft. Assign unique request-local evidence IDs to literal statement/context passages of at most 1,000 UTF-16 code units, retaining claim ID, revision and field. Split only as necessary, preserving all characters, qualifiers and surrogate pairs. Never sample or deduplicate distinct claim identities/revisions. IDs from another draft are invalid even when that source is present elsewhere in the same request. Multiple drafts still share one call: reference isolation does not establish semantic isolation or truth.

`cv-wording-sources-v2` returns one typed finding, a short verbatim problematic draft phrase and up to ten distinct local source references per proposal. Findings distinguish support, scope expansion, uncertain context, source caveats, missing support, contradiction and unassessed work. The application maps them to existing public statuses, resolves quotations from the immutable sources and renders bounded Norwegian/English explanations. It does not accept provider-written explanations or quotations. Problems require an exact saved-draft phrase; support/contradiction/source-caveat findings require source references. Invalid or missing items remain unassessed without discarding valid siblings. Public result DTOs, human wording decisions and factual states are unchanged.

Consent previews now show only saved wording, linked evidence and known entry context for this extra call. Source/revision rechecks before/after, explicit chosen-recipient consent, the existing one-call/count-based output budget, no retries/default changes and read-only/page-session findings remain. The UI displays app-resolved literal excerpts with wrapping for long text. A valid excerpt establishes provenance, not entailment.

Four authorized calls reused independently frozen controls: both Gemini Flash-Lite 3.5 and Groq GPT-OSS 20B met eight synthetic expectations; on six real-document controls, Lite met six and Groq four. All 28 returned assessments had valid references and application-localized explanations. Groq still incorrectly supported two expansions. These are single samples, not repeatability evidence, a universal model ranking or a factual-verification guarantee. Human review and final-file gates remain separate.
