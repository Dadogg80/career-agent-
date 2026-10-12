> Owner-supplied product specification, approved on 2026-10-12. Preserved in its supplied language. This describes target behavior, not implemented functionality. Do not send this entire specification to an AI provider; use versioned task contracts. The delivery matrix in JOB_MATCHING_AND_CV_TAILORING_STANDARD.md records implementation boundaries.

# CAREER AGENT – MASTER IMPLEMENTATION SPECIFICATION
## Evidence-based Job Matching, AI-driven CV Tailoring, Human Approval and Document Quality Assurance

### OPPDRAG

Du skal opptre som:

- Senior Software Architect
- Senior Fullstack Engineer
- AI Systems Architect
- Senior Recruiter
- Career Adviser
- UX/Product Engineer
- Quality Assurance Engineer

Vi skal videreutvikle Career Agent slik at systemet kan analysere en stilling, sammenligne kravene med kandidatens faktiske kompetanse, oppdage relevant kompetanse som ikke er synlig i CV-en, foreslå målrettede tekstendringer, generere en ny CV-versjon og gjennomføre en uavhengig sluttkontroll av dokumentet.

Dette er ikke en generisk AI CV Writer.

Vi bygger et evidensbasert karriereprodukt der kandidatens dokumenterte erfaring er sannhetsgrunnlaget, AI bistår med analyse og formuleringer, og kandidaten godkjenner endringene.

**Systemet skal fungere på tvers av alle bransjer, yrker og senioritetsnivåer.**

Ikke bygg domene- eller AI-logikken rundt teknologiroller eller én bestemt CV-mal.

---

# DEL 1 – ARBEIDSPRINSIPPER

## 1.1 Kjerneprinsipp

Career Agent skal ikke forsøke å få alle kandidater til å fremstå som perfekte matcher.

Systemet skal:

1. Forstå hva arbeidsgiveren faktisk trenger.
2. Forstå hva kandidaten faktisk kan.
3. Finne dokumentert overlapp.
4. Identifisere relevant erfaring som er dårlig synlig.
5. Identifisere sannsynlig, men ubekreftet kompetanse.
6. Spørre kandidaten når viktige opplysninger må avklares.
7. Skille mellom reelle kompetansegap og CV-synlighetsgap.
8. Vurdere overførbar kompetanse.
9. Foreslå endringer som gjør CV-en mer relevant.
10. Sikre at alle viktige påstander kan forsvares.

Optimaliser:

- RELEVANCE
- EVIDENCE
- VISIBILITY
- READABILITY
- RECRUITER SCANABILITY
- HIRING MANAGER CREDIBILITY

Aldri på bekostning av TRUTHFULNESS.

## 1.2 Career Knowledge Base

Career Knowledge Base er kandidatens sannhetsgrunnlag.

Den eksisterende CV-en er ikke kandidatens komplette kunnskapsbase.

CV-en er én målrettet presentasjon av relevant, bekreftet informasjon.

Career Knowledge Base skal støtte:

- arbeidsgivere
- arbeidsforhold
- formelle titler
- faktiske leveranseroller
- prosjekter og kundeoppdrag
- ansvar
- oppgaver
- resultater
- kompetanser
- verktøy og systemer
- arbeidsmetoder
- utdanning
- kurs
- sertifiseringer
- autorisasjoner
- språk
- karrieremål
- preferanser
- evidens
- brukerbekreftelser

Gjenbruk eksisterende domenemodeller der det er mulig.

Ikke etabler parallelle sannhetskilder.

## 1.3 Claim Status

Bruk eksisterende eller tilsvarende statusmodell:

- CONFIRMED
- INFERRED
- UNVERIFIED
- REJECTED

Regler:

CONFIRMED:
Kan brukes som dokumentert kompetanse i CV, matching og søknader innenfor påstandens faktiske omfang.

INFERRED:
Kan brukes til å identifisere mulige sammenhenger og foreslå avklaringsspørsmål. Skal ikke brukes som bekreftet fakta.

UNVERIFIED:
Kan presenteres for gjennomgang, men ikke som sikkert faktum.

REJECTED:
Skal ikke brukes eller gjeninnføres uten ny evidens.

Confidence er ikke det samme som truth status.

Brukerbekreftelser skal lagres med kontekst og revisjon.

Ikke la et AI-kall automatisk promotere en inferert påstand til CONFIRMED.

## 1.4 Evidens og kildekontroll

Alle vesentlige kompetansepåstander skal ha sporbar kilde.

Skill mellom:

- kandidatens egen bekreftelse
- formell dokumentasjon
- opplastet CV
- attest
- utdanningsdokument
- sertifikat
- prosjektbeskrivelse
- tidligere godkjent informasjon
- AI-generert tolkning

En påstand i en tidligere CV er ikke automatisk objektivt verifisert.

Et opplastet dokument er en kilde til opplysninger, ikke et generelt bevis på at alt innhold er korrekt.

Ved konflikt mellom kilder skal systemet flagge konflikten og anvende dokumenterte regler for kildeprioritering eller be brukeren avklare.

Unngå én universell kildeprioritet for alle typer fakta.

