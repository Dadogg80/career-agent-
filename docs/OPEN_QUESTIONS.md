# Åpne spørsmål

| ID | Spørsmål | Hva påvirkes? | Status |
| --- | --- | --- | --- |
| Q-001 | Hvilket operativsystem, RAM og eventuelt skjermkort har pilotmaskinen? | Lokal drift, Docker og mulighet for lokal AI. | Avklart: Apple M1, 16 GB, macOS; se LOCAL_DEVELOPMENT.md |
| Q-002 | Lokal modell eller ekstern AI, og hva er faktisk tilgjengelig uten kostnad? | Lokal Ollama er foreslått; modellkvalitet og ytelse må testes på Mac-en. Ingen betalt API antas autorisert. | Forslag dokumentert, ikke validert |
| Q-003 | Skal anbefalt MVP og leveranserekkefølge vedtas som arbeidsplan? | Omfang før implementasjonsstart. | Forslag dokumentert |
| Q-004 | Hvilken CV-mal og hvilke layoutkrav er nødvendige for piloten? | Eksport og eventuell manuell mellomløsning. | Uavklart |
| Q-005 | Hvilken annonsekilde integreres først, og er tilgangen tillatt? | URL-import; tekstimport kan utvikles uavhengig. | Uavklart |
| Q-006 | Hvilken lokal tilgangsmodell og senere OIDC-provider skal brukes? | Innlogging, sesjoner og flerbrukerisolasjon. | Uavklart |
| Q-007 | Hvordan skal backup, sletting og retensjon fungere i lokal pilot? | Bevaring av arbeid og personvern. | Uavklart |

Ikke gjenta tidligere besvarte spørsmål om målgruppe, standardspråk, gratis pilot eller ønsket fremtidig kundetype. Oppdater denne filen når et spørsmål avklares og lenk til beslutningen.

Implementasjon av en avgrenset grunnmur er startet etter klarsignal. Q-003 gjelder fortsatt detaljene i hele MVP-en og blokkerer ikke denne første statusflyten.
