# Arbeidsregler for Career Agent

## Gjeldende fase

Produkt- og arkitekturarbeid. Dokumentasjon er autorisert. Ikke start applikasjonsimplementasjon, dependency-installasjon eller infrastrukturprovisjonering før brukeren eksplisitt bestemmer at implementasjonen skal begynne.

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
- Ikke lagre rå samtalelogger eller persondata for å øke dokumentmengden. Dokumenter relevant hensikt, krav, begrunnelse og resultat.