En attest kan være særlig sterk for formell tittel og ansettelsesperiode, mens en prosjektbeskrivelse eller eksplisitt brukerbekreftelse kan være mer relevant for konkrete leveranser.

---

# DEL 2 – DEN KOMPLETTE BRUKERFLYTEN

## 2.1 Nåværende manuelle prosess

Vi skal gjenskape og forbedre følgende eksisterende arbeidsmåte:

1. Brukeren velger en stilling som allerede er analysert.
2. Brukeren åpner sin godkjente CV-mal i Word.
3. Assistenten leverer konkrete, målrettede tekstendringer.
4. Endringene gjelder CV-seksjonene enkeltvis.
5. Brukeren kopierer inn, tilpasser og godkjenner tekstene.
6. Brukeren lagrer en ny DOCX-versjon med navn knyttet til arbeidsgiver/stilling.
7. Brukeren eksporterer dokumentet til PDF.
8. Brukeren deler den ferdige PDF-en med assistenten.
9. Assistenten vurderer den faktiske PDF-en opp mot stillingsanalysen og kandidatens bekreftede kompetanse.
10. Eventuelle feil eller svakheter korrigeres.
11. Assistenten gir en begrunnet vurdering av om CV-en er klar.
12. Brukeren går videre til søknadsbrev, skjema eller innsending.

Systemet skal automatisere unødvendig kopiering og dokumentarbeid, uten å fjerne brukerens kontroll.

## 2.2 Ønsket fremtidig prosess

Job Selection
→ Job Requirements
→ Candidate Knowledge Retrieval
→ Evidence-based Matching
→ Competency Clarification
→ Match Reanalysis
→ CV Visibility Assessment
→ CV Tailoring Plan
→ Section-by-section AI Suggestions
→ User Review and Approval
→ CV Version Generation
→ DOCX/PDF Export
→ Independent Final CV Review
→ Corrections if Needed
→ CV_READY
→ Application Preparation

Dette er logiske steg.

Ikke alle steg krever egne AI-agenter, og ikke alle steg skal bruke AI.

---

# DEL 3 – STILLINGSANALYSE OG MATCHING

## 3.1 Analyser annonsen før CV-arbeid

Når en stilling mottas, skal systemet først analysere hele annonsen.

Identifiser:

- stillingens hovedformål
- arbeidsoppgaver
- ansvar
- forventede resultater
- obligatoriske kvalifikasjoner
- ønskede kvalifikasjoner
- relevant erfaring
- fagkompetanse
- metoder og prosesser
- verktøy, systemer og teknologi
- utdanning
- sertifiseringer
- autorisasjoner
- regelverk
- sikkerhets- og kvalitetskrav
- ledelse og personalansvar
- budsjett- og kommersielt ansvar
- kunde- og interessenthåndtering
- samarbeid og kommunikasjon
- bransjeerfaring
- senioritet
- språk
- arbeidsform og lokasjon
- eksplisitte søknadsspørsmål
- ATS-begreper

Skill mellom:

MANDATORY
PREFERRED
NICE_TO_HAVE

Ikke gjør et ønsket krav obligatorisk uten grunnlag.

## 3.2 Krav-mot-erfaring

For hvert viktig jobbkrav skal vi kunne følge:

Job Requirement
→ Normalized Concept
→ Candidate Knowledge
→ Employment/Role/Project
→ Evidence
→ Claim Status
→ Match Classification
→ Transferability
→ CV Visibility
→ Recommended Action

Bruk klassifisering:

- STRONG_MATCH
- PARTIAL_MATCH
- NEEDS_CLARIFICATION
- REAL_GAP

Matchstatus skal være forklarbar og kildebasert.

## 3.3 Spesifikk kompetanse versus generell erfaring

Ikke konkluder med at en kandidat dekker et spesifikt krav bare fordi vedkommende har en bredere kompetanse.

Eksempler:

Prosjektledelse er ikke automatisk dokumentasjon på risikostyring.

Salg er ikke automatisk dokumentasjon på B2B-salg.

Ledelse dokumenterer ikke automatisk personalansvar.

Klinisk erfaring dokumenterer ikke automatisk autorisasjon eller bestemte prosedyrer.

Programvareutvikling dokumenterer ikke automatisk spesifikke arkitekturmønstre.

Hvis arbeidsgiveren eksplisitt etterspør en spesifikk kompetanse:

1. Finn bekreftet evidens.
2. Undersøk semantisk tilsvarende erfaring.
3. Undersøk nærliggende erfaring.
4. Still avklaringsspørsmål når relevant.
5. Klassifiser deretter matchen.

## 3.4 Kompetansegap versus synlighetsgap

Et sentralt produktprinsipp:

COMPETENCE_GAP:
Kandidaten har ikke dokumentert kompetanse som dekker kravet, etter relevant kontroll og avklaring.

VISIBILITY_GAP:
Kandidaten har bekreftet kompetansen, men den er ikke tydelig nok i valgt CV.

Eksempel:

Job requirement:
Risk Management

Career Knowledge Base:
Risk Management = CONFIRMED

CV:
"Project Management"

Dette bør vurderes som VISIBILITY_GAP.

