# Åpne spørsmål

| ID | Spørsmål | Hva påvirkes? | Status |
| --- | --- | --- | --- |
| Q-001 | Hvilket operativsystem, RAM og eventuelt skjermkort har pilotmaskinen? | Lokal drift, Docker og mulighet for lokal AI. | Avklart: Apple M1, 16 GB, macOS; se LOCAL_DEVELOPMENT.md |
| Q-002 | Which AI provider can the pilot use? | Groq access and fictional Norwegian/English extraction have been verified. `openai/gpt-oss-20b` is the initial configurable model. No plan upgrade or paid fallback. | Resolved for this pilot slice; broader quality evaluation remains |
| Q-003 | Skal anbefalt MVP og leveranserekkefølge vedtas som arbeidsplan? | Omfang før implementasjonsstart. | Forslag dokumentert |
| Q-004 | First-export layout priority? | Owner selected a controlled standard template; preserve the original, arbitrary DOCX layout later. | Resolved 2026-10-07 |
| Q-005 | Initial advertisement sources and permitted access? | Bounded local NAV/FINN adapters are implemented; reuse/discovery terms remain separate. | Resolved for pilot; production terms open |
| Q-006 | Which local access model and later OIDC provider? | Sign-in, sessions and user isolation. | Resolved for local pilot: optional Keycloak + Spring OIDC/PKCE (ADR 0013); production provider still open |
| Q-007 | Hvordan skal backup, sletting og retensjon fungere i lokal pilot? | Bevaring av arbeid og personvern. | Uavklart |
| Q-008 | May personal matching send profile evidence to Groq? | Relevant CONFIRMED statements and advertisement text, with preview and approval per analysis. | Resolved 2026-10-07; approved matching implemented locally |
| Q-009 | First-pilot hosting? | Local Mac first; online hosting later, no paid services or deployment authorized. | Resolved 2026-10-07 |

Ikke gjenta tidligere besvarte spørsmål om målgruppe, standardspråk, gratis pilot eller ønsket fremtidig kundetype. Oppdater denne filen når et spørsmål avklares og lenk til beslutningen.

## Current blockers and defaults

No unresolved product decision blocks the authorized local pilot. Broader SaaS rollout remains subject to the outstanding privacy, backup and identity decisions. The public-advertisement defaults remain Groq, Norwegian-first UI, source quotations and bounded calls. Authenticated local persistence is opt-in for profile/documents/saved jobs/CVs/applications. See [ADR-0007](adr/0007-groq-advertisement-pilot.md).

Q-003 concerns the full MVP and does not block small agreed steps. Q-004 is resolved: a standard template precedes arbitrary imported-layout adaptation; reviewed standard export is implemented locally. Q-005 is resolved for bounded NAV/FINN pilot adapters; source reuse/discovery terms remain open. Q-006 is resolved for local basic-profile sign-in (ADR 0013). Q-007 remains open before broader private-document use or an external pilot; the current branch adds local CV processing/source selection with optional private analysis only after reviewed-preview approval. These questions do not block public-text analysis.

Docker recommendation: native frontend/backend, PostgreSQL in Compose when introduced. See [DOCKER_STRATEGY.md](DOCKER_STRATEGY.md). No paid services are assumed.

## URL access and richer analysis

- Resolved for the local FINN pilot: GPT-OSS 20B supports browser_search and returns exact-page browser.open source text. Structured outputs require a separate call. Remaining for production: source/provider reuse terms, freshness/completeness assessment, sustained quotas and account billing controls. Do not treat provider excerpts or search summaries as verified complete originals.
- NAV: registered consumer access is needed beyond experimentation. API ads exclude FINN; persistent discovery must handle source updates/removals before republishing stored listings.


## Source-import default (ADR 0015)

The initial local import processes DOCX/PDF without external AI and uses user-selected excerpts. The owner explicitly authorized opt-in local Groq summaries of reviewed document excerpts, including combined analysis (ADR 0016). External-provider contracts/transfer/retention controls remain open before outside users. Q-007 still concerns backup/retention/account deletion and broader rollout; explicit per-document/per-claim deletion now exists with visible retained-quote semantics. This does not block the authorized single local pilot import.
