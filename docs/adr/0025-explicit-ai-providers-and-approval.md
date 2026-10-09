# ADR 0025: Explicit AI providers and recipient-bound approvals

Status: Accepted for the local pilot, 2026-10-08. Initial implementation merged in PR #16 on 2026-10-08. Explicit in-app provider recovery is added separately in ADR 0026.

## Context

Groq quotas block document/matching progress. The owner authorized Gemini integration and then prioritizing related whole-document, competency, profile and career-history improvements. Replacing the HTTP endpoint alone would mislabel output, reuse Groq consent for Google and lose the recipient of resumable work.

## Decision

Keep the modular monolith and `AiModel` port. A primary routing facade delegates to Groq/Gemini adapters according to explicit task configuration. Gemini uses stateless REST `generateContent` with a backend-only header key, JSON Schema and low thinking; no new SDK or agent framework. Gemini-specific default is verified 3.5 Flash; unset provider keeps existing Groq behavior.

Publish non-secret task/recipient/model previews. Bind explicit private-data consent to a configuration fingerprint; store it with owned workflow state and verify before continuation. Preserve backward compatibility only for old Groq-approved requests. Never move a run to another recipient without new approval. Model changes also invalidate the new fingerprint. Ownership, CSRF, source validation and explicit factual confirmation remain independent.

Keep source retrieval separate from analysis. The initial FINN route uses Groq/Exa and retains partial-excerpt labeling. ADR 0037 later adds a separately selected Gemini 3.8 URL Context route for public FINN links; a Gemini analysis approval does not authorize retrieval, and a retrieval selection does not authorize analysis. No automatic quota/provider/model rotation or billing activation. Gemini and Groq have independent process-local cooldowns; errors preserve prior artifacts and manual continuation. Native Gemini PDF or private-document URL retrieval remains outside this decision.

## Consequences

The UI and stored analyses identify their actual recipients, including mixed extraction/summary providers. Configuration reload can require a new approved run while retaining existing drafts. JSON support and model listing do not establish truth or generation capacity. Synthetic verification is a release prerequisite; live private-document quality and production processing terms remain separate.

See [Gemini setup](../GEMINI_SETUP.md), [whole-document review](../FULL_DOCUMENT_REVIEW.md) and ADR 0024.
