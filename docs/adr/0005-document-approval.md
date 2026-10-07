# ADR-0005: Godkjenning og innsending følger eksakte versjoner

Status: Proposed — bygger på brukerens krav om originalbevaring og riktig CV per søknad.

## Kontekst

Et dokument kan endres mellom forslag, godkjenning, eksport og innsending. Produktet trenger et pålitelig grunnlag for intervju og historikk.

## Forslag

Godkjenning bindes til bestemt innholdsrevisjon. Eksport registrerer mal- og innholdsversjon. Generering/nedlasting er ikke innsending. Brukeren registrerer faktisk brukte artefakter; eksterne endringer registreres som nye filer eller eksplisitt ukjent versjon.

## Alternativer

En mutable «nåværende CV» eller automatisk APPLIED etter nedlasting gir enklere lagring, men feil historikk.

## Konsekvenser

Flere versjoner og tydelig godkjennings-UI. Historiske artefakter endres ikke ved nye claims. Personvernsletting må likevel kunne slette dem gjennom definert policy.
