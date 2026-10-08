# ADR 0028 — Source coverage checks and bounded document follow-up

Status: accepted under the owner's resumed document-quality instruction, implemented on `feat/document-coverage-audit` from verified main `520bbe70869cc176f41585f457fd3a03cc911a34`.

## Problem

Processing every source character does not establish that extraction captured important responsibility, education, history or interest evidence. Existing named-list recovery also missed colon-only headings, dash-separated rows and single-token technology items.

## Decision

Inventory literal relevant source passages locally and compare them with validated competency/profile/history quotation links. Named lists require every literal label to be represented, rather than counting a single extracted technology as complete coverage. Repeated wording across employers requires associated context evidence; another document's quotation cannot cover the current source unless explicitly linked. Preserve offsets, approved source selection and original evidence. The inventory is bounded to 2,000 passages per run; a limit is visible.

New runs can opt into `coverageReview` under the existing explicit recipient/model approval. The UI enables it by default and discloses at most four additional AI calls. At the end of the primary pass, schedule at most two follow-up passages per document and four across the run, prioritizing history and education, followed by responsibilities and interests. No automatic repair loop is introduced. Technology list gaps use local recovery, not more calls. Follow-up uses the same approved source/model plan, normal source validation, ownership, pacing, budgets and quota handling. Legacy runs default to no extra calls. Each next request still performs at most one model call. Before a planned follow-up, check whether an earlier result already represents that passage; if so, persist a skipped step without another model call or budget charge.

Store coverage and follow-up state in the existing owned JSONB run. Additional batches count as processing steps, but their source character count is zero so the original coverage is never counted twice. Persist findings through the same transactional profile-population and review-preservation path. No new table, dependency or background scheduler is required.

## User experience

Show a compact content-check panel: source passages represented in results and passages that may need review. Show literal missing excerpts in a bounded keyboard-scrollable reader with document/type attribution. Differentiate primary reading, targeted follow-up and profile synthesis in animated status. Reopening a completed or paused run retains the coverage. Switching providers/models retains progress and requires the existing explicit renewed approval.

## Limits

The inventory uses conservative lexical/heading signals, not a semantic completeness score. A cited passage does not prove every fact in it was extracted correctly. Unrecognized wording, complex dates and implicit experience may remain unflagged; counts must not be presented as verified knowledge or hiring scores. Follow-up can still omit facts and hit project-level quotas. Full alias/conflict reconciliation, normalized knowledge relationships, semantic benchmarking and automatic presentation refresh after every edit remain future work. No private originals/manifests or extracted text enter Git.
