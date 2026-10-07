# Åpne spørsmål

| ID | Spørsmål | Hva påvirkes? | Status |
| --- | --- | --- | --- |
| Q-001 | Hvilket operativsystem, RAM og eventuelt skjermkort har pilotmaskinen? | Lokal drift, Docker og mulighet for lokal AI. | Avklart: Apple M1, 16 GB, macOS; se LOCAL_DEVELOPMENT.md |
| Q-002 | Which AI provider can the pilot use? | Groq access and fictional Norwegian/English extraction have been verified. `openai/gpt-oss-20b` is the initial configurable model. No plan upgrade or paid fallback. | Resolved for this pilot slice; broader quality evaluation remains |
| Q-003 | Skal anbefalt MVP og leveranserekkefølge vedtas som arbeidsplan? | Omfang før implementasjonsstart. | Forslag dokumentert |
| Q-004 | Hvilken CV-mal og hvilke layoutkrav er nødvendige for piloten? | Eksport og eventuell manuell mellomløsning. | Uavklart |
| Q-005 | Hvilken annonsekilde integreres først, og er tilgangen tillatt? | URL-import; tekstimport kan utvikles uavhengig. | Uavklart |
| Q-006 | Hvilken lokal tilgangsmodell og senere OIDC-provider skal brukes? | Innlogging, sesjoner og flerbrukerisolasjon. | Uavklart |
| Q-007 | Hvordan skal backup, sletting og retensjon fungere i lokal pilot? | Bevaring av arbeid og personvern. | Uavklart |

Ikke gjenta tidligere besvarte spørsmål om målgruppe, standardspråk, gratis pilot eller ønsket fremtidig kundetype. Oppdater denne filen når et spørsmål avklares og lenk til beslutningen.

## Current blockers and defaults

No product decision blocks the local public-advertisement extraction experiment. The delegated defaults are pasted text, Groq, Norwegian-first UI, source quotations, bounded calls, and no persistence. See [ADR-0007](adr/0007-groq-advertisement-pilot.md).

Q-003 concerns the full MVP and does not block small agreed steps. Q-004 matters before document export; Q-005 before URL import; Q-006 and Q-007 must be resolved before private-data persistence or an external pilot. They are not reasons to stop the current public-text test.

Docker recommendation: native frontend/backend, PostgreSQL in Compose when introduced. See [DOCKER_STRATEGY.md](DOCKER_STRATEGY.md). No paid services are assumed.

## URL access and richer analysis

- Groq Browser Search: which API model/tool corresponds to the user’s Playground configuration? Are calls available within the free plan, what are tool quotas, and can we retrieve exact source text/evidence? Do not activate paid tooling or silently treat search summaries as original advertisements.
- NAV: registered consumer access is needed beyond experimentation. API ads exclude FINN; persistent discovery must handle source updates/removals before republishing stored listings.
