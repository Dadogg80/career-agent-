# Åpne spørsmål

| ID | Spørsmål | Hva påvirkes? | Status |
| --- | --- | --- | --- |
| Q-001 | Hvilket operativsystem, RAM og eventuelt skjermkort har pilotmaskinen? | Lokal drift, Docker og mulighet for lokal AI. | Avklart: Apple M1, 16 GB, macOS; se LOCAL_DEVELOPMENT.md |
| Q-002 | Which AI provider can the pilot use? | Groq access and fictional Norwegian/English extraction have been verified. `openai/gpt-oss-20b` is the initial configurable model. No plan upgrade or paid fallback. | Resolved for this pilot slice; broader quality evaluation remains |
| Q-003 | Skal anbefalt MVP og leveranserekkefølge vedtas som arbeidsplan? | Omfang før implementasjonsstart. | Forslag dokumentert |
| Q-004 | Hvilken CV-mal og hvilke layoutkrav er nødvendige for piloten? | Eksport og eventuell manuell mellomløsning. | Uavklart |
| Q-005 | Hvilken annonsekilde integreres først, og er tilgangen tillatt? | URL-import; tekstimport kan utvikles uavhengig. | Uavklart |
| Q-006 | Which local access model and later OIDC provider? | Sign-in, sessions and user isolation. | Resolved for local pilot: optional Keycloak + Spring OIDC/PKCE (ADR 0013); production provider still open |
| Q-007 | Hvordan skal backup, sletting og retensjon fungere i lokal pilot? | Bevaring av arbeid og personvern. | Uavklart |

Ikke gjenta tidligere besvarte spørsmål om målgruppe, standardspråk, gratis pilot eller ønsket fremtidig kundetype. Oppdater denne filen når et spørsmål avklares og lenk til beslutningen.

## Current blockers and defaults

No product decision blocks the local public-advertisement extraction experiment. The delegated defaults are pasted text, Groq, Norwegian-first UI, source quotations, bounded calls, and no persistence. See [ADR-0007](adr/0007-groq-advertisement-pilot.md).

Q-003 concerns the full MVP and does not block small agreed steps. Q-004 matters before document export. Q-005 is resolved for bounded NAV/FINN pilot adapters; source reuse/discovery terms remain open. Q-006 is resolved for local basic-profile sign-in (ADR 0013). Q-007 remains open before broader private-document use or an external pilot; current profile scope is name/language only. These questions do not block public-text analysis.

Docker recommendation: native frontend/backend, PostgreSQL in Compose when introduced. See [DOCKER_STRATEGY.md](DOCKER_STRATEGY.md). No paid services are assumed.

## URL access and richer analysis

- Resolved for the local FINN pilot: GPT-OSS 20B supports browser_search and returns exact-page browser.open source text. Structured outputs require a separate call. Remaining for production: source/provider reuse terms, freshness/completeness assessment, sustained quotas and account billing controls. Do not treat provider excerpts or search summaries as verified complete originals.
- NAV: registered consumer access is needed beyond experimentation. API ads exclude FINN; persistent discovery must handle source updates/removals before republishing stored listings.
