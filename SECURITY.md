# Sikkerhet og personvern — foreløpige krav

Status: Design requirements. The local pilot includes loopback backend binding, limited health responses, and bounded public-advertisement extraction. Authentication, private-data persistence and the remaining controls below are not implemented. This is not a GDPR compliance claim.

## Current AI pilot boundary

- Only public advertisements or fictional text should be used. The UI explains that text is sent to Groq on Analyze.
- The Next.js extraction route accepts loopback hostnames and checks browser Origin against the incoming Host; it does not trust Next.js's internal canonical hostname as the browser origin.
- Request size, source length, completion tokens, concurrent calls and attempts per backend process are limited. The process budget resets on restart and is not a billing guarantee.
- Provider failures return allowlisted error codes, not keys, source documents or provider payloads.
- Source text and results are held only for the request/UI lifecycle, not stored in a database or browser persistence.
- Tests use a mocked model or missing-key backend; they do not consume live Groq quotas. Explicit manual smoke checks use fictional data.
- No public deployment is authorized; identity, authorization and persistent per-account limits must precede external users.

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
