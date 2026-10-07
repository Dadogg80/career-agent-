# ADR-0007: Groq-backed advertisement extraction before private profile storage

Status: Accepted for the local pilot under delegated implementation authority.

## Context

The user supplied Groq access and wants a usable frontend quickly. The merged foundation has no identity or private-data persistence. Current open choices about authentication, retention, and CV layout do not block a public-advertisement experiment.

## Decision

Implement a bounded pasted-text extraction flow using Groq behind `AiModel`. Initially use `openai/gpt-oss-20b`, which was present in the authenticated model listing. Do not introduce a paid fallback or account upgrade.

Return structured labels, required/preferred/unclear categories, and verbatim quotations. Validate shape, limits, and quotation presence server-side. Treat the source as untrusted data. No candidate claims or match score are generated.

Keep the local-only backend and same-origin frontend proxy. Limit input, output, concurrency, and attempts per process. Do not persist advertisement or result data in this slice. Auth and persistence remain required before private profiles or external users.

## Alternatives

Implementing profile/auth/database first remains the next private-data foundation, but delays useful AI feedback. Local inference would require further hardware/model evaluation; the supplied Groq access can be tested now.

## Consequences

The development order changes only for this coherent experimental slice. It is not completion of US-04/US-05 or the full MVP. A source quotation validates provenance, not label entailment or classification accuracy; user review and further evaluation are required. Per-process limits are not persistent budget guarantees.
