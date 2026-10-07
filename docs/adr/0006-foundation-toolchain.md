# ADR-0006: Avgrenset grunnmur og verktøyversjoner

Status: Accepted — implementasjonsvalg innenfor delegert arbeid. Ingen ekstern drift eller betaling.

## Kontekst

Vi trenger en testbar forbindelse mellom frontend og backend før profil, persistens og AI innføres. Pilotmaskinen er ARM64; Codex-maskinen er Linux x86_64.

## Beslutning

- JDK 21, Kotlin 2.1.21, Spring Boot 3.5.16 og Gradle wrapper 8.14.3.
- Node.js 24, Next.js 16.4.0 og React 19.3.0; eksakte npm-versjoner og lockfile.
- Spring Boot 3.5-linjen gir en avgrenset, moden Spring-grunnmur. Oppgraderingsbehov vurderes før ekstern drift; en valgt major-versjon er ikke en permanent binding.
- Ingen DB, auth eller AI-avhengighet i første statusflyt. Private domenedata innføres ikke før tilgangsmodellen er løst.
- Frontend bruker en server-side statusroute som proxy til backend. Ingen generell offentlig proxy eller CORS-unntak.
- Gradle-distribusjonen checksum-verifiseres; verktøycacher og miljøspesifikk proxykonfigurasjon ligger utenfor Git.
- Loopback-bind som standard for lokale tjenester; ingen offentlig deploy.

## Alternativer

Alle komponenter og tjenester fra dag én ville gjort feil vanskeligere å isolere. Spring Boot 4 er et mulig senere valg, men gir ingen nødvendig verdi for denne første HTTP-flyten. En direkte klient/backend-forbindelse ville krevd ytterligere browser-/CORS-konfigurasjon.

## Konsekvenser

Grunnmuren er ikke en ferdig jobbsøkerapplikasjon. JDK og Node må installeres separat på Mac-en. Verktøyversjonene må vedlikeholdes og CI må bekreftes ved faktisk kjøring, ikke bare ved at workflow-filen eksisterer.