Systemet skal foreslå å synliggjøre bekreftet risikoarbeid, ikke påstå at kandidaten mangler kompetansen.

## 3.5 Avklaring av mulig skjult kompetanse

Hvis evidens tyder på at kandidaten kan ha relevant erfaring som ennå ikke er eksplisitt bekreftet:

- foreslå et konkret spørsmål
- koble det til kjent kontekst
- unngå ledende formuleringer
- ikke anta svaret
- lagre brukerens svar
- oppdater relevante claims etter eksplisitt bekreftelse
- kjør berørt matching på nytt

Ikke stopp ved formuleringen "probably relevant".

Enten må vi finne evidens, stille spørsmål eller beholde usikkerheten.

## 3.6 Recruiter- og Hiring Manager-vurdering

Matchanalysen skal vurdere to perspektiver:

Recruiter:
- Er de viktigste kvalifikasjonene tydelige?
- Er formelle krav dekket?
- Er det åpenbare screeningrisikoer?
- Fremstår profilen som relevant?

Hiring Manager:
- Kan kandidaten sannsynligvis utføre oppgavene?
- Finnes konkrete eksempler?
- Er ansvaret og kompleksiteten dokumentert?
- Er erfaringen direkte eller overførbar?
- Finnes det vesentlige kompetansegap?

Ingen tilfeldig eller ubegrunnet prosentscore.

Hvis numerisk score brukes, må grunnlaget kunne forklares.

---

# DEL 4 – AI EXECUTION ARCHITECTURE

## 4.1 Grunnregel

Dette er ikke ett gigantisk AI-kall som får oppgaven:

"Analyze this job and rewrite the CV."

Vi skal bruke en kontrollert arbeidsflyt med spesialiserte, testbare AI-oppgaver.

AI skal brukes til:

- informasjonsekstraksjon
- semantisk normalisering
- kravforståelse
- kompetansesammenligning
- avklaringsspørsmål
- vurdering av overførbar kompetanse
- CV-synlighetsanalyse
- tekstforslag
- språklig forbedring
- helhetlig kvalitetsvurdering

Deterministisk kode skal brukes til:

- tilgangskontroll
- kilde- og ID-validering
- claim status
- brukerbekreftelse
- dokumentversjonering
- lagring
- godkjenningsstatus
- strukturell dokumentgenerering
- filkontroll
- workflow-tilstand

AI skal ikke være den endelige autoriteten for sannhet, autorisasjon, godkjenning eller innsending.

## 4.2 Standardkontrakt for alle AI-kall

Alle AI-oppgaver skal ha:

TASK_TYPE
PURPOSE
SYSTEM_INSTRUCTIONS
INPUT_DATA
ALLOWED_FACTS
ALLOWED_SOURCES
FORBIDDEN_ASSUMPTIONS
OUTPUT_SCHEMA
VALIDATION_RULES
FAILURE_BEHAVIOR
PROMPT_VERSION

Inkluder relevante:

- candidateId
- jobId
- requirementIds
- claimIds
- evidenceIds
- cvVersionId
- tailoringSessionId

Unngå å sende unødvendige personopplysninger.

Alle AI-svar skal valideres før de påvirker applikasjonens tilstand.

## 4.3 Provider-abstraksjon

Bruk prosjektets eksisterende eller planlagte provider-abstraksjon.

Støtt:

- Groq
- Gemini

Begge providers skal kunne bruke samme interne oppgavekontrakter.

Provider-fallback må aldri senke faktakravene.

En modell som ikke støtter nødvendig strukturert output eller kontekstkapasitet, skal ikke automatisk få en oppgave den ikke kan løse tilfredsstillende.

Bruk lav temperatur for faktaekstraksjon og klassifisering der provider støtter dette.

Skill mellom:

- rate-limit/timeout/providerfeil
- ugyldig response/schema
- semantisk kvalitetsfeil
- faktisk manglende evidens

Ikke bruk blind fallback som erstatning for god validering.

## 4.4 AI Task Registry

Definer følgende logiske oppgavetyper.

Gjenbruk eksisterende oppgavetyper hvis de allerede finnes.

### AI-01 JOB_REQUIREMENT_EXTRACTION

Trigger:
Ny eller oppdatert stillingsannonse.

Input:
Original stillingsannonse med kildeinformasjon.

AI skal:
- identifisere krav
- klassifisere krav
- bevare original betydning
- identifisere presis fagterminologi
- markere usikkerhet
- skille obligatoriske og ønskede kvalifikasjoner

Output:
Strukturerte JobRequirements med kildehenvisninger.

Forbudt:
- oppdikte krav
- tolke ønskede krav som absolutte uten grunnlag
- vurdere kandidaten i samme oppgave

Validering:
Kravreferanser skal kunne spores til annonsen.

### AI-02 CANDIDATE_RELEVANCE_RETRIEVAL

Trigger:
Etter strukturert stillingsanalyse.

Input:
Krav + relevante Career Knowledge Base-fakta og kandidatens tillatte evidens.

AI skal:
- finne relevant kompetanse
- identifisere semantiske sammenhenger
- foreslå relaterte kompetanser
- bevare claim status
- identifisere relevant prosjekt-/arbeidskontekst

