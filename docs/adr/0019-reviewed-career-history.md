# ADR 0019: Reviewed typed career history before CV export

Status: Accepted, local pilot.

## Context

Competency statements explain individual contributions but cannot accurately represent full employment, project and education timelines. Export must distinguish formal title, actual delivery role, employer and client, and must not infer dates or auto-confirm imported experience.

## Decision

Add a small owner-scoped typed career-entry model with explicit month values, unknown dates, source notes, revisions and separate review. Manual creation is UNVERIFIED and content editing invalidates confirmation. Reuse PostgreSQL/JDBC, existing identity/CSRF and shadcn/TanStack workflows; no AI call, broker or new ORM is required.

## Consequences

The first CV template can later select immutable confirmed entry snapshots alongside confirmed competency statements. A complete relational employment/client/project graph remains deferred. The owner-approved standard export template and original-document retention remain required; this ADR does not claim export is available.
