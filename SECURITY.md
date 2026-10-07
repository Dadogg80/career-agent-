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

## Official NAV source adapter — local pilot

User input is parsed as an HTTPS Arbeidsplassen advertisement UUID. Backend requests only fixed paths on `pam-stilling-feed.nav.no`; it never requests the submitted URL, API-returned URLs or arbitrary company links. Redirects are rejected, resolved local/private addresses are blocked, connections and body reads have deadlines, JSON content type is required, downloads are capped at 1 MB and normalized text at 15,000 characters. The trusted platform HTTPS proxy may resolve the upstream independently; this is a host allowlist design, not a general DNS-pinned crawler.

One import may execute at a time. The Next.js import proxy enforces local Host/same-Origin behavior and a 10 KB body cap. Backend still binds loopback. No authentication has been added; do not expose this pilot publicly.

The public NAV experiment token is obtained server-side for each import, never sent to the browser or stored in Git. An optional `NAV_API_TOKEN` is server-only. Source HTML descriptions are parsed to plain text, never rendered as HTML; scripts/styles/navigation/forms are removed. Contact lists are excluded from normalized text. Public descriptions can still contain personal details: review and remove unnecessary information before sending to Groq. No advertisement persistence or logging of source bodies is introduced. Registered consumer access and update/removal compliance are required before persistent discovery/republication.

## FINN Browser Search pilot

Accept only canonical modern `https://www.finn.no/job/ad/<numeric-id>` job links (also canonicalize finn.no without www). Never fetch arbitrary input URLs on the backend. Only Groq's HTTPS chat endpoint receives the public link, with the existing server-only key. Enable browser_search only, request exact-page reading without login, application actions or unrelated jobs, and treat page content as untrusted. Provider-internal browsing is not controlled by the backend URL allowlist; output admission requires an exact original-link tool record.

Discard final generated answers and reasoning; retain bounded numbered browser.open source text with Groq/Exa provenance. Never render HTML from the provider. Enforce 1 MB transport response / 15,000 character normalized text limits, connection/header/body timeouts and no redirects/retries. FINN has no verified active-state/freshness guarantee; the UI requires source review and retains manual paste as fallback.

Default process limits: 10 Browser Search attempts and 20 structured-analysis attempts, independently configurable. Failed search attempts count; restarting resets counters. One API attempt can execute multiple provider-side tool actions. These are operational bounds, not account billing guarantees. Use the existing free-tier pilot account; no upgrade or paid fallback is implemented. Setting GROQ_BROWSER_SEARCH_ENABLED=false disables the feature. Production consumer/source/provider terms and retention assessment remain pending.
