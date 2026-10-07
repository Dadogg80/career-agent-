# Groq: sikker nøkkelkonfigurasjon

Status: Brukeren har opplyst at en GroqCloud API-nøkkel er tilgjengelig. Nøkkelen er ikke mottatt eller verifisert. Ingen Groq-integrasjon eller modellkall er implementert.

## Codex cloud-miljø

Det er lagret et secret-krav i miljøutkastet:

- Navn og applikasjonsvariabel: `GROQ_API_KEY`.
- Tillatt HTTPS-destinasjon: `api.groq.com`.
- Selve verdien skal legges inn i Secrets i miljøinnstillingene, aldri i chat eller Git.
- Brukeren må gjennomgå og lagre endringen, deretter publisere miljøet. Utkastet alene injiserer ikke nøkkelen eller aktiverer nettverkstilgangen.

Dette er proxy-støttet konfigurasjon: en injisert variabel kan være en placeholder som erstattes ved autorisert HTTPS-egress. Bruk nøkkelen gjennom den støttede ruten; ikke forsøk å hente ut en rå nøkkelverdi.

Når konfigurasjonen er aktiv, kontroller variabelens tilstedeværelse uten å vise verdien. Verifiser deretter tilgang med et read-only modelloppslag før modellvalg eller inference. Tilgang og gratis kvote er separate spørsmål.

## Lokal Mac

Codex-konfigurasjonen overfører ikke nøkkelen til Mac-en. Ved lokal kjøring må `GROQ_API_KEY` settes i backend-prosessens miljø gjennom sikker lokal konfigurasjon. Spring Boot leser ikke automatisk en vilkårlig `.env`-fil.

Ingen frontend-variabel eller localStorage skal inneholde nøkkelen. Repoets `env_example` har et eksempelnavn `GROQCLOUD_API_KEY`; planlagt standard er `GROQ_API_KEY`. Eksempelfilen er ikke lastet av applikasjonen og skal aldri fylles med en ekte nøkkel i Git.

## Før AI aktiveres

- Verifiser modeller og kontoens kvoter via API; skjermbilder gir ikke eksakte modell-ID-er eller en garantért gratisplan.
- Ingen planoppgradering eller betalt fallback er autorisert.
- Test norsk/engelsk og faktatrofasthet med fiktive data først.
- Avklar gjeldende datavilkår før private CV-er eller søknader sendes.
- Nøkkel og provider-feil skal ikke logges i klartekst eller eksponeres til nettleseren.
