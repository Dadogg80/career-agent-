# Local pilot delivery and later work

The earlier identity/profile/import proposal is implemented. The tested `feat/competency-workspace` delivery now includes public entry, dedicated local sign-in, owned reviewed competencies and typed career history, PDF/DOCX/UTF-8 TXT/Markdown evidence, opt-in single/combined AI summaries, saved advertisements, approved matching, standard CV export and manual application tracking. See [ROADMAP.md](../ROADMAP.md) and the actual verification in [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md).

## Pilot handoff

The owner explicitly authorized pushing this tested delivery and merging it to main on 2026-10-08. Follow [TESTING_PILOT.md](TESTING_PILOT.md) for the complete local flow and [RUNNING.md](RUNNING.md) for startup. GitHub publishing, merge, local synchronization and restarts are distinct actions. No paid service or account upgrade is authorized.

## Subsequent coherent increments

1. Validate actual pilot documents and strengthen Norwegian/English source selection, context proof and recovery. The current slice adds read-only local document checks and source-selected AI proposals; see ADR 0023 and DEVELOPMENT_LOG.md.
2. Add source-backed CV wording and application drafts, with visible before/after and explicit factual review. This is separate from the existing approved standard-template export and remains pending.
3. Add interview preparation using the exact approved/recorded CV and application materials, with no invented examples. This remains pending.
4. Add market discovery/scheduling only after checking source-access/reuse terms, freshness, deduplication and budget. Controlled browser preparation, academy/analytics and external hosting remain later milestones.

Kafka, Temporal, pgvector and Redis are deferred until a concrete workload justifies them. Local integration tests require Docker; private workflows require the documented PostgreSQL/OIDC setup. Production identity, backups, deletion/export policy and external-provider privacy controls remain open before an external pilot.
