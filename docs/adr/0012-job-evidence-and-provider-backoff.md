# ADR 0012: resilient job evidence and provider backoff

Status: Accepted — 2026-10-07

## Problem

A legitimate browser tool excerpt can wrap the FINN title/site suffix onto two lines. Markdown emphasis can also make a model quotation differ from the input even though its words are unchanged. Rejecting the entire analysis for one unsupported fact loses independently valid requirements. Free provider token limits are shared across browser search, structured analysis and external use of the same organization/model.

## Decision

Keep exact canonical URL checks, browser.open evidence, tool arguments, payload bounds and rejection of generated final answers. Handle the observed wrapped title suffix and remove paired Markdown bold emphasis from the browser source before analysis. Quote comparisons normalize Unicode canonical forms and whitespace, never changed words, case or punctuation.

Reject malformed structures, invalid kinds and bounds violations. Omit well-shaped suggestions whose quotes cannot be found, count omissions and disclose partial results. If no supported suggestions remain after omissions, reject the result instead of presenting an empty successful assessment. Quote membership proves provenance, not that a paraphrase/category is semantically correct. Candidate truth/confirmation states are unaffected.

Map provider json_validate_failed to AI_INVALID_RESULT and list allowed fact kinds explicitly in the prompt. There is no automatic schema repair/retry. Log sanitized codes/counts only, never provider payloads, exception messages, documents or secrets.

Propagate bounded numeric Retry-After hints through backend/BFF to a frontend countdown. A process-local cooldown is shared by both Groq adapters; a known cooldown rejects early without another provider call. Default to 60 seconds when the provider supplies no usable hint, cap at 300. This does not forecast token use or coordinate multiple deployed replicas/accounts; no distributed limiter or paid plan is introduced.

Retain the retrieved advertisement only in the current React session. A manual retry for the same canonical URL reuses the current text and makes only the analysis call. New URLs retrieve afresh. Show this behavior explicitly; no automatic retries or source persistence are introduced. Refresh loses the in-memory source/cooldown UI; server cooldown remains until elapsed/restart. Existing call caps remain unchanged.

## Consequences

One fresh FINN analysis still makes two application-level Groq calls; browser search may perform internal tool work and consume additional input tokens. Playground/Codex use shares the provider quota. Per-item omissions are visible, not silently promoted to evidence. Partial/stale browser provenance remains visible. Future saved-job snapshots/versioning must preserve analyzed source/retrieval provenance and ownership independently of this transient reuse.
