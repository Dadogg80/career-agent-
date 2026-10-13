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
