# Sikkerhet og personvern — foreløpige krav

Status: Designkrav og anbefalinger. Første grunnmur har loopback-bind på backend og helsesvar uten komponentdetaljer. Auth, private data og de øvrige tiltakene nedenfor er ikke implementert. Dokumentet er ikke en bekreftelse på GDPR-compliance.

## Krav før ekstern pilot

- Verifisert innlogging og autorisasjon for alle private ressurser.
- Tester som forsøker lesing og endring på tvers av brukere.
- Private dokumenter med tilgangskontroll; ingen offentlige lagringslenker som standard.
- Sikker behandling av opplastede filer med format-/størrelsesgrenser og ressursisolasjon.
- Ingen tokens, hemmeligheter eller fullstendige kandidatdokumenter i logger.
- Definert eksport, sletting, retention og backup-policy.
- Avklart behandling hos AI-provider og andre databehandlere.

## Foreløpige anbefalinger

- Lokal første pilot og EU/EØS som føring for senere hosting.
- Send bare nødvendig kandidatgrunnlag til eksterne modeller. Kontaktdata er normalt unødvendig for matching.
- Bruk rate limits og harde kostnadsgrenser før betalte AI-kall.
- Behandle dokumenter og annonser som upålitelig input; de gir aldri AI nye rettigheter.
- Beskytt URL-henting mot SSRF, interne adresser, utrygge redirects og store svar.
- Konsekvensfulle handlinger krever godkjenning av konkret innhold og mål.

## Prosjektdokumentasjon

Markdown og Git skal inneholde produktbeslutninger og utviklingsinformasjon, ikke private CV-er, reelle søknadssvar, intervjunotater eller credentials. Bruk fiktive eksempler i tester og dokumentasjon.

## Åpent

Innloggingsmodell for lokal pilot, AI-provider, lagringssted, backup og retensjon må avklares. EU/EØS-lagring alene avgjør ikke lovlighet eller overføringsspørsmål.
