# ADR 0035: Local handoff of approved CV wording

- Status: Accepted for the current text-proposal milestone
- Date: 2026-10-09
- Base: PR #32/main `e7f18bf36f02568d062b58bfeddbeb26df9dd911`

## Decision

After reviewing proposals, the candidate can preview/copy plain CV text incorporating only individually approved substitutions. Bind composition to the exact source snapshot used for the approved tailoring request. Locate literal numbered segments in source order; validate original text and unique substitution indexes, then preserve every other source character, including blank lines and repeated passages. Never concatenate extracted segments in a way that removes original separators.

Pending/rejected proposals retain original text. Editing an approved proposal returns it to pending through existing review behavior. Invalid substitutions cannot produce a handoff. Evidence, source, match, language/model-selection changes or unavailable required data disable current copying/approval; historical source/output remains readable.

Copy only on explicit user action through the browser clipboard API. No server write, AI request, file generation, external submission or profile-fact promotion occurs. If clipboard permission is unavailable/denied, retain a selectable read-only preview and explain manual copying. Copy feedback must correspond to the current composed text; private clipboard mutation state uses zero cache retention after unmount.

## Limits

This is plain-text editing assistance, not a persisted tailored CV version or application-ready package. Original PDF/DOCX formatting is not reconstructed. Text/review choices still last only for the page session; copying does not save a changeset or independently validate the semantics of user-written edits. Durable changesets, export/layout and package quality remain future deliveries.
