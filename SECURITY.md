# Sikkerhet og personvern — foreløpige krav

Status: Design requirements. The local pilot includes loopback backend binding, limited health responses, and bounded public-advertisement extraction. Optional local OIDC/PKCE sign-in and owned basic-profile persistence are implemented; owned manual/source-linked claims and local CV import are implemented on this branch; production deployment and several controls below remain requirements. This is not a GDPR compliance claim.

## Current AI pilot boundary

- Public advertisement endpoints accept public advertisements or fictional text only. Private document AI has a separate authenticated preview/approval boundary (ADR 0016), described below.
- The Next.js extraction route accepts loopback hostnames and checks browser Origin against the incoming Host; it does not trust Next.js's internal canonical hostname as the browser origin.
- Request size, source length, completion tokens, concurrent calls and attempts per backend process are limited. The process budget resets on restart and is not a billing guarantee.
- Provider failures return allowlisted error codes, not keys, source documents or provider payloads.
- Source text and results are held only for the request/UI lifecycle, not stored in a database or browser persistence.
- Development diagnostics log only allowlisted stages, counts, timings, HTTP status and mapped error codes. Never log source text, titles, full URLs, raw provider responses or credentials. A separately expanded UI preview displays the received public source as escaped text. Diagnostics default off in production and retain at most 40 events for the current run in component memory. See docs/DEBUGGING.md.
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

One import may execute at a time. The Next.js import proxy enforces local Host/same-Origin behavior and a 10 KB body cap. Backend still binds loopback. Public advertisement endpoints remain unauthenticated and separated from private profile data; do not expose this local pilot publicly.

The public NAV experiment token is obtained server-side for each import, never sent to the browser or stored in Git. An optional `NAV_API_TOKEN` is server-only. Source HTML descriptions are parsed to plain text, never rendered as HTML; scripts/styles/navigation/forms are removed. Contact lists are excluded from normalized text. Public descriptions can still contain personal details: review and remove unnecessary information before sending to Groq. No advertisement persistence or logging of source bodies is introduced. Registered consumer access and update/removal compliance are required before persistent discovery/republication.

## FINN Browser Search pilot

Accept only canonical modern `https://www.finn.no/job/ad/<numeric-id>` job links (also canonicalize finn.no without www). Never fetch arbitrary input URLs on the backend. Only Groq's HTTPS chat endpoint receives the public link, with the existing server-only key. Enable browser_search only, request exact-page reading without login, application actions or unrelated jobs, and treat page content as untrusted. Provider-internal browsing is not controlled by the backend URL allowlist; output admission requires an exact original-link tool record.

Discard final generated answers and reasoning; retain bounded numbered browser.open source text with Groq/Exa provenance. Never render HTML from the provider. Enforce 1 MB transport response / 15,000 character normalized text limits, connection/header/body timeouts and no redirects/retries. FINN has no verified active-state/freshness guarantee; the UI requires source review and retains manual paste as fallback.

Default process limits: 10 Browser Search attempts and 20 structured-analysis attempts, independently configurable. Failed search attempts count; restarting resets counters. One API attempt can execute multiple provider-side tool actions. These are operational bounds, not account billing guarantees. Use the existing free-tier pilot account; no upgrade or paid fallback is implemented. Setting GROQ_BROWSER_SEARCH_ENABLED=false disables the feature. Production consumer/source/provider terms and retention assessment remain pending.

## Local persistence boundary

Compose PostgreSQL is loopback-only with a required local password and a persistent volume. The basic profile endpoint requires a verified OIDC session and scopes every operation by issuer+subject. Real PostgreSQL authorization tests cover cross-identity isolation and stale revisions. The current branch supports bounded local document upload for the single pilot; optional private document AI is now authorized for the local pilot through the reviewed-preview boundary below. Runtime/migration role separation, encrypted backups and production secret management are future deployment requirements.

## Evidence resilience

Exact FINN URL/tool proof is retained when handling wrapped provider titles. Source emphasis normalization and Unicode whitespace matching do not authorize invented words. Only independently quoted suggestions survive; omission counts are visible. All-unsupported/malformed outputs fail. The React-session source is transient and reused only for the same canonical URL. Sanitized rejection logs contain codes/status/counts, not personal content, credentials, raw model output or provider messages.

## Local identity/profile controls (implemented, ADR 0013)

- Spring Security authorization code + PKCE S256; fixed issuer/client and loopback callback/success/failure destinations. No password authentication implemented by the application and no generated default Spring password.
- `CAREER_SESSION` is HttpOnly, SameSite=Lax, cookie-only and expires after 30 minutes of inactivity. Local loopback HTTP uses non-Secure cookies; any future HTTPS deployment must enable Secure and reassess topology. Sessions are not durable across backend restarts.
- Private GET/PUT use `/api/profile/me`; ownership comes only from the verified token issuer+subject. Extra owner fields, unverified headers/Bearer strings and arbitrary private resource paths do not confer access. Language/name/revision are validated; optimistic conflict checks prevent silent overwrite.
- Spring CSRF protects profile PUT and logout POST. Next proxies enforce loopback/same-origin, a 4 KiB write-body limit, selected cookie/CSRF forwarding and no-store responses. No OAuth token is returned to browser JavaScript. The session response exposes a CSRF token and availability booleans, not identity claims.
- Local Keycloak `start-dev` and its single synthetic pilot realm are optional, loopback-only development tools. Passwords are generated into an ignored mode-0600 file, never printed. App sign-out does not terminate provider SSO.
- Profile bodies, session cookies, tokens and raw auth errors are excluded from console/server diagnostics. The developer Sheet continues to inspect public ads only. No profile data is sent to Groq.

