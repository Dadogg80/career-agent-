# ADR 0039 — Durable owned CV wording sessions

Status: accepted incremental implementation, 2026-10-12.

## Decision

Extend the existing CV module after the owner's master-process/audit approval. Persist each new generated result as an immutable TailoringSnapshot with exact original text, confirmed evidence revisions, criterion quotations, language, actual provider/model and prompt version. Separate mutable wording decisions from this snapshot. V17 adds one owner-scoped table; no parallel knowledge store or new runtime service.

Expose latest-session GET and expected-revision PUT beneath the existing private job-tailoring route. All routes are explicitly authenticated; writes retain CSRF. Under the owner lock, verify job ownership, source existence/exact text, current automatic match identity/claims and the complete confirmed claim revision set. Missing/changed sources or evidence make historical sessions stale. Wrong revision rejects instead of overwriting. Generated sessions never overwrite earlier snapshots. Bound stored sessions to 30 per owner and check before provider work and during save.

Review decisions are PENDING/ACCEPTED/REJECTED wording, not ClaimStatus. User edits remove local approval; explicit draft save persists PENDING. Approval/rejection persists first, then changes the pending queue. Failed saves preserve the local editor and never claim success. Conflicts offer explicitly labelled reload/replacement of local drafts. Current copying requires current evidence and saved decisions. Reads/reviews make no AI requests; new generation retains the existing separately approved CV_TAILORING contract.

No source-document foreign key cascades private snapshots: deletion leaves historical text/evidence readable but prevents further current review. Disclose retained wording text in source deletion UI. Saved-job/account deletion cascades session removal. No private text or raw response is logged or committed.

## Limits and next steps

Persisting approved wording does not independently prove semantic entailment, confirm profile facts, create a file or establish CV_READY. Current source locators are existing literal passage indexes; stable semantic sections and explicit KEEP_UNCHANGED/strategy are next increments. Only the latest session is exposed; older-session selection/deletion remains future work. Reload cannot recover previously lost legacy browser-only proposals. Standard export and final actual-DOCX/PDF review remain separate until subsequent validated integration. Retain model-bound consent for new AI work; reading/reviewing stored output does not require retransmission or provider changes.
