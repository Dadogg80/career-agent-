# Lokal utvikling på pilotmaskinen

Status: Foreslått oppsett basert på brukerens oppgitte maskin. Ingenting er installert eller testet på Mac-en. Codex-miljøet er en annen maskin og kan ikke bekrefte lokal ytelse.

## Tilgjengelige ressurser

MacBook Pro med Apple M1, 16 GB samlet minne og macOS 26.3.1 (oppgitt i skjermbildet). Omtrent 52 GB lagring var ledig ved opplysningen; dette er et øyeblikksbilde, ikke garantert kapasitet.

Maskinnavn og serienummer lagres ikke i prosjektet. M1 bruker delt minne mellom CPU og GPU; det er ikke 16 GB til modellen i tillegg til resten av systemet.

## Anbefalt fordeling

| Komponent | Kjøreform | Begrunnelse |
| --- | --- | --- |
| Next.js | Nativ Node.js-prosess | Rask utviklingssyklus uten unødvendig containerlag |
| Kotlin/Spring Boot | Nativ ARM64-JDK og Gradle wrapper | Begrens minnebruk og bruk plattformens native verktøy |
| PostgreSQL | Én ARM64-kompatibel container med persistent volume | Enkel versjonering og senere integrasjonstester |
| Lokal AI | Ollama nativt på macOS, som kandidat | Mulighet for Metal-akselerasjon; kjør ikke modellen i Linux-container og forvent samme GPU-tilgang |
| Dokumenter | Privat lokal mappe utenfor Git | Ingen nødvendig ekstern lagringskostnad i piloten |

Velg containerruntime etter at eksisterende installasjon er undersøkt. Colima er en mulig lokal runtime uten abonnement; Docker Desktop kan vurderes dersom relevante lisensvilkår tillater bruken. Ingen ny runtime er installert eller besluttet.

## Lokal AI: utprøving før løfte

Begynn med én kvantisert instruksjonsmodell i omtrent 3–4B-klassen. Modell og distribusjonsformat velges etter vurdering av lisens, norsk/engelsk kvalitet og støtte i runtime. Modellfiler kan oppta flere GB.

Kjør én modelloppgave om gangen med begrenset kontekst. Lange CV-er deles i relevante deler; ikke send alle dokumenter til hvert modellkall. En 7–8B-modell kan undersøkes senere dersom faktisk minnebruk og kvalitet tilsier det.

Lokal AI unngår betalt API-bruk og ekstern behandling av innhold ved lokal kjøring, men gir ingen garanti for tilstrekkelig analyse- eller skrivekvalitet. Modelldownload krever nettverk og må komme fra en betrodd kilde. Undersøk runtime-innstillinger og eventuelle eksterne verktøykall før sensitive data brukes.

## Verifikasjon før valg

1. Kontroller ARM64-verktøy og ledig disk på Mac-en.
2. Start PostgreSQL og verifiser databevaring etter restart.
3. Prøv en liten lokal modell på fiktivt norsk og engelsk kandidatmateriale.
4. Kontroller strukturert krav-ekstraksjon, kildehenvisninger og skillet mellom ukjent og manglende erfaring.
5. Kontroller at teksten ikke oppgraderer «bidro» til «ledet» eller finner på erfaring.
6. Mål svartid, minnebruk og respons mens frontend/backend kjører. Registrer resultater uten private inputtekster.
7. Hvis kvaliteten er utilstrekkelig: behold manuelle flyter og dokumenter begrensningen. Ikke aktiver en betalt fallback uten autorisasjon.

## Ressursgrenser

Ikke kjør Kafka, Temporal eller en komplett observability-stack i første pilot. Start med lav Gradle-parallellisme og tilpass JVM-heap etter måling. Docker-bilder, build-cache og modeller må ryddes kontrollert; databaser og brukerfiler skal aldri slettes som generell cache-opprydding.

Et persistent volume er ikke backup. Definer separat backup av database og dokumentfiler før piloten lagrer materiale som ikke kan erstattes.

## Neste implementasjonsforberedelse

Velg og pin støttede verktøyversjoner før oppsettet implementeres. Opprett kjørekommandoer og Compose først når implementasjon er eksplisitt autorisert. Dette dokumentet beskriver en plan, ikke et ferdig utviklingsmiljø.

## PostgreSQL foundation update (2026-10-07)

The complete backend test suite now requires Docker for disposable real PostgreSQL tests. Public-ad startup remains database independent; `./gradlew bootJar` can build the application without starting database tests. Optional local persistence startup and required credentials are documented in [POSTGRES_SETUP.md](POSTGRES_SETUP.md). Optional local profile login/API/UI are now available for name/language only; see [IDENTITY_SETUP.md](IDENTITY_SETUP.md). Experience, competency claims and CV upload remain future increments. URL analysis now runs directly from **Analyze link**, with no mandatory excerpt-review step.

## Optional local identity

Use [IDENTITY_SETUP.md](IDENTITY_SETUP.md) for the additional free Keycloak container and native app startup. It is needed only for owned basic profiles. Keep this optional on the M1: public analysis does not require the identity container. Private document/AI workflows remain future work.
