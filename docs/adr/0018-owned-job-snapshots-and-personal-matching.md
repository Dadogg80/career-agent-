# ADR 0018: Owned job snapshots and approved evidence-based matching

Status: Accepted for the local pilot, 2026-10-07. The owner authorized progressing through saved jobs, personal matching, controlled CV export and application tracking without pushing yet. Explicit answers authorize relevant CONFIRMED statements plus ad text for matching after preview and per-run approval.

## Decision

Keep received ad text/structured analysis as immutable owner-scoped snapshots in PostgreSQL, reusing identical content and retaining changed source/analysis as separate versions. Save/reopen without AI. Use the existing verified OIDC/CSRF, TanStack and shadcn boundaries; no new dependencies, infrastructure or events. V6 establishes saved jobs, V7 stores the latest matching snapshot.

Use one private approved model call per matching attempt, selected confirmed IDs/revisions resolved server-side, bounded preview, literal evidence attribution and unknown/partial/direct classifications. Unsupported evidence cannot become a strong match. Undocumented evidence is unknown, never a confirmed gap. Store input claim snapshots and check them transactionally after model work; expose stale assessments when knowledge changes. Keep all public advertisement endpoints/diagnostics separate from candidate data.

## Consequences

Quotes prove membership rather than semantic entailment; the user reviews model judgments. Collection limits and sampled advertisement coverage are explicit. Historical snapshots can retain a claim's earlier text even after its source claim is deleted; disclose removal paths. A saved source label is received/client-provided metadata, not independent source authenticity. Broader normalized job identity, production provider terms, external deletion/retention and discovery deduplication remain later work. A local pilot does not justify Kafka, Temporal or vector retrieval yet.
