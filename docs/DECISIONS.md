# Beslutningsregister

Bekreftet betyr eksplisitt føring fra brukeren. Anbefalt betyr arkitektens forslag; det skal ikke omtales som vedtatt. Brukeren har delegert vurdering av flere alternativer, men tekniske detaljer og implementasjonsstart er fortsatt uavklart.

## Bekreftede føringer

| ID | Føring | Grunnlag og konsekvens |
| --- | --- | --- |
| D-001 | Ingen applikasjonsimplementasjon før eksplisitt beslutning. | Brukerens opprinnelige instruksjon; nåværende oppgave autoriserer dokumentasjon. |
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

## Formelle arkitekturbeslutninger senere

[ADR-indeksen](adr/README.md) inneholder to vedtatte produktføringer og tre foreslåtte detaljbeslutninger. Identitet/isolasjon og databehandling trenger videre avklaring før egne vedtatte ADR-er.

Arbeidsmåten er `main` med korte arbeidsbranches, uten permanent `development`, valgt under den delegerte instruksjonen om å fortsette. Se [Git-arbeidsflyten](GIT_WORKFLOW.md). Branch protection er ikke konfigurert.