Output:
Requirement-to-Claim mappings.

Forbudt:
- oppdikte erfaring
- endre claim status
- tilskrive kompetanse til feil prosjekt

Viktig:
Retrieval bør primært være kontrollert av applikasjonens datatilgang og søkelogikk. AI kan støtte semantisk rangering, men skal ikke ha fri tilgang til data utenfor autorisert kandidatprofil.

### AI-03 MATCH_CLASSIFICATION

Trigger:
Etter retrieval.

Input:
JobRequirement + kandidatclaims + evidens.

AI skal:
- klassifisere STRONG_MATCH, PARTIAL_MATCH, NEEDS_CLARIFICATION eller REAL_GAP
- begrunne vurderingen
- vurdere overførbar erfaring
- identifisere mulige formelle barrierer

Output:
RequirementMatch med begrunnelse og kilde-ID-er.

Forbudt:
- bruke inferred competence som confirmed
- oppgradere delvis match til direkte match
- ignorere absolutte lovpålagte krav

### AI-04 COMPETENCY_DISCOVERY

Trigger:
Viktige krav er uavklarte, men det finnes plausibel nærliggende erfaring.

Input:
Krav + bekreftet kontekst + relevante uavklarte forhold.

AI skal:
- identifisere hva som må avklares
- formulere korte, presise spørsmål
- hjelpe kandidaten å forstå hva som etterspørres
- unngå ledende spørsmål

Output:
ClarificationQuestion med begrunnelse og tilknyttede krav.

Forbudt:
- promotere påstander til confirmed
- anta at kandidaten svarer ja
- stille mange nesten identiske spørsmål

Etter brukerbekreftelse:
Lagre svar, oppdater kunnskapsgrunnlaget og kjør relevant analyse på nytt.

### AI-05 CV_VISIBILITY_ANALYSIS

Trigger:
Når matchanalysen er tilstrekkelig avklart.

Input:
- bekreftede relevante kompetanser
- strukturerte stillingskrav
- valgt master-CV med seksjoner
- eksisterende CV-tekst

AI skal:
- vurdere synlighet for hvert viktig krav
- identifisere for generelle formuleringer
- finne manglende eksplisitte fagbegreper
- anbefale best egnet CV-seksjon for presisering

Output:
VISIBLE
WEAKLY_VISIBLE
NOT_VISIBLE
NOT_APPLICABLE

Forbudt:
- tolke fravær fra CV som fravær av kompetanse
- anbefale ubekreftede fakta

### AI-06 CV_TAILORING_STRATEGY

Trigger:
Etter visibility analysis.

Input:
JobRequirements, final match, confirmed candidate evidence, CV structure.

AI skal:
- prioritere hvilke kvalifikasjoner som bør fremheves
- velge relevante erfaringer og prosjekter
- vurdere hvilke CV-seksjoner som bør endres
- identifisere repetisjon
- vurdere om kronologi og informasjonsmengde bør justeres

Output:
Structured CV Tailoring Plan.

Planen skal angi:
- sectionId
- priority
- suggestedOperation
- targetedRequirements
- evidenceIds
- rationale

Forbudt:
- endre CV-en direkte
- opprette udokumentert erfaring

### AI-07 HEADLINE_AND_COMPETENCE_LINE

Trigger:
Godkjent tailoring strategy.

Input:
Stillingens profil, kandidatens bekreftede kompetanse og eksisterende tekst.

AI skal:
- foreslå relevant headline
- prioritere fag-/teknologi-/kompetanselinje
- bevare faktisk senioritet og profesjonell identitet

Output:
OLD → NEW eller KEEP_UNCHANGED.

### AI-08 PROFILE_PARAGRAPH_OPTIMIZATION

Trigger:
CV Tailoring Plan.

Input:
Alle eksisterende profilavsnitt, krav, dokumenterte erfaringer og rolleprioritering.

AI skal:
- vurdere alle avsnitt samlet
- foreslå tekst for hvert avsnitt som bør endres
- sikre at avsnittene utfyller hverandre
- unngå repetisjon

For pilot-CV-en skal alle tre avsnitt vurderes.

Avsnitt 1:
Relevant kandidatprofil og stillingsmatch.

Avsnitt 2:
Konkrete arbeidsforhold, erfaringer og leveranser som beviser matchen.

Avsnitt 3:
Andre dokumenterte styrker som er relevante for stillingen, eksempelvis ledelse, samarbeid, kvalitet, kundeansvar eller overførbar kompetanse.

Dette er en foretrukket struktur, ikke et krav for alle CV-maler.

Output per avsnitt:
OLD → NEW eller KEEP_UNCHANGED, med begrunnelse og evidens.

### AI-09 CORE_COMPETENCY_OPTIMIZATION

Trigger:
CV Tailoring Plan.

Input:
Hele kompetanseseksjonen, ikke bare én boks av gangen.

AI skal:
- vurdere kompetansegruppenes titler
- vurdere innhold
- vurdere rekkefølge
- identifisere manglende eksplisitte kvalifikasjoner
- identifisere repetisjon
- foreslå kompetanseprioritering basert på stillingen

