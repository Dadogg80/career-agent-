# Groq: sikker nøkkelkonfigurasjon

Status: The user configured Groq access in Codex. Authenticated model listing and fictional Norwegian/English inference succeeded. The backend now integrates Groq behind AiModel. Credentials were not displayed or committed.

## Codex cloud-miljø

The current environment exposes the following secret requirement:

- Navn og applikasjonsvariabel: `GROQ_API_KEY`.
- Tillatt HTTPS-destinasjon: `api.groq.com`.
- Selve verdien skal legges inn i Secrets i miljøinnstillingene, aldri i chat eller Git.
- The requirement was originally saved as a draft; the user has since published configuration and runtime access is verified. A future draft change alone does not activate a key or network access.

Dette er proxy-støttet konfigurasjon: en injisert variabel kan være en placeholder som erstattes ved autorisert HTTPS-egress. Bruk nøkkelen gjennom den støttede ruten; ikke forsøk å hente ut en rå nøkkelverdi.

Når konfigurasjonen er aktiv, kontroller variabelens tilstedeværelse uten å vise verdien. Verifiser deretter tilgang med et read-only modelloppslag før modellvalg eller inference. Tilgang og gratis kvote er separate spørsmål.

The initial Python urllib request was rejected with HTTP 403 / error code 1010. A product User-Agent (`career-agent/0.1`) resolved the request; this was not evidence of a missing key. The Java adapter uses the same User-Agent and the existing HTTPS proxy when present, with TLS verification enabled.

## Lokal Mac

Codex-konfigurasjonen overfører ikke nøkkelen til Mac-en. Ved lokal kjøring må `GROQ_API_KEY` settes i backend-prosessens miljø gjennom sikker lokal konfigurasjon. Spring Boot leser ikke automatisk en vilkårlig `.env`-fil.

Ingen frontend-variabel eller localStorage skal inneholde nøkkelen. Repoets `env_example` har et eksempelnavn `GROQCLOUD_API_KEY`; planlagt standard er `GROQ_API_KEY`. Eksempelfilen er ikke lastet av applikasjonen og skal aldri fylles med en ekte nøkkel i Git.

## Før AI aktiveres

- Verifiser modeller og kontoens kvoter via API; skjermbilder gir ikke eksakte modell-ID-er eller en garantért gratisplan.
- Ingen planoppgradering eller betalt fallback er autorisert.
- Test norsk/engelsk og faktatrofasthet med fiktive data først.
- Avklar gjeldende datavilkår før private CV-er eller søknader sendes.
- Nøkkel og provider-feil skal ikke logges i klartekst eller eksponeres til nettleseren.

## FINN Browser Search

The existing backend GROQ_API_KEY is reused; no Exa key or new frontend secret is required. Supported modern FINN links use the documented GPT-OSS browser_search tool. The existing default GROQ_MODEL=openai/gpt-oss-20b works. Changing to a model without browser tool support will fail safely; structured analysis remains a separate request because Browser Search is incompatible with structured outputs.

Optional backend environment settings:

```sh
GROQ_BROWSER_SEARCH_ENABLED=true
GROQ_BROWSER_MAX_REQUESTS=10
```

Counters reset when the backend restarts and include failures. Automatic retries and paid-plan fallback are disabled. Provider-side tool actions can exceed one per API attempt; local attempt limits do not guarantee zero billing on a paid account. Keep the existing pilot account on its free tier. Public link and provider-mediated page context pass through Groq/Exa; review snippets against the original, especially if they are partial or stale.
