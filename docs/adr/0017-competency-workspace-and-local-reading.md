# ADR 0017: Competency workspace and recoverable local document reading

Status: Accepted for the local pilot, 2026-10-07. Implements the owner's requested UX/UI rethink and improved document competency extraction. Extends ADR 0015/0016; no external rollout or paid infrastructure is authorized.

## Problem

A narrow stacked profile/document/claim page hides review work. Main-body-only DOCX extraction omits header/footer skills. PDF drawing order can scramble text; scanned documents have no text. Splitting 12,000 characters equally wastes capacity on short files and only reads the beginning of long ones. Ten-proposal limits suppress explicit skills; exact raw whitespace can incorrectly discard supported quotes.

## Decision

Use TanStack Query and existing shadcn Cards/Sheet/Dialog, with competency search/status metrics and document readability. Separate approved source inputs from results, keep original/evidence controls and explicit individual review. Counts are recorded data, not proficiency/confidence. Spread long excerpts across beginning/middle/end, redistribute unused short-document shares and allow focusing a document. Keep 12,000 characters, one model call per attempt, manual retry, provider cooldown and unchanged per-process budget. Prompt for up to twenty concise explicit proposals, including listed skills/courses with truthful context. Retain individually valid items if another item is malformed or the model exceeds the presentation cap; report omissions and label empty context unknown, without accepting unsupported statements. Invalid root JSON/schema and wholly unsupported items still fail. Whitespace-only quote matching returns the actual owned source substring; never tolerate changed words or cross-document attribution.

Improve DOCX text extraction for headers/footers and PDF visual-position sorting. Add an owned CSRF-protected reread command reading the retained original. Optional explicit local Tesseract OCR processes only pages without text; it does not browse or call an external provider. Bound PDF pages/raster dimensions/DPI, subprocess runtime and resulting text. Use private temporary files, no shell, discarded subprocess logs and a reduced environment. No additional JVM/npm dependency. Default English language data is sufficient to enable the optional helper; configure nor+eng when installed.

Record TEXT/OCR method in V5 and derive readable character count from owned stored text. Original bytes remain immutable. Changed text invalidates single/combined summaries; AI saves recheck their original source snapshots. Existing user-created claims/history remain unchanged and retain earlier source quotations.

## Consequences

The local helper must be installed on the backend PATH for scans. OCR is fallible and does not cover missing image text inside an otherwise readable page. Unsupported layouts, encrypted/large files and long collections still have honest limitations. Excerpt sampling and twenty suggestions are not exhaustive extraction; reanalysis replaces the latest snapshot rather than accumulating every discovery. Separate approval and private provider terms remain required. Native decoding/OCR is bounded, not production sandboxed processing; temporary-file crash reconciliation, malware scanning, backups and retention remain future work.
