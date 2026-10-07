# ADR-0008: Official NAV API for initial URL import

Status: Accepted for the local pilot. Date: 2026-10-07.

## Context

URL analysis is the user’s next priority. FINN robots explicitly prohibit crawling without written permission; Arbeidsplassen terms also restrict automated website copying. NAV provides a free official vacancy API and a rotating public experiment token. Its API excludes FINN advertisements shown on Arbeidsplassen.

## Decision

Accept individual HTTPS Arbeidsplassen advertisement UUID links, and request the corresponding fixed `/api/v1/feedentry/<uuid>` endpoint. Use `/api/publicToken` for experimentation or an optional server-side NAV_API_TOKEN. Normalize API-provided descriptions using jsoup, require active records, and show title/source/time/text for user review before a separate Groq call. Reject redirects and unsupported hosts; cap network time, size and normalized content. Keep pasted text as the fallback.

## Consequences

This delivers a permitted integration path without browser automation or credentials in the frontend. Not every Arbeidsplassen link is available. No website scraping, discovery feed subscription or persistence is included. Production use requires consumer registration and source update/deletion handling. Search-provider access is evaluated independently.

## Sources checked

- [NAV feed documentation](https://navikt.github.io/pam-stilling-feed/)
- [API terms](https://arbeidsplassen.nav.no/vilkar-api)
- [Website terms](https://arbeidsplassen.nav.no/vilkar-og-retningslinjer)
- [FINN robots](https://www.finn.no/robots.txt)

Live API verification showed `ad_content`, not the older `json` example. Fixtures model the actual API contract and contain only fictional text.
