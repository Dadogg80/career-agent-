# ADR 0047: Optional saved-wording source review

Status: Accepted incremental continuation, 2026-10-14.

## Context

The current numerical guard and exact source/ID checks establish limited lexical/provenance constraints, not semantic truth. The controlled comparison showed unsupported specialist wording could pass those checks. A generation reason or optimistic match must not become proof of the generated statement. The approved master specification requires evidence review and visible uncertainty where verification is unreliable.

## Decision

Keep generation unchanged and add a separate optional source-opinion action on the latest owned durable wording session. One explicit action reviews all active, non-rejected proposals, up to the existing 40-proposal bound. It reads the current saved draft (including saved user edits), original passage, known immutable entry context, only the proposal's referenced confirmed claims and its associated criterion quotations. Match classifications and generation reasons are excluded. Reviewing this bounded evidence does not subset the full-profile matching input. Original CV text and job criteria are not additional factual confirmation.

Reuse the existing CV_TAILORING routing capability/model catalog without changing defaults. Give this review its own preview and recipient/model-bound per-run approval; old generation consent never starts it. The action makes at most one call, without automatic retries/fallbacks, and uses a separate process-local WORDING_REVIEW_AI_MAX_REQUESTS budget, default 5. It shares the selected provider/model's existing cooldown and output limits. No live availability/quality guarantee follows from an available choice.

The owned authenticated/CSRF-protected endpoint accepts session ID, revision and unique proposal indexes, never replacement client text/evidence. Recheck ownership, current sources and exact saved revision before and after the call. A concurrent edit or changed source rejects the response. A model-change approval mismatch rejects before sending data.

Validate the response schema, indexes, distinct item identity, statuses, reason bounds, referenced claim IDs and literal statement/context quotations. A SUPPORTED opinion requires valid evidence; missing, duplicated or invalid per-item support is UNASSESSED. Valid other items remain readable. These checks cannot prove entailment. The UI says AI found support, scope needs review, potentially unsupported claim or unassessed; it never labels these as verified facts. The prompt checks every factual assertion and its qualifiers across professions without rewriting the text.

Findings are read-only and page-session-only, bound to the exact saved revision/text. Retain them after failures and display the original reviewed wording with an earlier-result warning after changes. Save edits before another review. No profile/snapshot/wording/approval/score/file is written by this action; existing human wording decisions and numerical/protected-field rules remain unchanged. This is an additional drafting opinion, not AI-13 final-file review or CV_READY.

## Consequences and limits

No schema migration or new dependency. The user can explicitly choose the same or a different supported model for a second opinion. The additional quota use is visible and optional. Source-bound AI opinions can still be wrong and require independent benchmark/human assessment; no detection accuracy is claimed from mocked tests. Persisted findings, resolved-finding gates, capacity optimization and independent semantic/structural/visual inspection of actual DOCX/PDF are later work. Generation retains the single-call invariant from ADR 0046; this explicit separate action does not silently extend it.
