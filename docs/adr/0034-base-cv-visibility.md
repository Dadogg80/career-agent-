# ADR 0034: Source-bound base-CV visibility review

- Status: Accepted for this local-pilot slice
- Date: 2026-10-09
- Base: verified merged PR #30, main `9df2ae41fc61d7769346de3c5af4413665c54810`

## Context

A confirmed capability and its relevance to a criterion do not tell the candidate whether their selected CV presents it clearly. The saved methodology distinguishes actual experience, uncertain knowledge and visibility in a particular base CV. This review must not add another manual competency selection or require a separate private approval/call for each logical stage.

## Decision

Extend the existing approved `CV_TAILORING` request with a visibility array alongside wording proposals. Send the complete supported extracted base-CV text and the current full-profile match/evidence snapshot, under the existing recipient/model-bound approval. Ask for every criterion, including indexes beyond twelve; twelve limits wording changes, not reviewed criteria. Existing defensive bounds remain: 128 criteria, 500 source segments and 60,000 CV characters. Do not silently sample sources.

Return VISIBLE, WEAKLY_VISIBLE, NOT_VISIBLE, NEEDS_CLARIFICATION or UNASSESSED. These describe a provider judgment about presentation, not candidate facts, hiring chances or an ATS score. VISIBLE and WEAKLY_VISIBLE require literal quotes from exact base-CV segments. Established visibility/presentation gaps require owned confirmed claim IDs from that criterion's current assessment evidence. NOT_VISIBLE has no positive CV quotation; even a validated response cannot independently prove exhaustive absence.

If the match has not established relevant evidence, normalize provider visibility/gap assertions to NEEDS_CLARIFICATION with neutral localized wording. A CV credential alone cannot resolve an uncertain authorization. Invalid/missing visibility items become UNASSESSED per criterion, rather than fictional absence. Reject foreign claims, incorrect source locators and malformed references. A malformed visibility list does not discard otherwise valid text proposals. Continue accepting legacy proposal-only responses; new responses complete missing criterion rows as UNASSESSED. Existing client-only legacy results disclose the absence of a CV comparison.

Show a compact searchable, counted, scrollable criterion review with expandable original CV quotes, candidate contributions, context, actual provider/model and limitations. This review is read-only and shares the wording request; it changes neither knowledge status nor the match percentage. Existing text approval/edit/rejection remains separate. The whole result is bound to the selected CV text, current match and approval fingerprint; changed evidence/selections show historical guidance, not current recommendations.

## Consequences and limits

No extra automatic calls, model/default changes, migration, factual promotion, original-file mutation or automatic provider switch. Existing quota retention, CSRF, ownership and post-generation source/revision checks remain. Wording review is still page-session-only; no durable changeset or tailored file is claimed.

Literal citations prove provenance, not semantic completeness, equivalence, a real gap or qualification validity. A provider can miss a relevant section or misjudge its scope. Large outputs may leave criteria unassessed; do not claim all experience is discovered. Offline healthcare/sales/project tests exercise provenance and uncertainty guards; a synthetic live technology check is not a broad profession-quality benchmark. NOT_APPLICABLE and recruiter/hiring-manager perspectives remain later reviewed slices.
