# Reviewed career history

Status: implemented on the unpublished local pilot branch; a prerequisite for truthful standard CV export.

## Model and review

The local profile can own up to fifty typed entries: EMPLOYMENT, PROJECT, EDUCATION and CERTIFICATION. Each stores a title, organization, optional client and actual delivery role, optional start/end month, ongoing flag, description and required source note. This subset preserves important role distinctions without claiming a complete normalized employment/client/project taxonomy.

Periods accept actual year/month values from 1900 through 2200, reject reversed ranges and incompatible ongoing/end states, and keep absent months unknown. A manual entry starts UNVERIFIED. Explicit CONFIRM or REJECT decisions target the current revision. Editing confirmed content creates a new UNVERIFIED revision; it cannot silently preserve an old approval.

PostgreSQL migration V8 stores owner-scoped entries and immutable revision records. All writes serialize on the owning app user and check the expected entry revision. Frontend-supplied owner/status fields are rejected. Entry endpoints require the existing authenticated issuer/subject, saved profile and write CSRF. Deletion removes the entry and its revision history; future approved output snapshots have separate retention, as their UI must explain when introduced.

## UI

The profile includes a collapsible career-history section with compact grouped cards, chronological display, clear unknown dates and visible status. The create/edit/review/history/delete flows use shadcn dialogs and TanStack mutations. Reads are lazy until the history section is opened, reducing unnecessary work during competency/document review. Review remains distinct from form save and no AI call is made.

## Verification

Real PostgreSQL integration checks cover ownership by issuer/subject, authentication and CSRF, spoofed status, date validation, explicit review, edit reset, concurrent revisions, history and deletion. Browser checks cover actual role/client display, unknown periods, separate confirmation, editing/history, mobile/English deletion and private-proxy validation. See the development log for current suite counts. CV export is not implemented merely by recording these entries.

## Document-prepared history

The current branch adds editable AI-prepared history drafts from approved documents. Users review prefilled employer, client, role, contribution and period fields, then save unverified or explicitly confirm. Each import retains owned source quotations tied to entry revisions; document deletion detaches references but retains disclosed quotes. A Document sources dialog exposes them. Unknown month precision is preserved. The full normalized employment/project graph remains pending.
