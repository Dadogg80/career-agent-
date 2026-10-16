# Journey quality review — 2026-10-13

Owner priority: improve input/analysis quality and usability before further final-file readiness work. Preserve existing functions and confirmation/source/consent distinctions. This is an implementation sequence, not a completed whole-journey audit.

## Confirmed code findings

- DOCX paragraphs end with one newline, but tailoring segmentation uses blank lines. This can merge profile paragraphs, skills cells and work contributions into mixed-section blocks. ADR 0044 corrects new extraction/explicit rereading; old snapshots remain unchanged.
- A 12-proposal ceiling applies in the prompt, parser, review controller and frontend proxy/validator. ADR 0044 increases the consistent ceiling to 40 while retaining one-call budgets and pending review for omitted proposals.
- Groq/Gemini source retrieval already requests contacts. Requirement extraction already prioritizes CONTACT/DEADLINE/LOCATION, supports exact-source quotations and multiple contacts, but caps all useful facts at ten. Investigate source retrieval truncation, that fact ceiling and UI grouping with synthetic multi-contact advertisements before changing contracts. Do not promise unpublished contact details.
- The CV input includes every confirmed matching claim, but section plans group whole experience sections. Independent per-entry/per-contribution review completeness remains unresolved; complete coverage declarations alone do not prove semantic analysis.

## Next deliveries and acceptance criteria

1. **CV structural coverage:** synthetic three-profile-paragraph/six-competency-group/multiple-role DOCX survives reading and reaches distinct source units; suggestions beyond twelve validate and remain reviewable; invalid output cannot imply complete section review. Explicit old-source recovery with no silent index/source changes.
2. **Advertisement/contact completeness:** follow source → extraction → persisted facts → UI; retain exact multiple contacts, names/titles/email/phone/deadline/application URL when published. Distinguish missing from unavailable source text. Evaluate fact limits and truncation with FINN, NAV and pasted/source-neutral fixtures.
3. **Match repeatability review:** compare frozen advertisement and full confirmed revision sets across evaluations. Identify source/criterion changes separately from model judgments. Stable saved results reopen without AI; no fabricated stability or automatic promotion of prior judgments. Model comparison needs independent expected criteria, not appearance alone.
4. **Joined UX/design audit:** inventory documents/profile/competencies/history/jobs/matching/tailoring/CV-library and every dialog/model picker; use existing typography, spacing, icons, buttons and status components. Check keyboard/mobile, loading/error/stale/empty states, clear next action and source visibility. Report per-screen findings and resolve in coherent slices, rather than claiming all components are redesigned.
5. **Independent actual-file review:** semantic, structural and visual DOCX/PDF review and explicit readiness. Standard layout remains separate from supported original-template fidelity.

## Validation boundaries

Use synthetic fixtures and focused regression checks; full required CI remains. No owner documents in Git or live provider calls by default. Contact/matching/design audit and independent final-file review are pending beyond the structural correction.

## Individual reasoning checkpoint

ADR 0045 adds per-source-unit reasons within the existing call, with exact memberships and explicit incomplete recovery. Employment introductions and contributions now have individual declarations; grouping into canonical career entries and independent semantic evaluation remain separate work. Contact/source completeness and frozen-input match repeatability are next.

## Logical CV source-unit checkpoint — 2026-10-14

ADR 0046 adds exact application-owned UTF-16 unit ranges for new tailoring, preserving all non-whitespace source content and existing legacy indexes. Identity/headings/recognized entry headers remain protected; stored invalid metadata blocks review and assembly. The same ranges identify AI passages, individual plans, source/context display and accepted substitutions. PDF paragraph-gap preservation keeps wrapped lines together on new extraction/explicit rereading only. This is bounded structural recovery, not canonical career association, exhaustive recall or template reconstruction.

Focused backend source/range/protection/persistence/legacy checks, production builds and four browser cases passed; full Foundation CI remains the publication gate. A private local reread probe increased blank-line blocks from 17 to 49, retained three intact profile paragraphs, six competency groups and ten entry-scoped employment bullets, and preserved every non-whitespace character in its original order; the earlier observed concatenated date marker was absent. No private source text, originals or probe output enter Git. That single-file observation does not establish general extraction quality. Next: required CI and owner review, then a controlled low-call frozen-input Gemini/Groq comparison and project-recall validation. Independent actual-file semantic/structural/visual review remains pending; do not merge automatically.

## Joined match-to-wording checkpoint — 2026-10-16

Three held-out fictional occupational cases now join live matching to initial CV wording through actual services with controlled repositories/identity. Both selected OpenAI models met 12/12 independently selected match expectations on the baseline; fresh post-correction wording retained protected skills headings and all 33 declared passage assessments per model. Full confirmed evidence is preserved. This is a small source-scope control, not actual sign-in/import/export, native layout reconstruction or repeated semantic stability.

Two narrowly demonstrated source defects are corrected for new runs: keep distinct quotation pairs for one matching claim, and recognize/protect the common Bokmål `Ferdigheter` heading. Historical sources/ranges/reviews are unchanged. Separate assistant review of the wording found preserved course/supervision/planned-work scope in these samples, with remaining model disagreement about the unspecified extent of relevant practice under a qualification alternative. Prior match judgments remain interpretations, not factual proof. Broader recall, repeated useful reasons, multi-source employment/project scope and independent actual-file review remain pending.
