# Beslutningsregister

Confirmed records explicit user requirements; recommendations record design proposals. Implementation has started, and the user has delegated routine choices. Accepted implementation decisions identify their scope and do not imply that the full MVP is approved or completed.

## Bekreftede føringer

| ID | Føring | Grunnlag og konsekvens |
| --- | --- | --- |
| D-001 | Ingen applikasjonsimplementasjon før klarsignal. | Opprinnelig instruksjon. Klarsignal til første lille implementasjon er nå gitt; se D-012. |
| D-002 | Norsk først, engelsk fra første versjon. | Brukerens eksplisitte språkkrav; UI og dokumentspråk må skilles. |
| D-003 | Langsiktig målgruppe er alle jobbsøkere. | Brukerens svar; modellen skal ikke være utviklerspesifikk. |
| D-004 | Produkteieren er eneste pilot og trenger rask praktisk nytte. | Brukerens svar; prioriter hele, små brukerflyter. |
| D-005 | Ingen tilgjengelig finansiering; gratis under pilot/testing. | Brukerens svar; ikke anta betalt drift eller AI-budsjett. |
| D-006 | Senere mulig salg til veiledere og organisasjoner. | Brukerens svar; tilrettelegg for eierskap uten å bygge organisasjonsprodukt nå. |
| D-007 | Erfaring skal aldri oppdiktes. | Produktvisjonen; inferens og ekstraksjon blir ikke automatisk CONFIRMED. |
| D-008 | Modular monolith først; Kotlin/Spring Boot foretrekkes. | Opprinnelig produktvisjon; endelige versjoner og modulgrenser gjenstår. |
| D-009 | PostgreSQL er ønsket system of record. | Produktvisjonen; vector search er en avledet retrieval-mekanisme. |
| D-010 | Beslutninger, planer og fremdrift skal lagres i dedikerte Markdown-filer. | Gjeldende brukerforespørsel; dokumentasjon er del av hver senere endring. |
| D-011 | Fortsett selvstendig med dokumentasjon og Git-publisering. | Brukerens instruksjon etter foreslått neste steg; ikke en eksplisitt bestilling på applikasjonsimplementasjon. |
| D-012 | Start første avgrensede utvikling. | Brukerens «vi kan vel kanskje starte utviklingen nå?» er tolket som klarsignal, med omfang forklart før arbeidet. Ingen betalingsautorisasjon. |
| D-013 | Use English for GitHub communication. | Explicit user requirement: commits, PR titles/descriptions and other GitHub communication. |
| D-014 | Groq for the bounded advertisement pilot. | User supplied access; authenticated model listing and fictional extraction verified. Delegated implementation choice in ADR-0007; no private CV processing or paid fallback. |

## Anbefalinger for diskusjon

| ID | Anbefaling | Hvorfor / konsekvens |
| --- | --- | --- |
| R-001 | Samle vurdering, søknadsmateriale og enkel CRM i én MVP-flyt. | Gir praktisk nytte fra analyse til søknad uten å bygge alle langsiktige funksjoner. |
| R-002 | Lokal pilot før nødvendig skydrift. | Reduserer kostnader; maskinkapasitet og AI-kjøreform må avklares. |
| R-003 | Én kontrollert eksportmal fremfor vilkårlig DOCX-layout. | Begrenset rendringsrisiko; original beholdes, men layout bevares ikke nødvendigvis i ny eksport. |
| R-004 | Tekstimport som garantert annonseinntak; URL-import som tillegg. | Jobbsøkingen kan fungere selv om en kilde blokkerer henting. |
| R-005 | Bare godkjent kandidatgrunnlag i eksporterte faktapåstander. | Reduserer oppdiktning; effektiv claim-gjennomgang blir nødvendig. |
| R-006 | Ingen fremtredende totalscore i første versjon. | Prioriter forklarbare vurderinger per krav fremfor falsk presisjon. |
| R-007 | Utsett Kafka, Temporal, Redis og pgvector til dokumentert behov. | Mindre drift og raskere pilot; varig jobbtilstand er fortsatt nødvendig. |
| R-008 | EU/EØS som føring for senere drift og databehandlere. | Reduserer noen personvernkomplikasjoner; erstatter ikke leverandørvurdering. |
| R-009 | Native frontend/backend og mulig lokal AI på Apple M1; PostgreSQL i container. | Pilotmaskinen har 16 GB delt minne. Begrens samtidighet og valider modellkvalitet før leverandørvalg; se LOCAL_DEVELOPMENT.md. |

## Formelle arkitekturbeslutninger senere

The [ADR index](adr/README.md) is the authoritative list of accepted/proposed architecture records. Identity and private-data processing still require concrete decisions before private profile storage.

Arbeidsmåten er `main` med korte arbeidsbranches, uten permanent `development`, valgt under den delegerte instruksjonen om å fortsette. Se [Git-arbeidsflyten](GIT_WORKFLOW.md). Branch protection er ikke konfigurert.

## Accepted implementation decisions — 2026-10-07

- D-015: Use TanStack Query and shadcn/ui for frontend work, as explicitly requested by the user. Next.js routing stays in place; further TanStack packages require a concrete need. ADR-0009.
- D-016: Use NAV’s official free vacancy API for the first URL adapter. Do not scrape FINN or Arbeidsplassen websites without permission. Public experiment token is for the local pilot; production registration/compliance remains pending. ADR-0008.
- R-012: Investigate Groq Browser Search as a possible additional source capability. The user’s Playground result is a useful UX example, not independently verified source evidence or proof of API/free-tier availability.

## FINN Browser Search — 2026-10-07

D-017 (Accepted, local pilot): Support modern FINN job URLs through Groq's documented browser_search capability using the existing key/model. Separate provider-mediated source retrieval from structured analysis; use exact-link tool output only, show provenance and potential incompleteness, and bound attempts. The earlier R-012 investigation is completed for API feasibility, with production terms/quota questions remaining. ADR-0010. No plan upgrade, paid fallback or direct FINN website scraper.

## Compact analysis and profile-first follow-up — 2026-10-07

D-018 (Accepted delegated UI decision): use compact grouped tiles/category filters and the official shadcn Dialog for per-requirement inspection. Keep quote/category guidance/source context distinct; no new model calls. TanStack Query/shadcn remain mandatory.

R-013 (Recommended implementation sequence): after the compact-result delivery, prioritize identity/PostgreSQL/manual profile → bounded CV import and claim confirmation → evidence-based matching/CV recommendations. These are multiple small PRs. Template upload precedes layout-preserving rendering/export; the latter is not claimed as part of upload. ROADMAP.md now consolidates actual implementation status and the next three deliveries instead of stale merge-pending entries.