For den nåværende pilot-CV-en finnes seks kompetansebokser.

Alle seks skal vurderes.

Output:
KEEP / RENAME / REORDER / REWRITE_CONTENT / REPLACE / REMOVE.

Hvert endringsforslag må være begrunnet og evidensbasert.

Antall bokser må være malstyrt, ikke hardkodet.

### AI-10 EMPLOYMENT_EXPERIENCE_OPTIMIZATION

Trigger:
CV Tailoring Plan.

Input:
Alle relevante arbeidsforhold, eksisterende tekst, dokumenterte leveranser og jobbkrav.

AI skal:
- gjennomgå alle oppføringer
- vurdere hva som bør endres
- prioritere relevante arbeidsoppgaver
- foreslå konkrete erfaringspunkter
- gjøre bekreftet fagkompetanse eksplisitt
- redusere irrelevant repetisjon
- bevare korrekte arbeidsforhold og kronologi

Viktige roller har normalt 3–5 punkter, med fleksibilitet etter rolle og mal.

Output per oppføring:
KEEP_UNCHANGED eller konkrete endringer.

Ikke finn på:
- ansvar
- resultater
- tall
- titler
- prosjekter
- arbeidsgiverforhold

### AI-11 ADDITIONAL_INFORMATION_REVIEW

Trigger:
CV Tailoring Plan.

Input:
Tilleggsopplysninger, utdanning, kurs, sertifiseringer og relevante krav.

AI skal:
- vurdere relevans
- identifisere opplysninger som bør fremheves
- foreslå omprioritering eller presisering
- kontrollere formelle krav

Output:
Seksjonsvise forslag.

### AI-12 CV_COHERENCE_REVIEW

Trigger:
Etter at alle seksjonsforslag er produsert.

Input:
Samlet foreslått CV, hele Tailoring Plan og stillingskrav.

AI skal:
- kontrollere at seksjonene støtter samme profil
- identifisere repetisjon
- kontrollere informasjonsprioritering
- vurdere overordnet recruiter scanability
- vurdere tekstlengde og konsistens

Output:
Eventuelle korrigeringsforslag før brukergodkjenning.

Denne oppgaven skal ikke introdusere nye fakta.

### AI-13 INDEPENDENT_FINAL_CV_REVIEW

Trigger:
Når faktisk DOCX/PDF er generert eller en eksternt redigert fil er lastet opp.

Input:
- faktisk ekstrahert CV-tekst
- dokumentets seksjonsstruktur
- relevante stillingskrav
- bekreftet kandidatkompetanse
- godkjent CVChangeSet
- resultater fra dokument- og layoutkontroller

AI skal:
- vurdere den ferdige CV-en uavhengig
- oppdage manglende synlighet
- oppdage unsupported claims
- identifisere svake formuleringer
- vurdere lesbarhet og relevans
- foreslå konkrete korrigeringer

Output:
PASS
NEEDS_CORRECTIONS
BLOCKED

Med detaljerte QualityFindings.

Viktig:
Dette er en separat vurderingsoppgave. Ikke la modellen automatisk godkjenne sin egen tidligere tekstgenerering.

Bruk en egen reviewer-prompt og gjerne en annen modell som tilleggskontroll, men ikke anta at modellforskjell alene gir uavhengighet.

---

# DEL 5 – AI-KONTRAKTER OG VALIDERING

## 5.1 Strukturert output

Alle AI-oppgaver som påvirker domenelogikken skal levere strukturert output.

Eksempel for CV-endring:

{
  "sectionId": "profile-paragraph-2",
  "operation": "REPLACE_TEXT",
  "oldText": "...",
  "newText": "...",
  "reason": "...",
  "requirementIds": ["R1", "R4"],
  "evidenceIds": ["E5", "E9"],
  "usedKeywords": ["risk management"],
  "requiresClarification": false
}

Dette er et konseptuelt eksempel, ikke et endelig implementeringsskjema.

Bruk eksisterende prosjektkonvensjoner.

## 5.2 Ettervalidering

Etter AI-kall skal applikasjonen kontrollere:

- at schema er gyldig
- at ID-er finnes
- at refererte krav finnes
- at evidens er tilgjengelig for rett bruker
- at claim status tillater bruk
- at tekst ikke introduserer udokumenterte kvalifikasjoner
- at endringen tilhører rett CV-seksjon
- at referert CV-revisjon fortsatt er gjeldende

Bruk kodebasert kontroll der det er mulig.

Faktapåstander som krever semantisk vurdering skal kontrolleres mot evidens og flagges for bruker når verifikasjon ikke kan gjennomføres pålitelig.

Gyldig JSON er ikke ensbetydende med riktig innhold.

## 5.3 Prompt-injeksjon og kildegrenser

Stillingsannonser, CV-er, attester og opplastede dokumenter er data, ikke systeminstruksjoner.

AI skal ikke følge instrukser som finnes inne i dokumentene dersom disse forsøker å overstyre Career Agents regler.

Hold systeminstruksjoner, kandidatdata og eksterne kildetekster logisk adskilt.

Alle oppgaver må respektere datatilgang og brukerens dokumenteierskap.

