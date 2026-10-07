# AI-alternativer for pilot

Status: Historical comparison. Groq is now selected for the bounded public-advertisement pilot; model access and fictional inference are verified. Current free quotas and private-data processing terms are not established by that test. Earlier documentation fetches failed; that did not establish that API access was unavailable. See [GROQ_SETUP.md](GROQ_SETUP.md).

## Alternativer

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
