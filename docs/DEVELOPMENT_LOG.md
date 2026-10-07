# Utviklingslogg

Loggen beskriver faktisk arbeid, ikke planlagt funksjonalitet. Datoer følger brukerens tidssone Europe/Oslo.

## 2026-10-07 — Produktdokumentasjon og brukerflyter

- Autorisasjon: Brukeren ba om brukerflytdiagram, user stories og varig Markdown-dokumentasjon i repositoriet.
- Før endring: Checkout var tom for prosjektfiler; ingen eksisterende AGENTS.md eller brukerendringer ble funnet ved inspeksjon.
- Opprettet dokumentindeks, arbeidsregler, produktgrunnlag, fire Mermaid-flyter, prioriterte user stories, roadmap, foreløpige sikkerhetskrav, beslutningsregister og åpne spørsmål.
- Bekreftede brukerføringer er skilt fra arkitektens anbefalinger.
- Ingen applikasjonskode, dependencies, tjenester eller skydrift er opprettet.
- Dokumentkontroll: Lokale Markdown-lenker, story-referanser og kodegjerder er kontrollert i alle 10 filer; 22 unike story-ID-er er registrert. Kontrollen bestod. Mermaid-diagrammene er ikke verifisert i en renderer.
- Gjenstår: Gjennomgå flytene med brukeren, avklare pilotmaskin og AI-kjøreform, og vedta omfang før implementasjon.

## 2026-10-07 — Git-publisering og arkitekturgrunnlag

- Brukeren ba om selvstendig videreføring med minst mulig interaksjon.
- Første dokumentasjonscommit `7f78bb0` er pushet til GitHub som `main`.
- Opprettet `docs/architecture-foundation` for videre dokumentasjonsarbeid.
- Skrevet ARCHITECTURE.md, DOMAIN.md, Git-arbeidsflyt og fem ADR-er. To ADR-er registrerer eksplisitte produktføringer; tre er forslag.
- Ingen applikasjonskode eller betalte tjenester er opprettet. Ingen branch protection er satt.
- Dokumentkontroll bestod for alle 19 Markdown-filer: lokale lenker, kodegjerder og whitespace. `git diff --check` bestod. Mermaid er ikke visuelt rendret; ingen applikasjonstester finnes ennå.
- GitHub API svarte Forbidden ved repository-oppslag. Git-push fungerer, men PR-opprettelse og innstilling av default branch kan ikke forutsettes tilgjengelig via API. Ingen PR er opprettet.

## 2026-10-07 — Pilotmaskin og foreslått lokal kjøring

- Brukerens skjermbilde avklarte Apple M1, 16 GB minne og macOS. Maskinnavn, serienummer og selve skjermbildet er ikke lagret i Git.
- Dokumentert forslag: native frontend/backend, PostgreSQL-container og utprøving av en liten lokal modell via native Ollama.
- Oppdatert åpent spørsmål om maskin; AI-valg er fortsatt betinget av lokal kvalitet og ytelse.
- Ingen installasjon eller modellkjøring er utført på pilotmaskinen. Ingen betalt fallback er aktivert.

## 2026-10-07 — Gratis AI-alternativer

- Dokumentert Gemini, Groq og lokal Ollama som kandidater; ingen provider eller modell er valgt.
- Forsøk på lesing av offisielle Google/Groq-sider ble blokkert av nettverksproxy med 403 Forbidden. Dagens gratisnivåer og vilkår er derfor ikke verifisert.
- Ingen credentials er etterspurt eller lagret, og ingen modellkall er utført.
