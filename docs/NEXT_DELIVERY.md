# Local pilot delivery and later work

The earlier identity/profile/import proposal is implemented. The unpublished `feat/competency-workspace` branch now includes public entry, dedicated local sign-in, owned reviewed competencies and typed career history, PDF/DOCX/UTF-8 TXT/Markdown evidence, opt-in single/combined AI summaries, saved advertisements, approved matching, standard CV export and manual application tracking. See [ROADMAP.md](../ROADMAP.md) and the actual verification in [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md).

## Pilot handoff

Keep this work local and unpublished until the owner requests a push. Follow [TESTING_PILOT.md](TESTING_PILOT.md) for the complete local flow and [RUNNING.md](RUNNING.md) for startup. GitHub publishing, merge, local synchronization and restarts are distinct actions. No paid service or account upgrade is authorized.

## Subsequent coherent increments

1. Use pilot feedback to improve source completeness, document coverage, CV selection and recovery. Add broader Norwegian/English AI quality evaluation before treating suggestions as consistently comprehensive.
2. Add market discovery/scheduling only after checking source-access and reuse terms, freshness, deduplication and the pilot budget. Introduce events only where these workloads need decoupling.
3. Extend interview/follow-up assistance and controlled browser preparation, with explicit approval for consequential actions. Academy/analytics and external multi-user hosting remain later milestones.

Kafka, Temporal, pgvector and Redis are deferred until a concrete workload justifies them. Local integration tests require Docker; private workflows require the documented PostgreSQL/OIDC setup. Production identity, backups, deletion/export policy and external-provider privacy controls remain open before an external pilot.
