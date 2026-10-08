# AI-alternativer for pilot

Status: Historical comparison. Groq is now selected for the bounded public-advertisement pilot; model access and fictional inference are verified. Current free quotas and private-data processing terms are not established by that test. Earlier documentation fetches failed; that did not establish that API access was unavailable. See [GROQ_SETUP.md](GROQ_SETUP.md).

## Alternativer

### Observed pilot quotas and proposed task-specific models — 2026-10-08

The owner's Groq console screenshot lists GPT OSS 20B, GPT OSS 120B and Qwen 3.8 27B as text/reasoning candidates. Its displayed limits for these models are 30 requests/minute, 1,000 requests/day, 8,000 tokens/minute and 200,000 tokens/day. This records the supplied account view, not a timeless public free-tier guarantee or proof of independent aggregate account quotas. The reported 20B token/day rejection requests approximately 16 minutes of waiting; a 10-second pause cannot address it.

Proposed experiment: retain 20B for short advertisement extraction; compare 120B on complex document extraction, reviewed personal matching and CV wording; evaluate Qwen vision only when locally extracted/scanned text is insufficient. Verify actual API IDs, strict structured-output support, Browser Search eligibility and Norwegian/source-grounded quality for each task before changing defaults. Voice models do not address present document/advertisement workflows.

Task-specific selection can distribute legitimate work if model quotas are independent, but cannot create unlimited capacity. Prefer source/result reuse and small relevant inputs. Do not implement automatic model/key rotation after 429 or assume a larger model has a larger quota. Task-specific routing is now configurable on the current unpublished branch; all unset tasks retain the existing configured model. A live comparison was blocked by quota, so 120B/Qwen defaults are not activated. See [GROQ_OPTIMIZATION.md](GROQ_OPTIMIZATION.md).

| Alternativ | Mulig fordel | Forbehold |
| --- | --- | --- |
| Gemini Developer API | Har tilbudt gratis API-kvoter og sterke generalistmodeller; kandidat for norsk/engelsk og strukturert analyse. | Kontroller dagens kvoter, tilgjengelige modeller, geografisk tilgang og datavilkår. Ikke anta gratis behandling av private CV-er er akseptabelt. |
| Groq API | Har tilbudt gratis utviklertilgang til utvalgte modeller og rask inferens. | Norsk kvalitet avhenger av konkret modell. Kontroller kvoter, kommersiell bruk, datalagring og støtte for strukturert output. |
| Ollama lokalt | Ingen betalt inference-API; lokal behandling på Mac-en. | M1/16 GB tilsier små kvantiserte modeller først. Kvalitet, kontekst og hastighet må testes; strøm, disk og maskinressurser brukes. |
| OpenAI API med egen nøkkel | Kandidat for høy kvalitet og enkel provider-integrasjon. | Ingen gratis bruk forutsettes. ChatGPT-abonnement inkluderer ikke automatisk API-kreditt. |

## Anbefalt utprøving

Undersøk Gemini-gratisnivå først med fiktive data dersom dagens vilkår passer. Sammenlign med én Groq-modell og en liten lokal modell hvis Gemini ikke passer. Ikke bygg flere provider-integrasjoner før en kandidat er evaluert.

Test samme norske og engelske annonse/profil-eksempler for krav-ekstraksjon, kildehenvisninger, avklaring, fravær av oppdiktning og tekstkvalitet. Gratis er et budsjettkrav, ikke bevis på egnet kvalitet.

Ingen automatisk betalt fallback. Kvotefeil skal bevare arbeidet og tillate retry eller manuell fortsettelse. Før reelle kandidatdata sendes eksternt må providerens aktuelle vilkår og nødvendige databehandling avklares.

## Offisielle kilder som må sjekkes

- [Gemini API-prising](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API-vilkår](https://ai.google.dev/gemini-api/terms)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)
- [Groq databehandling](https://console.groq.com/docs/your-data)
