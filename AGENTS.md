# Arbeidsregler for Career Agent

## GitHub and documentation language

- Use English for all commit messages, PR titles and descriptions, issues, review comments, release notes, and branch names.
- Write new technical documentation and code comments in English. When editing existing Norwegian documents, preserve their meaning and translate the affected section when practical.
- The application remains Norwegian by default and supports English. Conversation with the user can remain Norwegian.
- Every PR handoff must include an English title and a complete English description, with actual validation and limitations.

## Gjeldende fase

Implementation is authorized in small coherent increments. The foundation is merged; current slices include direct URL analysis, sourced overview facts, and an opt-in PostgreSQL/Flyway foundation alongside bounded FINN and NAV import. Browser excerpts must never be presented as verified complete original advertisements. Optional local OIDC/PKCE sign-in and user-owned basic profiles (name/language/revision) are now implemented; owned reviewed competency claims, local DOCX/PDF sources and opt-in single/combined AI summaries are merged in PR #14. The current branch improves competency UX, bounded source selection, existing-original rereading and explicitly requested local Tesseract OCR. The owner also authorized optional Groq summarization and competency proposals from single or multiple uploaded documents before merge (ADR 0016). Require owned private endpoints, reviewed bounded previews and explicit per-run approval; output remains unverified until user review. Reviewed typed career history and a public landing/dedicated sign-in/workspace overview are added locally; root analysis moves to /jobs/analyze and fixed OIDC callbacks use /dashboard or /login?login=failed. Owned saved job snapshots and per-analysis-approved matching are now implemented on the local branch; adjacent-skill inference and production identity remain pending. The owner approved relevant CONFIRMED claims plus advertisement text for future Groq matching only with preview and per-analysis approval. First pilot hosting is local on the owner's Mac; online hosting is deferred. Private content must never enter public advertisement endpoints or advertisement diagnostics. The local pilot also includes reviewed standard CV export, manual application tracking, UTF-8 TXT/Markdown evidence, conservative multi-source competency deduplication and local advertisement recovery. Document AI now selects numbered evidence and uses source wording, with literal skill validation and nearby context proof or unknown context (ADR 0023). Read-only owned document checks validate original/text/quotes without AI calls; green checks never establish semantic completeness. Keep future increments small and tested; the owner requested no push yet. Do not build the full system at once. No paid services, plan upgrades or infrastructure costs are authorized.

## Produktføringer

- Norsk bokmål er standardspråk; engelsk skal støttes fra første versjon.
- Langsiktig målgruppe er alle jobbsøkere. Produkteieren er første og foreløpig eneste pilot.
- Pilot og testing er gratis for brukeren. Ikke pådra prosjektet kostnader uten eksplisitt autorisasjon.
- Ikke finn på erfaring. Skill mellom UNVERIFIED, INFERRED, CONFIRMED og REJECTED.
- AI-ekstraksjon er ikke bekreftelse. Bekreftede påstander skal ha sporbar kilde eller bekreftelse.
- Brukeren skal godkjenne innsending, sending av meldinger, vesentlige profilendringer og aksept av vilkår.
- Bevar originaldokumenter og dokumenter hvilken versjon som hører til en søknad.
- Hold kandidatopplysninger, dokumentinnhold og hemmeligheter utenfor Git og prosjektdokumentasjon.

## Før og under implementasjon

Når implementasjon er eksplisitt autorisert:

1. Undersøk eksisterende kode og relevante dokumenter først.
2. Planlegg en liten, sammenhengende endring.
3. Implementer med relevante tester.
4. Kjør testene og rett feil. Rapporter hva som ikke kunne verifiseres.
5. Unngå unødvendige dependencies og omskriving av fungerende kode.
6. Forklar viktige arkitekturvalg og oppdater dokumentasjonen.

Hver cloud-task har allerede et isolert miljø. Bruk eksisterende checkout; ikke opprett Git worktree uten uttrykkelig forespørsel.

## Dokumentasjon som en del av arbeidet

- Les README.md og dokumentene som gjelder endringen.
- Oppdater USER_FLOWS.md ved endret brukerflyt og USER_STORIES.md ved endrede krav.
- Oppdater ROADMAP.md ved endret omfang eller ferdigstatus.
- Registrer beslutninger med status, begrunnelse og konsekvenser i docs/DECISIONS.md. Bruk ADR for vesentlige arkitekturvalg når de vedtas.
- Før korte, faktiske oppføringer i docs/DEVELOPMENT_LOG.md: endring, validering og gjenstående arbeid.
- Registrer uavklarte spørsmål i docs/OPEN_QUESTIONS.md. Et forslag er ikke en bekreftet beslutning.
- Oppdater eksisterende dokument fremfor å lage parallelle, motstridende beskrivelser.
- Bevar historikken når en beslutning erstattes; marker den som erstattet og lenk til etterfølgeren.
- Når en publisert branch er klar for brukerens PR/merge: oppgi base- og head-branch, PR-tittel og full beskrivelse med faktisk validering og begrensninger. Ikke merge til main på brukerens vegne uten instruksjon. Sjekk oppdatert remote main før neste arbeidsbranch.
- Ikke lagre rå samtalelogger eller persondata for å øke dokumentmengden. Dokumenter relevant hensikt, krav, begrunnelse og resultat.

## Frontend implementation rule

Use TanStack Query for server queries and asynchronous mutations. Use shadcn/ui components, kept in `apps/web/components/ui`, as the UI foundation. Keep Next.js routing; do not introduce TanStack Router or Table without a concrete need. Norwegian remains the default. Preserve visible evidence, accessible controls, responsive layouts and honest feature availability; no fake match scores or inactive navigation presented as working features. Disable automatic retries for AI mutations.
