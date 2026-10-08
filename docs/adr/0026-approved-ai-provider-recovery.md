# ADR 0026: Approved AI provider recovery and actual model attribution

Status: Accepted for the local pilot, 2026-10-08. Implemented on `feat/document-evidence-quality`; publication is recorded separately in the development log.

## Context

The owner requested an in-app Gemini retry when Groq capacity is exhausted and consistent, compact provider/model identification. Changing a process-wide default would affect other users, mislabel old results and lose ownership or private recipient consent. Repeating an entire document run would spend tokens on already processed sources.

## Decision

Expose backend-configured task plans and alternatives through the non-secret AI configuration endpoint. Availability means a key binding exists; it does not certify account capacity or generation readiness. The browser selects an opaque task/provider/model fingerprint, never a key, model URL or arbitrary model. Validate that fingerprint on the backend. Default routing remains unchanged.

Use request-local `ApprovedAiModel` delegation. No shared mutable routing, automatic failure retries, provider/model rotation, paid upgrade or credential changes. Each adapter retains its own provider cooldown. The overall pilot process budget remains independent of provider and is not bypassed by switching.

Offer **Try with Gemini/Groq** after recoverable provider failures and a compact **Change** control before analysis. A private provider/model change clears consent and requires approval of the visible source preview for the newly selected recipient. Public advertisements can be retried explicitly against the selected plan; FINN source retrieval still uses Groq/Exa and cannot be recovered through Gemini in this increment.

A document run can change its future plan using an owned, CSRF-protected, revision-checked endpoint. Take the existing processing lease, preserve sources, approved text, completed portions, draft indices and evidence, and clear only the previous plan's scheduled wait when the plan actually changes. The same plan, including legacy Groq approval, cannot clear its wait. The new adapter still enforces its own cooldown. A provider switch performs no model call; the next explicitly continued portion does.

Expose the stored approved text selection privately so continuation cannot send an older, unredacted selection after the visible preview is edited. The UI either restores that exact selection and clears consent or starts a new run.

Save actual successful provider/model pairs with document results and the actual selection with public extraction and personal matching results. FINN imports record their browser model independently from analysis; NAV is not labeled as an AI call. Mixed document results show both contributors; selecting Gemini never relabels old Groq output. Older model metadata is honestly shown as not recorded rather than inferred from today's configuration.

## Consequences

Prior work remains usable during quota waits. The owner can recover with another configured provider without editing `.env` or restarting the backend. Both providers need their respective backend-only keys. If both are unavailable, prior information remains visible; no quota availability is promised. Real-document AI quality, automatic profile confirmation, explainable matching scores and inline clarification remain separate work.

Related: [ADR 0025](0025-explicit-ai-providers-and-approval.md), [Gemini setup](../GEMINI_SETUP.md), [whole-document review](../FULL_DOCUMENT_REVIEW.md).