Before external users or CV imports: choose production identity/HTTPS configuration, resolve deletion/export/retention and backup policy, assess document storage and AI-provider processing, and review request/session abuse limits. These are concrete remaining work, not claims of implemented compliance. The current optional profile stores name/language only.


## Current local CV and claim boundary

All private reads/writes/downloads use verified issuer+subject ownership. All private writes require CSRF. Clients cannot assign owners or confirmed statuses. Revision conflicts retain drafts; repeated reviews cannot silently create confirmations. Manual/source-selected creation is UNVERIFIED, and editing resets confirmation. Tests cover cross-subject/cross-issuer access and concurrent reviews against real PostgreSQL.

CV text extraction stays local. Originals use generated UUID storage names and restrictive POSIX permissions; the filename never determines a path. Upload/multipart, expanded ZIP/XML, PDF pages and text have limits. External XML entities/DTDs are disabled. Embedded document content is not executed. Originals download as no-store/nosniff attachments, never inline HTML. Optional explicitly requested local OCR is described below; there is no antivirus service or production processing sandbox.

Document deletion removes file/text/metadata but preserves user-created claims and their quote history, explicitly explained before deletion; delete claims separately. Account-wide export/deletion, backup retention, crash reconciliation and encrypted backups are unresolved before external use. A filesystem and PostgreSQL transaction cannot guarantee crash-atomic deletion. Public diagnostics only log allowlisted failure categories/counts/timings; private files, text, claims and cookies never enter advertisement diagnostic events. Optional reviewed document text reaches Groq only through the separate private analysis endpoints. See [CV_IMPORT.md](docs/CV_IMPORT.md).

## Optional private document AI (implemented, ADR 0016)

The product owner explicitly requested AI summaries/proposals from uploaded CVs and other competency documents before merge. Upload/text extraction remain local; reading saved analyses makes no model call. Single and combined analysis endpoints require verified ownership, CSRF and same-origin proxies, approved reviewed previews and bounded inputs. Only submitted text (plus opaque source IDs for combined analysis) is sent; original binaries, filenames, profile bodies and existing claims are not included. The preview instructs users to remove unnecessary personal details; this is user review, not guaranteed automatic PII redaction.

Up to 12,000 characters across at most 20 selected documents, one call per attempt, one document analysis in flight and ten attempts per process by default (DOCUMENT_AI_MAX_REQUESTS). No paid fallback, tool use or automatic retry. Account-wide quota availability is not guaranteed. Excerpt checks allow only layout whitespace variation and retain exact original source substrings as support in both the preview and the correct original document; all results remain suggestions requiring human review. Prompt rules reject adjacent-skill inference, embedded instructions and promotion of course/team evidence into personal production experience; these rules do not prove semantic model correctness.

Persist only validated summary/proposals and source/coverage metadata, never raw provider output or full submitted previews. Every read/replacement is owned; document deletion cascades individual results and clears combined results, while existing explicitly saved claims/quotes follow the visible retention policy above. Provider deletion/retention cannot be guaranteed by local deletion. This single-pilot opt-in does not establish GDPR compliance or authorize external users; provider contracts/settings, transfers, account export/deletion and production retention remain open.

## Local document rereading and OCR

The owned CSRF-protected reread endpoint accepts only an OCR boolean; no browser-supplied text/path/command/owner is accepted. Read existing immutable original bytes through the storage port. DOCX headers/footers retain the ZIP/XML limits and entity safeguards. PDF visual-position sorting is best-effort layout extraction, not semantic verification.

Explicit PDF OCR renders only pages without text and invokes a fixed Tesseract command without a shell or provider tools. Bound page count, raster pixels, DPI, subprocess deadline and output length; private temporary directory permissions are 0700 and the image is 0600. Child environment contains PATH/language-data location, not provider/auth secrets; stdout/stderr are discarded. Cleanup runs on success/failure, but abrupt process termination can leave temporary files. Ordinary extraction and upload do not invoke OCR. OCR text is marked and must be reviewed; mixed text/image pages may remain incomplete. The native decoder/OCR processes are not isolated from the backend OS; production sandboxing and retention/reconciliation remain separate work.

Text changes invalidate single/combined analysis, preserve original bytes and user-created claim history, and prevent stale in-flight AI results from saving against a changed source. Private contents never enter logs or public diagnostics. See ADR 0017 and CV_IMPORT.md.

## Personal matching boundary

The owner authorized previewed, per-analysis sharing of relevant CONFIRMED statements plus advertisement text with Groq. Backend ownership/status/revision checks resolve selected IDs to exact statements/context; browser-supplied profile facts are rejected. Per-analysis approval resets after preview changes. Name/contact profile fields, document bodies/source notes and unselected statements are excluded from prompts and logs. Statement/context themselves may contain personal details and require preview review. Saved results retain selected statement snapshots; claim deletion discloses this separate retained copy and saved-job deletion removes it. This local scope does not establish provider-contract/account-deletion/backup-retention compliance.
