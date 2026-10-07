# Domenemodell

Status: The broader model remains a design. Identity/basic profile are merged; this branch implements owned competency claims/revisions and source documents. Normalized Employment, Project, Skill taxonomy, applications and personal matching remain future work.

## Eierskap

En personlig konto eier kandidatgrunnlag, dokumenter, analyser og søknader. Profil er adskilt fra innloggingsidentitet. Organisasjonsmedlemskap og rådgivertilgang innføres senere; ikke anta at medlemskap gir tilgang til kandidatdata.

## Kandidatgrunnlag

| Begrep | Betydning |
| --- | --- |
| CareerProfile | Kandidatens profil og profilinnstillinger |
| Employment | Arbeidsforhold, arbeidsgiver, formell tittel og periode |
| Project | Leveranse eller prosjekt, med eventuell kunde |
| ProjectParticipation | Kandidatens rolle, ansvar og periode i prosjektet |
| Skill | Normalisert kompetansebegrep med språkvarianter; ikke en personlig erfaring i seg selv |
| CompetencyClaim | Konkret påstand om handling, erfaring eller ansvar med kontekst |
| ClaimRevision | Historisk utgave av påstanden og dens status |
| Source | Opphav, eksempelvis dokument eller brukeropplysning |
| Evidence | Avgrenset kildeutdrag eller registrert bekreftelse |
| ClaimEvidenceLink | Kobler claim-revisjon til støtte eller motstridende kilde |
| ClarificationQuestion | Åpen avklaring med begrunnelse, svar og kobling til hypotesen |
| CareerPreference | Brukerens uttrykte ønsker og begrensninger, med tidspunkt |

En claim kan eksempelvis beskrive «Implementerte håndtering av betalingshendelser i prosjekt A». Bruk fiktive eksempler i Git. Bevar forskjellen mellom kandidatens bidrag og teamets samlede resultat.

## Claim-livssyklus og regler

- Dokumentekstraksjon gir UNVERIFIED; resonnement gir INFERRED.
- Brukeren kan bekrefte konkret innhold, korrigere det eller avvise det.
- Redigering av meningsinnholdet skaper ny revisjon som må bekreftes. Ren presentasjonsendring må ikke oppgradere ansvar eller omfang.
- REJECTED er en avvist påstand/hypotese, ikke generell mangel på ferdighet.
- CONFIRMED registrerer hvem som bekreftet, tidspunkt og grunnlag. Det er ikke automatisk uavhengig sertifisert kompetanse.
- Konfidens for modelloppgaver er separat fra status og brukes ikke som sannsynlighet for sann erfaring.
- Konflikter avklares; nyere dokumenter overskriver ikke automatisk bekreftede fakta.

## Stillinger og analyse

JobPosting har kildereferanser. JobPostingSnapshot inneholder det annonsesettet som ble brukt. JobRequirement representerer et konkret krav med kildeutdrag og type: nødvendig, ønsket eller uavklart.

JobAnalysis binder annonse- og kunnskapsversjon til RequirementAssessment. Vurderingen inneholder klassifisering, begrunnelse og claim-referanser. Kunnskapsendring gjør analysen utdatert, men sletter ikke tidligere vurdering.

Foreslåtte vurderingskategorier: dokumentert relevant, indirekte relevant, må avklares, bekreftet manglende erfaring og uavklart/ikke relevant. En ferdighet uten kildegrunnlag er ikke dokumentert erfaring.

## Søknad og artefakter

- Application er søknadssaken med stillingsreferanse, status og notater.
- ContentProposal er et forslag med gammel/ny tekst og grunnlag.
- ContentRevision er en bestemt tekstutgave med språk og claim-referanser.
- Approval gjelder en bestemt revisjon; endret innhold krever ny godkjenning.
- CVVersion kobler innhold, malversjon og genererte dokumentartefakter.
- ApplicationSubmission registrerer dato, kilde til innsending og faktiske artefaktreferanser.
- ApplicationStatusTransition registrerer statusendringen; APPLIED krever registrert innsending, ikke bare nedlasting.

En eksternt endret CV må registreres som egen filversjon hvis systemet skal vite eksakt hva som ble sendt. Hvis dette ikke gjøres, må usikkerheten vises.

## Teknisk prosesstilstand

BackgroundJob har tilstand, antall forsøk, lease og feilklassifisering. AiRun registrerer en bestemt oppgave og inputreferanser. Disse er tekniske prosessbegreper og skal ikke bli kandidatens erfaringspåstander.

## Transient imported advertisement

`ImportedJob` currently carries a canonical `sourceUrl`, source-provided `title`, normalized `text` and server `retrievedAt`. It is not a persisted job aggregate or candidate claim. Analysis retains the exact submitted text and its language; edits make the displayed result stale. Persisted advertisement identity/versioning will be a separate later change.

## Source provenance extension

`ImportedJob.sourceType` distinguishes `NAV_API` from `GROQ_BROWSER_EXCERPT`. FINN's retrievedAt records local receipt of the provider excerpt, not an independently observed source update/fetch time. Quotes prove literal presence in the submitted text, not source freshness, completeness or independent semantic correctness. Imported material does not become a confirmed candidate claim.

## Implemented storage foundation

`app_user` contains an internal UUID and a unique `(oidc_issuer, oidc_subject)` binding. `career_profile` belongs to exactly one user and stores display name, nb/en language, revision and timestamps. OIDC verifies identity for the optional basic profile API/UI. Creation submits revision 0; the first saved revision is 1, and successful updates increment it. Stale revisions fail without changing stored content. The internal user binding is created transactionally on explicit save, not by accepting an email or browser owner ID. Claims/evidence/project models remain planned rather than implied by these two tables.


## Implemented competency and document subset

CompetencyClaim stores a skill label, own-contribution statement, prose project/employment context, source note, status and optimistic revision. CompetencyClaimRevision stores a full snapshot/action/owner/timestamp. Manual and document-selected claims start UNVERIFIED; explicit owner confirmation/rejection records a revision, and content editing resets confirmation. INFERRED has no creation path yet. A self-confirmation is not external certification.

CareerDocument holds owner, original filename/media type/size/hash, declared nb/en language, original storage object, extracted text and master selection. Claim sourceDocumentId/sourceQuote bind a user-selected exact excerpt to an owned document. Confirmation does not prove that a source semantically supports every claim; the user reviews their own contribution. Deleting a document detaches references while retaining created claim/source-quote history; deleting the claim removes all its revisions. Details and limits are in [CV_IMPORT.md](docs/CV_IMPORT.md) and ADR 0014/0015.
