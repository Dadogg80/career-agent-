# AI-alternativer for pilot

Status: Kandidater for vurdering, ikke vedtatt provider. Gjeldende gratisnivåer, regiontilgang, modeller og datavilkår er ikke verifisert. Forsøk på å lese offisielle Google/Groq-sider fra Codex-miljøet fikk proxy-feilen `403 Forbidden` den 2026-10-07. Dette sier ikke noe om tilgang fra pilotens Mac.

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