## 5.4 Token-effektivitet

Ikke send hele kandidatens historikk til alle AI-kall.

Bruk:

- relevant JobRequirement
- tilhørende CandidateClaims
- nødvendige EvidenceSnippets
- aktuell CV-seksjon
- relevant mal- og stilkontekst

For helhetlige kontroller kan flere seksjoner være nødvendige, men unngå å repetere hele dokumentarkivet.

Bruk resultatene fra tidligere analyser i stedet for å utføre samme kostbare ekstraksjon på nytt.

## 5.5 AI Usage og observability

Spor:

- taskType
- promptVersion
- provider
- model
- request/run ID
- latency
- inputTokens
- outputTokens
- retryCount
- fallbackUsed
- validationResult
- failureCategory

Ikke logg fullstendige CV-er, private dokumenter eller hemmelige nøkler.

---

# DEL 6 – CV WORKSPACE OG BRUKERGODKJENNING

## 6.1 Seksjonsvis endringsvisning

Brukeren skal kunne åpne en Tailoring Session og se:

- hvilken stilling CV-en tilpasses
- hvilken master-CV som brukes
- hva analysen identifiserte
- hvilke seksjoner som bør endres
- hvilke forslag som venter på godkjenning
- dokumentets fremdrift

For hvert forslag:

CURRENT TEXT
PROPOSED TEXT
WHY
SUPPORTED BY
APPROVE / EDIT / REJECT

En seksjon som ikke trenger endringer skal kunne merkes KEEP_UNCHANGED.

Ikke tving brukeren til å lese hele endringslisten som AI-chat.

## 6.2 CVChangeSet

Undersøk om eksisterende CV-modeller kan utvides med:

- CvTailoringSession
- CvSectionSnapshot
- CvVisibilityAssessment
- CvChangeSet
- CvChange
- CvChangeReview
- CvQualityReview
- CvQualityFinding

Disse er konseptuelle modeller.

Ikke opprett unødvendig mange tabeller dersom eksisterende strukturer allerede dekker behovet.

Hver endring bør kunne knyttes til:

- originaltekst
- foreslått tekst
- jobbkrav
- evidens
- seksjon
- CV-versjon
- godkjenningsstatus

## 6.3 Godkjenningsregler

Brukeren skal kunne:

- godkjenne ett forslag
- redigere ett forslag
- avvise ett forslag
- godkjenne flere forslag
- gå tilbake til en tidligere seksjon
- sammenligne før og etter
- se kildegrunnlaget

Avviste forslag skal ikke brukes ved dokumentgenerering.

Brukerredigerte forslag skal gjennom nødvendig faktakontroll før de inngår i en godkjent CV-versjon.

## 6.4 Revisjon og samtidige endringer

Dersom master-CV eller Career Knowledge Base endres mens en Tailoring Session pågår, må systemet kunne oppdage foreldede forslag.

Ikke overskriv nyere brukerdata med gamle AI-forslag.

Tilby kontrollert reanalyse ved vesentlige endringer.

---

# DEL 7 – DOCX, PDF OG EKSTERN REDIGERING

## 7.1 Master-CV

Bruk kandidatens godkjente CV-mal.

For pilotbrukeren benyttes Falck-malen som standard.

Dette er brukerpreferanse, ikke en universell mal for alle Career Agent-brukere.

Master-CV skal ikke overskrives av målrettede endringer.

## 7.2 Dokumentversjonering

Bruk:

Master CV
→ Approved Changes
→ Targeted CV Version
→ DOCX
→ PDF

Knytt nye CV-versjoner til:

- kandidat
- stilling
- endringssett
- godkjenning
- opprettelsestidspunkt
- søknad dersom relevant

Behold tidligere innsendte dokumenter som historiske snapshots.

## 7.3 Bevar malens layout

Undersøk hvordan eksisterende DOCX/PDF-generator fungerer.

Vurder:

- overskriftsstiler
- tabeller og bokser
- marger
- typografi
- linjeavstand
- sideskift
- punktlister
- leserekkefølge
- metadata

Hvis PDF-malen ikke kan redigeres direkte uten tap av struktur, etabler en godkjent redigerbar dokumentmal.

Ikke påstå at generert dokument følger originalmalen dersom dette ikke er validert.

## 7.4 Ekstern Word-redigering

Brukeren skal fortsatt kunne:

- laste ned DOCX
- redigere i Word
- laste opp revidert DOCX/PDF
- be Career Agent kontrollere resultatet

Dette er viktig.

Career Agent skal ikke låse brukeren til én bestemt redigeringsmåte.

En eksternt revidert fil må behandles som en egen dokumentrevisjon og gjennomgå faktisk kvalitetskontroll.

---

# DEL 8 – UAVHENGIG SLUTTKONTROLL

## 8.1 Sluttkontroll av faktisk dokument

Etter generering eller opplasting skal systemet analysere det ferdige dokumentet.

Kontrollen skal ikke bare evaluere tekstforslagene som tidligere ble godkjent.

Den skal undersøke den faktiske DOCX/PDF-filen.

## 8.2 Faglig kvalitet

Kontroller:

- relevans mot stillingen
- synlighet for viktige kvalifikasjoner
- samsvar mellom profil og arbeidserfaring
- korrekt prioritering
- konkrete erfaringsbeskrivelser
- konsistens mellom seksjoner

## 8.3 ATS og dokumentstruktur

Kontroller:

- søkbar tekst
- leserekkefølge
- overskrifter
- rolle/dato/arbeidsgiver-relasjoner
- punktlister
- kompetansebokser
- viktig terminologi
- eventuelt bortfalt innhold

Kontroller PDF og DOCX separat.

Rapporter usikkerhet der faktisk ATS-kompatibilitet ikke kan garanteres.

## 8.4 Recruiter First-Scan

Bruk en 7–10 sekunders scan som kvalitetsheuristikk.

Vurder om CV-en raskt viser:

- hvem kandidaten er faglig
- hvilken rolle kandidaten passer
- relevant erfaring
- viktig kompetanse
- senioritet der det er relevant

En CV som er svært komprimert, men vanskelig å skanne, skal ikke automatisk vurderes som god.

## 8.5 Kronologi

Oppdag:

- overlappende arbeidsforhold
- parallelle oppdrag
- manglende eller inkonsistente datoer
- mulig forveksling mellom kunde og arbeidsgiver

Parallelle engasjementer skal ikke regnes som feil når de er korrekt forklart.

## 8.6 Kvalitetsfunn

Hvert funn bør ha:

- findingId
- severity
- category
- section
- description
- supportingEvidence
- suggestedCorrection
- validationMethod
- resolvedStatus

Skill mellom:

CRITICAL
MAJOR
MINOR
SUGGESTION

Ikke marker CV_READY dersom kritiske faktafeil eller dokumentfeil fortsatt er åpne.

Definer eksplisitt hvilke avvik som blokkerer ferdigstillelse, og hvilke som kan aksepteres etter informert brukergodkjenning.

## 8.7 Visual Quality Review

Undersøk også hvordan dokumentet faktisk ser ut, der teknisk mulig:

- overfylte seksjoner
- tekst som går utenfor marger
- uheldige sideskift
- brutt tabell- eller boksstruktur
- skriftstørrelse
- kontrast
- spacing
- visuell hierarki

En PDF kan være teknisk søkbar og likevel ha dårlig layout.

Dokumentkontrollen må derfor skille mellom maskinell lesbarhet, semantisk kvalitet og visuell kvalitet.

---

# DEL 9 – AI VS. DETERMINISTISK KODE

Bruk riktig type behandling for hver oppgave.

| Oppgave | Primær mekanisme |
|---|---|
| Hente jobbannonse | Kode/integrasjon |
| Trekke ut jobbkrav | AI + kildevalidering |
| Søke Career Knowledge Base | Kontrollert database/retrieval, eventuelt AI-støttet |
| Sammenligne kompetanse | AI + domeneregler |
| Bekrefte kompetanse | Bruker + domenelogikk |
| Identifisere visibility gaps | AI + strukturert CV-data |
| Planlegge CV-tilpasning | AI |
| Skrive tekstforslag | AI |
| Validere evidens-ID-er | Kode |
| Godkjenne endringer | Bruker |
| Opprette CV-versjon | Kode |
| Generere DOCX/PDF | Dokumentgenerator |
| Kontrollere tekstuttrekk | Kode |
| Vurdere faglig CV-kvalitet | AI + evidensvalidering |
| Kontrollere layout | Dokumentanalyse/rendering |
| Markere CV klar | Domeneregler + brukergodkjenning |

Unngå å bruke AI til oppgaver som kan løses mer presist og rimeligere med deterministisk kode.

---

# DEL 10 – TESTER

Implementer tester for kritiske regler og arbeidsflyter.

Som minimum:

1. Stillingskrav kan ikke matche ubekreftede påstander som bekreftet kompetanse.
2. Bekreftet kompetanse som ikke er synlig i CV-en identifiseres som visibility gap.
3. Alle eksisterende relevante CV-seksjoner blir vurdert.
4. Alle tre profilavsnitt vurderes i pilot-malen.
5. Alle seks kjernekompetansebokser vurderes samlet i pilot-malen.
6. Systemet kan anbefale KEEP_UNCHANGED.
7. Forslag inneholder gyldige kilder og evidens-ID-er.
8. Brukeren kan godkjenne, redigere eller avvise hvert forslag.
9. Avviste forslag brukes ikke.
10. Gamle CV-versjoner overskrives ikke.
11. Nye dokumenter knyttes til korrekt stilling.
12. Eksternt redigerte dokumenter kontrolleres på nytt.
13. Feil i DOCX/PDF-tekstuttrekk flagges.
14. Ubekreftede opplysninger som introduseres i tekst, flagges.
15. AI-schemafeil håndteres.
16. Groq/Gemini-fallback bevarer oppgavekontrakter og faktakrav.
17. Flere brukere kan ikke se hverandres dokumenter, forslag eller CV-versjoner.
18. Foreldede forslag kan ikke overskrive nyere brukerendringer.

Bruk syntetiske testdata og mockede AI-svar i ordinær CI.

For kvalitetstesting av faktisk AI-adferd, etabler et separat kontrollert evalueringssett med autoriserte, anonymiserte eller syntetiske dokumenter.

Mål både:

- korrekt kravdekning
- korrekt kompetansekobling
- feilaktige påstander
- kvalitet på synlighetsvurderinger
- presisjon i tekstforslag
- dokumentkvalitet

En bestått schema-test er ikke tilstrekkelig dokumentasjon på god AI-kvalitet.

---

# DEL 11 – IMPLEMENTERINGSSTRATEGI

## Før kodeendringer

1. Undersøk repositoryet.
2. Les faktisk implementasjon.
3. Finn eksisterende relevante modeller og tjenester.
4. Identifiser uferdige endringer.
5. Lag gap-analyse.
6. Foreslå domenemodell.
7. Foreslå AI execution flow.
8. Foreslå UX.
9. Foreslå dokumentstrategi.
10. Lag inkrementell implementeringsplan.

Vent på godkjenning før større implementasjonsarbeid.

## Anbefalte milestones

### M1 – Architecture & Gap Analysis

Dokumenter hva som finnes, hva som mangler og hvordan det bør videreutvikles.

### M2 – Structured CV Sections

Representer CV-seksjoner på en måte som støtter endringsforslag og versjonering.

### M3 – AI Visibility Assessment

Identifiser kompetanse som er bekreftet, men dårlig synlig.

### M4 – AI Tailoring Strategy

Prioriter hvilke CV-seksjoner og erfaringer som bør endres.

### M5 – Section-Specific AI Generation

Implementer tekstforslag til headline, profil, kompetanse, erfaring og tilleggsopplysninger.

### M6 – CVChangeSet & Review UI

Gi brukeren kontroll over hvert forslag.

### M7 – Versioned Document Generation

Produser godkjente DOCX/PDF-dokumenter fra riktig mal.

### M8 – Independent Final CV Review

Kontroller faktisk dokumentinnhold, ATS, layout og faglig kvalitet.

### M9 – Application Workflow Integration

Bruk ferdig godkjent CV som grunnlag for neste steg i søknadsprosessen.

Disse milestones skal justeres etter faktisk status i repositoryet.

Ikke bygg funksjoner som allerede finnes på nytt.

---

# DEL 12 – FORVENTET SVAR FRA CODEX

Før du begynner å implementere, lever:

## A. Current Implementation Audit

Hvilke deler finnes allerede?

Skill mellom:

IMPLEMENTED
PARTIALLY_IMPLEMENTED
NOT_IMPLEMENTED
NEEDS_REFACTORING

## B. Workflow Gap Analysis

Hvilke mangler må løses for å støtte hele brukerflyten?

## C. Proposed Domain Model

Hvilke modeller skal gjenbrukes, utvides eller opprettes?

## D. AI Execution Architecture

Vis hele kjeden av AI-oppgaver.

For hver oppgave:

- trigger
- input
- output
- system instructions
- output schema
- validation
- failure handling
- persistence
- dependencies

## E. UX Proposal

Beskriv hvordan CV Workspace skal fungere.

Vis spesielt:

- seksjonsnavigasjon
- OLD → NEW
- begrunnelse
- evidens
- approve/edit/reject
- status og fremdrift
- forhåndsvisning
- eksport
- sluttkontroll

## F. Document Strategy

Hvordan håndterer vi:

- master-CV
- DOCX-mal
- seksjonsendringer
- versjonering
- PDF-eksport
- ekstern Word-redigering
- dokumentvalidering?

## G. Quality Strategy

Hvordan kan vi sikre at AI faktisk produserer bedre CV-er og ikke bare gyldig JSON?

Foreslå evalueringskriterier og tester.

## H. Implementation Plan

Lag en prioritert plan med:

- oppgave
- formål
- eksisterende avhengigheter
- berørte moduler
- risiko
- teststrategi
- Definition of Done

## I. Open Questions

List bare beslutninger som må avklares med produkteier.

## J. Final Recommendation

Gi din anbefaling som senior arkitekt om hva vi bør implementere først, med begrunnelse.

Ikke endre kode, opprette commits eller merges i denne gjennomgangen.

---

# ENDELIG PRODUKTPRINSIPP

Career Agent skal ikke bare produsere en penere CV.

Career Agent skal forstå:

- hva arbeidsgiveren trenger
- hva kandidaten faktisk kan
- hvor kompetansen ble demonstrert
- hvordan erfaringen er dokumentert
- hvor godt erfaringen matcher stillingen
- hva som bør synliggjøres tydeligere
- hvilke konkrete formuleringer som forbedrer CV-en
- hvordan den ferdige CV-en skal kontrolleres

Alle viktige endringer skal kunne forklares og forsvares.

Brukeren skal alltid ha kontroll over endringene.

Den ferdige CV-en skal kontrolleres som et faktisk dokument, ikke bare som AI-generert tekst.

Målet er å automatisere vår dokumenterte manuelle arbeidsmetode med samme faglige kvalitet, bedre konsistens, bedre brukeropplevelse og høyere effektivitet – for kandidater i alle yrker og bransjer.