# Brukerflyter

## Saved-job overview refresh — 2026-10-12

Search saved roles/employers/locations and sort by newest, oldest or title. Cards explicitly identify browser excerpts from either provider, missing employer/location/deadline data, saved date and criterion count. A single visible result uses the available desktop width; multiple results form a responsive grid.

The saved assessment panel distinguishes no assessment, current saved coverage, provisional coverage, changed-profile assessment and retrieval failure. Display the existing weighted requirement score, recorded provider/model and explanatory tooltip; opening a card initiates no AI analysis. Open job continues existing match/clarification controls. Apply opens the existing preparation page and does not submit an application externally.


Status: The complete future flows below remain a design. The merged local pilot supports public URL/text analysis and optional authenticated profile/documents, saved jobs, approved matching, reviewed CV export and manual application tracking. The maintenance slice retains valid cited items when other AI fields fail and preserves long quota waits. Story IDs refer to [USER_STORIES.md](USER_STORIES.md).

Maintenance recovery: source retrieved → analyze once → retain valid cited items and report omissions. If the whole response is unusable or quota is reached, keep the source reader and any previous valid result. A quota response establishes a shared backend cooldown; proxies/UI preserve the duration and no automatic retry occurs. Existing saved analyses can be reopened without another provider call. A new manual attempt after the wait may still exceed the provider quota.

## 1. Fra første besøk til søknad

```mermaid
flowchart TD
    A[Åpne applikasjonen] --> B[Velg språk: norsk er standard]
    B --> C[Åpne egen profil med riktig tilgang]
    C --> D{Har du kandidatgrunnlag?}
    D -->|Nei| E[Registrer erfaring eller importer master-CV]
    E --> F[Se kilde og gjennomgå påstander]
    F --> G[Bekreft, rediger eller avvis]
    G --> H[Lagre kandidatgrunnlag]
    D -->|Ja| I[Legg til stilling]
    H --> I
    I --> J[Lim inn tekst eller bruk støttet URL]
    J --> K[Kontroller hentet annonse]
    K --> L[Vurder krav mot kandidatgrunnlag]
    L --> M[Se treff, usikkerhet og begrunnelser]
    M --> N{Relevant avklaring?}
    N -->|Ja| O[Svar, korriger, vet ikke eller utsett]
    O --> P[Oppdater godkjent kunnskap]
    P --> L
    N -->|Nei eller utsett| Q{Vil du gå videre?}
    Q -->|Nei| R[Lagre for senere eller marker uinteressant]
    Q -->|Ja| S[Velg dokumentspråk og lag utkast]
    S --> T[Se endringsforslag og kildegrunnlag]
    T --> U[Rediger og godkjenn konkret innholdsversjon]
    U --> V[Generer DOCX og PDF fra støttet mal]
    V --> W[Last ned og send selv i portalen]
    W --> X[Bekreft innsending og dokumentene som faktisk ble brukt]
    X --> Y[Følg status, noter svar og neste handling]
```

Story-dekning: US-01 til US-14. Tilgangsmodellen for den lokale piloten er uavklart; en flerbrukerversjon krever verifisert innlogging og isolasjon.

## 2. Fra dokument til godkjent påstand

```mermaid
flowchart TD
    A[Last opp DOCX eller PDF] --> B{Gyldig og støttet fil?}
    B -->|Nei| C[Vis årsak og tilby manuell registrering]
    B -->|Ja| D[Bevar original og ekstraher innhold]
    D --> E{Ekstraksjon lyktes?}
    E -->|Nei| F[Vis feil og tilby retry eller manuell registrering]
    E -->|Ja| G[Opprett UNVERIFIED påstander med kildereferanser]
    G --> H[Vis konkrete påstander til brukeren]
    H --> I{Brukerens valg}
    I -->|Bekreft| J[Lagre CONFIRMED med bekreftelseshistorikk]
    I -->|Rediger| K[Vis korrigert påstand for bekreftelse]
    K --> H
    I -->|Avvis| L[Lagre REJECTED]
    I -->|Senere| M[Behold UNVERIFIED]
    J --> N[Marker berørte analyser som utdaterte]
```

En brukerbekreftelse er ikke det samme som ekstern dokumentasjon. Kildetype og bekreftelse må vises separat. Avvisning betyr ikke automatisk at kandidaten mangler ferdigheten.

## 3. Kompetanseavklaring

```mermaid
flowchart TD
    A[Krav uten tilstrekkelig dokumentasjon] --> B{Finnes nærliggende erfaring?}
    B -->|Ja| C[Vis INFERRED hypotese og et åpent spørsmål]
    B -->|Nei| D[Vis at erfaring ikke er dokumentert]
    C --> E{Brukerens svar}
    E -->|Beskriver erfaring| F[Vis presis påstand med prosjekt og ansvar]
    F --> G[Brukeren bekrefter eller korrigerer]
    G --> H[Oppdater kunnskapsversjon]
    H --> I[Kjør eller tilby ny analyse]
    E -->|Avviser hypotesen| J[Registrer avvisning uten bredere konklusjon]
    E -->|Vet ikke eller senere| K[Behold usikkerhet og tillat videre arbeid]
```

Brukeren skal kunne vende tilbake til ubesvarte spørsmål. En uavklart hypotese kan ikke brukes som bekreftet erfaring i eksportert materiale.

## 4. Godkjenning og faktisk innsending

```mermaid
flowchart TD
    A[CV- eller tekstforslag] --> B[Vis gammel og ny tekst med grunnlag]
    B --> C{Valg}
    C -->|Avvis| D[Behold tidligere tekst]
    C -->|Rediger| E[Valider korrigert tekst]
    E --> B
    C -->|Godkjenn| F[Bind godkjenning til innholdsversjon]
    F --> G[Generer dokumentartefakter]
    G --> H{Generering lyktes?}
    H -->|Nei| I[Behold godkjenning og vis retry]
    H -->|Ja| J[Last ned konkrete versjoner]
    J --> K[Brukeren sender utenfor applikasjonen]
    K --> L[Bekreft dato og faktisk brukte artefakter]
    L --> M[Status APPLIED med kilde: brukerbekreftelse]
```

Generering eller nedlasting betyr ikke innsending. Hvis brukeren endrer dokumentet eksternt, må løsningen støtte å registrere den endelige filen; ellers merkes eksakt innsendt versjon som ukjent.

## Feil, avbrudd og retur

| Situasjon | Ønsket brukeropplevelse |
| --- | --- |
| URL-henting feiler | Behold URL og tilby innlimt annonsetekst. |
| AI utilgjengelig eller budsjettgrense nådd | Behold brukerdata og tilby senere retry; manuell profil/CRM fungerer videre. |
| Utdrag er feil eller kilder motsier hverandre | Vis avklaring; ikke overskriv bekreftet kunnskap automatisk. |
| Brukeren lukker siden | Lagrede utkast og spørsmål kan gjenopptas; vis hva som eventuelt ikke ble lagret. |
| Kandidatgrunnlag endres | Marker analysen som utdatert; behold tidligere analysehistorikk. |
| Annonse endres eller fjernes | Behold snapshot brukt i analysen og vis kilde/tidspunkt. |
| Godkjent tekst redigeres | Ny innholdsversjon krever ny godkjenning. |
| Dokumentgenerering feiler | Ingen ferdigstatus; bevar utkast og tilby retry. |

## Fremtidig flyt, utenfor MVP

Automatisk discovery fører inn i «Legg til stilling». Browser-assistent kan senere erstatte den manuelle portalhandlingen, men må vise endelig innhold og dokumenter før eksplisitt godkjenning av innsending. Intervju og oppfølging bygger på søknadssaken og det faktisk sendte materialet.

## Implemented pilot flow: URL review and requirement extraction

```mermaid
flowchart TD
    A[Open job analysis: Norwegian or English] --> B{Input method}
    B -->|Arbeidsplassen URL| C[Validate URL and request official NAV API]
    C -->|Active supported advertisement| D[Show title, source link, retrieval time and editable text]
    C -->|Unsupported, absent, inactive or unavailable| E[Keep URL and offer Paste text]
    E --> F[Paste advertisement text]
    B -->|Paste text| F
    D --> G[User reviews text]
    F --> G
    G --> H[User selects Analyze]
    H --> I[Bounded Groq extraction]
    I --> J[Show employer, role and practical advertisement overview]
    J --> K[Review required, preferred and unclear requirements with quotes]
    K --> L[Inspect source evidence]
    J -->|Edit source text| M[Mark result outdated]
```

The result places the employer/role overview, applicant profile, offered benefits and practical details (location, contact and deadline) before requirement cards. Literal labeled practical fields may fill an otherwise missing extracted fact; other unknowns remain explicit. Applicant and offer excerpts have compact previews with scrollable source readers. Full source wording is expandable and stays distinct from AI-extracted requirements. If source-backed suggestions were omitted, the user sees the count and can inspect the received text, add a manually labeled detail with a verbatim source quote, and remove it again. Manual details stay in the current page session and are persisted only when the user explicitly saves the job snapshot; they never create another AI call or alter the omitted count. Retrieval and requirement analysis have separate model choices and approval fingerprints. NAV URL import makes no AI call. FINN retrieval offers Groq 20B/120B Browser Search and Gemini 3.5/3.1 Flash-Lite or 3.5/3.6/3.7/3.8 Flash URL Context. Generation routes require same-candidate successful exact-URL tool metadata and STOP text; the existing 3.8 Interactions route also requires an exact-URL output citation. All remain labeled AI-prepared excerpts. Changing a model sends no request and leaves the requirement-analysis choice independent. A configured key enables a menu choice; it does not guarantee live capacity or quota. Missing/mismatched evidence remains `SOURCE_NOT_AVAILABLE`; there is no automatic provider switch. The pilot does not save input or results across reload unless the user saves a job snapshot. API-returned application links are not fetched. The current interface does not offer automated submission or personal match scores.

## FINN source branch

```mermaid
flowchart TD
    A[Paste modern FINN job URL] --> B[Validate and canonicalize exact advertisement link]
    B --> C{Selected retrieval plan}
    C -->|Groq| D[Bounded Groq Browser Search]
    C -->|Gemini| E[Selected Flash or Lite URL Context]
    D --> F{Exact browser.open source result available?}
    E --> G{Completed text and exact-URL tool proof?}
    F -->|No| H[Keep URL, explain error and offer pasted text]
    G -->|No| H
    F -->|Yes| I[Retain excerpt and show retrieval complete]
    G -->|Yes| I
    I --> J{Groq retrieval and Groq analysis?}
    J -->|Yes| K[Show configurable pause countdown]
    J -->|No| L[Continue without Groq-to-Groq pause]
    K --> M{Stopped before analysis?}
    L --> M
    M -->|Yes| N[Keep source for manual continuation]
    M -->|No| O[Analyze using separately selected model and approval]
    O --> P[Keep source type, excerpt label and exact link visible]
```

The excerpt is provider-mediated source context, not the model's generated summary, a complete advertisement guarantee, or independently verified live source data. A citation check establishes URL attribution, not semantic completeness or correctness. The website's update time and ad's active status are not established by a successful provider read.

## Compact requirement inspection (implemented, PR merge pending)

Analyze source → view category counts and grouped tiles → optionally filter category → select a requirement → shadcn Dialog with original quote, category guidance and surrounding submitted-source context → close/Escape and return focus to the selected tile. Editing input retains the existing stale-result warning. Browser-excerpt provenance also appears in details. Inspecting/filtering creates no additional provider request.

## Direct URL analysis and sourced job overview (2026-10-07)

Selecting **Analyze link** retrieves and analyzes the public advertisement in one action. FINN retrieval is followed by a configurable 10-second pause before structured analysis; NAV normally skips it. The previous mandatory import/review step is superseded by the product owner's explicit instruction. Manual pasted text remains editable. Retrieval and analysis each keep their existing concurrency, quota, validation and error boundaries; there are no automatic retries. If analysis fails after retrieval, the text remains available for retry without another search.

The overview contains up to ten useful, variable facts: employer description, role/responsibilities, deadline, location/work model, contacts, benefits, salary or application process when explicitly present. Every fact carries a verbatim source quote. Missing data is omitted with an explicit notice rather than guessed. Quote membership validation establishes provenance, not semantic correctness of the AI's paraphrase. Browser excerpts can still be partial/stale; this limitation and the original link remain visible. Full source text is expandable, not a required intermediate screen. Requirement tiles/details remain unchanged.

No candidate matching, private profile storage or company research is implied by this overview. All extracted facts are AI suggestions from the advertisement. Existing source quotes and optional source review remain available; older mandatory review instructions do not apply to this flow.

## Client initialization boundary

Initial server-rendered analysis controls are disabled until React initializes. Then mode selection and URL/text submission are enabled. Submissions run through TanStack mutations and prevent native document navigation. Failed retrieval/analysis keeps input and displays a mapped error. No advertisement, profile or API key is persisted in browser storage by this change.

## Evidence failures and free-tier retries

A valid FINN browser excerpt may have a wrapped site title; presentation emphasis is normalized before analysis. Valid independently cited cards remain visible if another suggestion lacks source evidence, with a visible omission notice. Entirely unsupported or malformed results still fail closed.

After a provider token-rate rejection, show a bounded countdown and keep the URL/text. A manual retry for the same retrieved URL analyzes the current text without a new browser search. Different URLs fetch fresh content. No automatic retries are made; process call limits and exact-source checks remain. Switching input mode/reading/editing remain available during a reactive quota cooldown. Controls are disabled during the active retrieval/pacing/analysis sequence; the explicit Stop action is available during pacing.

## Development inspection and paced loading

Submit URL → retrieval status → received-source success → FINN pause/countdown (or skipped for NAV) → analysis status → sourced overview and compact requirement cards. Stopping during the pause retains the source and cancels the scheduled analysis; same-URL continuation respects any remaining pause. There is no invented progress percentage or model call for the decorative animation.

Development: open the DEV edge tab on job analysis, document analysis or CV preparation, or the inline DEV control inside an opened saved-job match panel → inspect labeled workflow status and safe counts → optionally start temporary AI content capture → expand the relevant workflow and numbered calls to inspect exact instructions, input, schema/tools and model responses. The saved-job and document overviews have no DEV panel; a match panel filters captured calls to its selected job ID, and document analysis filters to its active workflow ID. Other profile, dashboard, CV and application overview pages do not mount the panel. Content capture is opt-in, local-only and volatile; it stops after 30 minutes, retains at most 200 calls/12 million characters for 10 minutes, and offers explicit immediate clearing. Never expose the panel on a shared screen. Console events remain content-free; capture is hidden in production unless explicitly enabled before build. See docs/DEBUGGING.md.

## Task-specific model selection and document recovery

Every AI-call model selector lists the same eight provider/model choices: Groq GPT-OSS 20B/120B and Gemini Flash 3.5/3.6/3.7/3.8 and Flash-Lite 3.1/3.5. The backend routes each choice through the selected call's structured-generation or supported retrieval protocol. A full document run uses one explicitly approved provider/model plan for both document extraction and profile synthesis. A configured provider key means the option can be selected, not that the account currently has access, quota, availability or verified output quality. A model change invalidates approval for the affected private recipient/model; it does not automatically retry or bypass pacing/budgets.

If a document step fails, show the selected provider/model, the safe failure category/reason, whether completed progress and prior drafts were retained, any applicable cooldown, and only explicit supported recovery choices. Never show raw provider error payloads. The opt-in DEV panel distinguishes a successful model response from a later document-validation rejection and records only allowlisted outcome details alongside that workflow's captured call group.

## Implemented basic profile flow (US-28; current branch)

```mermaid
flowchart TD
  Open[Open Min profil] --> Config{Identity + persistence available?}
  Config -->|No| Disabled[Show unavailable; public analysis remains accessible]
  Config -->|Yes| Login[Sign in through local Keycloak / PKCE]
  Login -->|Rejected| Failed[Show mapped login failure]
  Login -->|Verified session| Read[Load own profile or empty form]
  Read --> Edit[Edit name + preferred language]
  Edit --> Save[Explicit save with CSRF + revision]
  Save -->|Success| Stored[Saved revision; reopen from PostgreSQL]
  Save -->|Stale revision| Conflict[Keep draft; offer loading saved version]
  Conflict -->|User chooses| Read
  Stored --> Logout[Sign out of application; invalidate session]
```

The form supports Norwegian/English. Ownership is never selected by the browser. Unauthenticated/expired sessions cannot read or write a profile. App restart requires sign-in again, while saved data remains. This initial flow covers the basic profile; reviewed claims and local CV import are added by the implemented flow below. Personal matching remains future work. Setup is in docs/IDENTITY_SETUP.md. Proposed full MVP flows above remain future work.


## Current branch: source overview, reviewed competencies and CV import

```mermaid
flowchart TD
    URL[Submit job URL] --> Fetch[Receive source excerpt]
    Fetch --> Analyze[Structured AI analysis]
    Analyze -->|Valid sourced items| Overview[Employer + collapsible role/applicant/offers]
    Analyze -->|AI failure| Raw[Display received advertisement with unstructured status]
    Overview --> Metadata[Location + contact + deadline + other facts]
    Metadata --> Requirements[Existing requirement filters and detail cards]
    Raw --> Retry[Manual analysis retry using the same source]
    SignIn[Sign in and save profile] --> Upload[Upload original DOCX/PDF locally]
    Upload --> Inspect[Inspect extracted text / select master CV]
    Inspect --> Select[Select exact source quote and describe own contribution]
    Select --> Unverified[Save UNVERIFIED claim]
    SignIn --> Manual[Enter manual competency and source/context]
    Manual --> Unverified
    Unverified --> Review[Inspect and explicitly confirm / reject]
    Review --> History[Store revision snapshot and action]
    History --> Edit[Edit content]
    Edit --> Unverified
```

Contact always has a slot, with an honest not-identified state when analysis does not supply it. A failed analysis never replaces available source text with an empty result screen. No private profile/CV material is sent to Groq. Source selection creates a proposal, not confirmed truth. Permanent document deletion explains retained claim quotes; permanent claim deletion removes its history. Login/session expiry, revision conflicts, malformed/oversized files, encrypted PDFs and empty/scanned text have visible states. See docs/CV_IMPORT.md for the bounded import scope.

## Implemented optional document AI flow (ADR 0016)

```mermaid
flowchart TD
    A[Sign in and upload CVs or competency documents] --> B[Extract text locally and retain originals]
    B --> C{Analyze one or all documents?}
    C --> D[Review editable excerpts and visible coverage]
    D --> E[Remove unnecessary private details and approve Groq submission]
    E --> F[One owned bounded structured AI call]
    F --> G{Schema and source quotes valid?}
    G -->|No| H[Keep preview and previous summary; manual retry]
    G -->|Yes| I[Store latest unverified summary and suggestions]
    I --> J[Inspect source filename and exact quote]
    J --> K[Choose suggestion; edit own contribution and context]
    K --> L[Explicitly save UNVERIFIED source-linked claim]
    L --> M[Separate confirmation or rejection]
    I --> N[Reopen without a model call]
```

Unreadable scans are visibly excluded; long documents share a bounded excerpt budget. Reanalysis does not change saved claims. A source upload/deletion clears the combined summary. No original binaries, filenames or other profile content enter the provider prompt; private source previews are not advertisement diagnostics.

## Competency workspace and document recovery (ADR 0017)

```mermaid
flowchart TD
    Profile[Saved profile] --> Dashboard[Search competencies / filter review status]
    Profile --> Library[Documents with readable-text counts]
    Library --> Review[Open right-side source review Sheet]
    Review --> Read{Need better text?}
    Read -->|DOCX or text PDF| Reread[Reread immutable original locally]
    Read -->|Textless PDF page| OCR[Explicit local OCR with limits]
    OCR -->|Unavailable or failed| Keep[Retain original and previous source; show recovery guidance]
    Reread --> Changed{Text changed?}
    OCR --> Changed
    Changed -->|Yes| Invalidate[Invalidate old analyses; preserve claims and originals]
    Changed -->|No| Retain[Retain existing analyses]
    Invalidate --> Preview[Review distributed source selection / focus a document]
    Retain --> Preview
    Preview --> Consent[Approve reviewed excerpts]
    Consent --> AI[One bounded AI call, up to twenty proposals]
    AI --> Source[Inspect actual source quote and edit proposal]
    Source --> Save[Explicit save as UNVERIFIED]
    Save --> Dashboard
```

Regular uploads do not invoke OCR or AI. OCR is optional and cannot promise complete reading of mixed text/image layouts. Distributed excerpts include later passages but remain limited; source selection and another approved call can target missing sections. Whitespace changes never authorize changed words. Saved claims remain separate from replaceable AI suggestion snapshots.

## Local job library and personal matching

```mermaid
flowchart TD
  Analysis[Received advertisement and analysis] --> Save[Sign in and save snapshot]
  Save --> Library[Search and reopen saved jobs]
  Library --> Preview[Select confirmed evidence and source excerpt]
  Preview --> Approve{Approve this Groq analysis}
  Approve -->|Yes| Match[One bounded requirement comparison]
  Approve -->|No| Library
  Match --> Review[Inspect reason, quotes and clarification]
  Match -->|Failure| Retain[Keep previous result and manual retry]
  Review --> Change[Profile evidence changes]
  Change --> Stale[Mark previous assessment stale]
  Review --> CV[Next: approve a CV version]
```


## Implemented local pilot entry and career history

```mermaid
flowchart TD
    A[Public landing] --> B[Dedicated sign-in]
    A --> G[Guest advertisement analysis]
    B --> C{Local identity and persistence ready?}
    C -->|No| D[Setup explanation and guest analysis]
    C -->|Yes| E[Existing OIDC and PKCE]
    E -->|Success| F[Owned workspace overview]
    E -->|Failure| B
    F --> H{Basic profile saved?}
    H -->|No| I[Save basic profile]
    H -->|Yes| J[Review actual counts and next action]
    J --> K[Competencies and source documents]
    J --> L[Saved advertisements and approved matching]
    K --> M[Career entry draft: UNVERIFIED]
    M --> N[Separate review of current revision]
    N --> O[CONFIRMED or REJECTED]
    O -->|Edit| M
    F --> P[CSRF sign-out and clear private caches]
    P --> B
```

The root page now explains the product; public analysis is `/jobs/analyze`. Configured anonymous visits to private work areas lead to `/login` before private components mount. Missing setup provides actionable guidance instead. The backend still enforces every private request. The overview makes no model call and cannot infer missing competencies from failed reads. CV versions/export and case tracking remain subsequent work.

## Reviewed local pilot application flow

```mermaid
flowchart TD
  A[Landing page] --> B[Dedicated sign-in]
  B --> C[Workspace overview]
  C --> D[Upload document and inspect local text]
  D --> E[Preview excerpts and approve optional AI call]
  E --> F[Source-backed proposals with company context]
  F --> G[Save selected proposals as unverified]
  G --> H[Review each point: confirm, reject or skip]
  H --> I[Analyze and save a job]
  I --> J[Optional approved personal matching]
  J --> K[Select confirmed experience for CV draft]
  K --> L[Preview and explicitly approve DOCX and PDF]
  L --> M[Create application case]
  M --> N[Submit externally yourself]
  N --> O[Confirm exact CV, date and text in archive]
  O --> P[Track interviews, notes and follow-up]
```

Provider failure keeps received advertisement/document text and any valid same-source result. Explicit headings and labelled practical fields can be organized locally, visibly labelled as such. All remaining text stays readable; missing facts are never invented.

## Actual document verification

```mermaid
flowchart TD
  A[Owned document workspace] --> B[Check documents: local only]
  B --> C[Original integrity and fresh text reading]
  B --> D[Stored AI quote checks]
  C --> E[Pass, review or missing state with explanation]
  D --> E
  E --> F[Open original and text]
  F --> G[Select reviewed full excerpt or smaller detail part]
  G --> H[Explicit consent for one AI selection call]
  H --> I[Literal proposals and context proof or unknown]
  I --> J[User edits and saves UNVERIFIED]
  J --> K[Separate confirmation of current revision]
```

Technical checks do not certify semantics or completeness. Provider failures keep previous usable results; no automatic call or confirmation follows the check.

## Whole-document profile flow (ADR 0024)

Upload and read locally → inspect full previews → approve selected documents once → automatic sequential sourced analysis → bounded candidate summary → inspect/edit profile, history and skill cards → save unverified or explicitly confirm reviewed experience. Paused runs retain previous drafts and need manual approved continuation. Document deletion/rereading invalidates affected progress. See [FULL_DOCUMENT_REVIEW.md](docs/FULL_DOCUMENT_REVIEW.md).

## Provider-aware document and matching review

Load the non-secret AI configuration (Gemini document/profile defaults: 3.5 Flash-Lite; job/match: 3.5 Flash, unless explicitly overridden) → show recipients and models beside the editable preview → obtain explicit approval → send the matching fingerprint → retain progress and source-backed drafts. A changed recipient/model requires a refreshed configuration and new approval/run; previous suggestions remain reviewable. Whole-document analysis also includes career-history sources in final synthesis and retains already sourced profile sections.

## Approved provider recovery — 2026-10-08

AI quota/failure → retain result and source → Try with alternate configured provider → update compact provider/model identity → clear private consent → review approved source selection → approve new recipient → continue unfinished document portion or retry matching/public extraction. No request runs merely because a provider is selected. Public extraction reuses received text. A changed document preview requires a new run or explicit restoration of saved text. FINN retrieval separately offers configured Groq Browser Search and Gemini URL Context plans; changing the source provider requires its own approval and never happens automatically.

## Profile population and compact review queue (ADR 0027)

Inspect complete document previews → choose automatic profile population → approve displayed AI recipients → sequential analysis saves literal documented competencies and unverified history. The newest saved synthesis appears in the profile. Explicit technology lists are checked locally for omitted labels without extra AI calls.

Open competencies → default pending queue with a count → approve directly, edit a prefilled draft, set aside as draft or reject → item leaves pending and appears in the corresponding counted view. Expand source evidence as needed. Reopen or analyze again → current saved decisions remain; edited/rejected/deleted information is not restored automatically. Processed analysis wording may differ from later profile edits; use the linked profile record for current content.

Open saved job → Vurder personlig match → relevant confirmed evidence is preselected within limits → optionally adjust → approve displayed recipient → AI comparison and documented coverage percentage with calculation. Clarify an unresolved criterion inline with your own experience → explicitly confirm and save to profile → reassess through fresh recipient approval. No automatic AI call follows clarification. Advertisement prose has bounded keyboard-accessible scrolling.


## One profile card per competency

Open **Your competencies** → one card per normalized skill across projects/documents → inspect the combined existing explanations, with confirmed evidence and drafts in separate sections → expand contributions for exact sources, editing and individual review/history/delete. Identical explanation text appears once in the summary with every context retained. Rejected contributions remain inspectable but do not enter the active summary. Search matches the skill group and retains its related contributions; status filters count distinct skills. Grouping makes no AI call and changes no claim status. Editing/review affects only the selected saved claim.

Manual review identity includes the original contribution description. Two contributions sharing a skill/context/quotation keep independent decisions. Exact historical owned source-linked reviews can reconnect without the new ledger; ambiguous old deletion links block recreation without hiding unrelated proposals.

## Document source coverage and follow-up

Approved new run with optional missed-passage check → primary extraction → local source inventory → at most four bounded follow-up steps → synthesis → compact coverage panel and editable/profile-backed findings. Setting changes clear consent. Each step saves progress; repeated requests do not repeat committed calls. Follow-up uses the selected recipient/model and does not double-count source text. Inspect remaining literal excerpts in a scrollable document-attributed reader. Legacy runs do not gain follow-up steps. A represented passage is source usage, not semantic completeness or factual confirmation (ADR 0028).

New document analysis → inspect competency context from the surrounding literal employer/project section, including nested technical subsections → global/same-level boundaries leave unrelated lists without a company → review history with normalized explicit month endpoints and the original period wording. Existing saved runs/entries are not retroactively rewritten.

## Competency career relationships (ADR 0029)

Approved document profile processing → create a relationship only when one untouched career entry has exact shared documentary proof → keep the career entry's draft status → open Work and projects on the competency contribution to inspect employer/project, period, client and source. Ambiguous evidence leaves the relationship unset.

Choose Link to work or a project → search existing history → choose an entry explicitly → record USER relationship basis without confirming factual content. Remove a relationship → hide it from the active overview → preserve the decision across new document processing. Editing either factual record marks mismatched relationships for review; confirmation-only revisions preserve matching content. Conflicts retain the displayed information and require reloading. Viewing and changing relationships are local operations without AI calls.

## Long skills sections across automatic portions

Approve a complete document as usual → portions are handled automatically → local list recovery retains preceding section state across a portion boundary → complete literal list rows are recovered once, with the same source employer/project rules → supported findings follow existing profile population/review. A global or education/interests boundary ends the previous list/context. No extra consent, user-managed splitting or AI call is introduced. The developer expected-fact benchmark remains outside the user-facing coverage panel.

## Complete profile matching — 2026-10-09

Open a saved job, inspect the compact recipient/model preview and approve one analysis. All confirmed competency contributions are included automatically, including documented imports; there is no skill checkbox selection or 30-item match cutoff. Expand evidence/ad readers when needed. A saved weighted coverage percentage appears in the assessment and on the job card. New confirmed evidence marks automatic assessments stale. Failures retain the previous result and require explicit approval before changing recipient/model.

## Compare career history and documentary periods

Open Work and education → expand career history → inspect counted possible period differences or choose Compare career entries → view two saved records and documentary quotations side by side (stacked on mobile). Sources load only when opened. Choose another entry to compare employer/client/role wording explicitly. An old ongoing CV and a newer end date are possible differences, not automatic errors. Closing changes nothing. Correct this entry opens the existing prefilled editor; saving resets confirmation and refreshes the derived comparison. Source failure leaves the other record and quotations visible; reopen to retry. Deleted originals keep their existing labelled quotations.

## Planned joined preparation journey (not implemented)

Sign in → upload a CV and optional project accounts/certificates → inspect document reading and generated profile → correct sourced knowledge → analyze/save an advertisement → approve automatic matching → clarify inline → choose Apply for this job from the saved card or match result → inspect readiness and choose the base CV → approve the displayed AI recipient/text → review visibility and section-specific changes → approve, edit or reject text proposals. Preserve the original and stop before creating a new tailored CV version.

Provide an optional skippable tutorial and short contextual guidance throughout. Missing evidence links directly to relevant upload/review actions; explain useful document contents and actually supported formats. A score is documented coverage, not hiring probability. Unresolved criteria/formal barriers remain visible; no arbitrary score gate, forced manual skill selection or automatic external submission. See the product standard for contract and quality rules.

## Job-specific CV wording preparation (current implementation)

1. Open **Apply for this job** on an owned saved card or personal match. The dedicated page retains the advertisement and shows experience/match/base-CV readiness.
2. If evidence is missing, follow the profile/upload guidance. DOCX/text PDF usually reads better than scans; TXT/Markdown remain supported. Documents should describe roles, employers, dates, contributions and documented results. The optional three-step guide can be closed.
3. Review or refresh the full-confirmed-profile match and clarify unknown experience inline. Its percentage measures supported requirement coverage, not hiring probability. Old manually selected or stale assessments cannot support new suggestions.
4. Choose an owned base document (master by default), inspect the full CV/ad/confirmed evidence preview and selected AI provider/model, then approve this specific request. Nothing is sent automatically on opening the page.
5. The AI proposes up to 12 changes across literal source passages. Review original/proposed wording, reason and references; edit, approve or reject. Processed proposals leave the pending list and remain in **Processed** while the page is open. These decisions approve wording only, never add candidate facts.
6. Quota/provider failures retain previous proposals and source information. Choose an available alternate model explicitly and approve the new recipient. Per-choice waits do not carry to another model. Changed original text, knowledge revisions or match invalidate suggestions; their original references remain readable.
7. This milestone stops here: no application submission, new CV artifact/version or durable proposal storage. Reload/navigation clears proposal review; the original remains unchanged.


## Optional workspace guide and saved-data next actions

The signed-in dashboard offers a collapsed five-step guide: documents → profile review → advertisement/save → automatic personal matching → CV wording preparation. Users can skip, move backward/forward or hide it; no guide action starts AI, edits facts or records journey completion. Document guidance names currently supported DOCX, text-based PDF, TXT and Markdown, with useful employer/role/period/contribution evidence. Matching coverage is not hiring probability, and preparation does not submit an application or create a tailored file.

Next-action guidance uses owned metadata and existing competency/job lists. Uploaded documents without confirmed knowledge lead to source reading/approved analysis rather than repeated upload advice; saved opportunities with confirmed evidence lead to the saved-job workspace rather than another advertisement search. Missing/unavailable data is never interpreted as a completed or empty stage. Documents have a count/link and upload remains directly accessible. This does not inspect every saved match or imply current match readiness.

## Requirement and document review continuation — 2026-10-09

Advertisement extraction now requests distinct candidate criteria from the whole source instead of selecting twelve. Up to 128 source-backed requirements survive saving/reopening and matching. Invalid or absent AI assessments appear as “Not assessed”, with provisional percentage and no personal clarification form. Search and classification filters help review long matches. An excluded source preview is also unassessed, not a candidate gap.

A previously confirmed matching answer remains visible. Editing updates the same claim/revision and confirms it locally; retry after failed confirmation reuses the saved draft. Current approved matching input explicitly associates personal answers with the relevant criteria. No automatic new AI request or forced positive classification follows confirmation.

The document reader uses compact headings, counted icon tabs and supplementary help. Potentially missed source passages appear in a searchable bounded table. An empty pending queue links directly to documented/approved competencies. Source controls, exact quotations, original/OCR reading and approval remain available. Existing stored analyses are not silently upgraded; new analysis uses the new assessment distinction.

## Evidence relations and application priorities — 2026-10-09

A new match shows direct, transferable or undocumented relation to a criterion, with supplementary help. Explicit qualification criteria receive a separate AI-labelled tag; analogous practical work cannot give full credit or prove a formal qualification. Missing evidence remains uncertainty rather than a proven gap. Older saved results retain their original score and have no invented relation metadata; request a new approved analysis for these explanations.

Saved cards include the count of unresolved mandatory qualifications from the stored assessment. Application preparation groups documented examples to highlight, transferable experience to explain and qualification requirements to review. Expand a compact group to inspect every qualifying criterion, its advertisement quote and the referenced candidate contribution/context. No new AI call is made. Stale guidance is identified as the earlier assessment; incomplete readiness coverage is provisional. These existing-result groups do not themselves inspect the base CV; the approved visibility request below provides that separate judgment.

### Clarification confirmation and rejection review

Matching clarification now uses a compact answer card: visible status and context, writing aids for personal experience/related scope, a concise description field and an optional competency-label editor. These aids do not set the AI classification; only the explicit statement is confirmed. Saved drafts/rejected answers remain associated with their criterion, rather than being silently recreated.

An existing answer can be rejected through a separate confirmation dialog. Rejection uses the same revision-checked claim endpoint, excludes the answer from future matching and preserves history. It is not a statement that the candidate lacks the skill. Cancel/failure retains the answer. A deliberate edit and confirmation can restore the same entry. Success feedback explains the next match update, and no AI request is triggered by review.

## Source-bound CV visibility (ADR 0034)

From the owned preparation page, select the base CV and approve the displayed recipient/model. One request returns both criterion visibility and supported wording proposals. Filter/search the compact CV review; expand a criterion to inspect exact base-CV excerpts and the confirmed candidate contribution. Clear presentation, weak visibility, established but absent detail, uncertain evidence and unassessed output remain distinct. No profile confirmation, match-score change or additional provider request follows viewing this panel. Changed CV/match/selections mark the result historical; proposals retain existing review and staleness controls. Original files are retained and review remains page-session-only.

## Project history from document analysis

Advertisement analysis retains supported contact, deadline and location metadata ahead of narrative facts when its ten-fact limit is reached. The source quote remains inspectable and unsupported quotations are rejected before prioritization. Missing contacts still remain unknown; prioritization does not perform a new source lookup or another AI call.

After a valid AI response, a local source check recovers bounded explicit contact blocks containing an email or labeled phone number. The contact value and quote remain literal received-source text, preserving names/roles/details without guessing ownership. Matching partial literal contact facts combine into the complete block; unrelated/broader accounts stay separate. Clear related-job sections and following metadata/skills headings stop recovery. This adds no provider request and does not recover data absent from the received advertisement, replace a failed AI analysis or establish that a browser excerpt is complete.

Start a newly approved document analysis → inspect Career history as well as Competencies → named projects with valid literal proof can populate unverified PROJECT entries → review the project, role, period and retained source evidence before confirmation. Reworded accounts of the same dated relationship share one analysis draft with all bounded supporting sources. Existing personal edits/rejections/deletions remain protected by the import ledger. Existing saved results are not silently reanalyzed or rewritten; quotation validation is not exhaustive project recall.

When proposals are omitted, expand the source-check explanation to inspect the affected area, recorded reason and bounded count. Reopening saved progress retains these reasons; old analyses explain when no details were recorded. No AI call, automatic reanalysis or factual status change follows opening this panel. Counts describe rejected proposals, not unique projects or proven competency gaps.

## Approved CV wording handoff

After approving individual text changes in preparation, open the full plain-text preview and choose Copy CV text. Only approved replacements are applied to the exact selected source snapshot; pending/rejected items preserve original wording and separators. A later edit returns its proposal to pending. Changed/unavailable required evidence disables copying as current; earlier text remains readable. Clipboard denial retains the selectable preview for manual copying. Nothing is sent, saved to the profile or written to the original file. Decisions/preview remain page-session-only (ADR 0035).

## Profile identity and private photo (ADR 0036)

Open **Min profil** → review the compact identity card, privacy, language and profile revision → optionally choose a JPG/PNG photo and inspect its local preview → explicitly save or remove it. The server validates the actual image, enforces upload/dimension limits and stores a normalized JPEG bound to the signed-in owner. The image is never sent to AI or cached. Photo changes do not modify the name/language profile revision. Existing profile settings remain limited to name and preferred language; additional personal preferences require a separately agreed data and visibility design.

Selecting an empty profile section loads that section's owned data and shows a clear loading/error state. With no saved records, documents lead to local reading and optional approved AI analysis; competencies can begin from a source or manual draft; career history can begin with one role/project/education entry. Each route stays within the profile, and no counts, confirmation or AI work are fabricated.

## Document-check result and source reader refresh

Open **Kontroller dokumentene** → review the timestamped technical result, grouped pass/review/not-run counts, per-source checks and exact limitation → rerun locally or open the named original in the document reader. The reader separates source reading, full-document AI review and manual evidence entry; it shows contextual guidance before manual fields, which are revealed after selecting a source quote. No extra AI call is made by the check view. A passing result does not establish semantic correctness or complete extraction.

## Reviewing potentially missed document passages

In a completed, explicitly approved document analysis, expand **Se passasjer som kan være oversett** to inspect bounded source excerpts, their category and original document. Search filters the displayed cards but never changes their source identity. Choose **Behandle som profilutkast**, select a competency/interest or career-history destination, edit the fields and retain the original excerpt as evidence. Save as an unverified draft, or separately check the confirmation box only when the information is personally accurate. The server checks the saved run revision, excerpt offset and exact quotation in both approved text and the retained original before creating the owned profile item. Repeating a successful action reuses its linked item; changed/deleted sources or a stale analysis are surfaced instead of silently creating a replacement. This does not rerun AI or change the original analysis coverage count.

The profile presentation remains separately labeled as AI-written draft wording. Its cited document excerpts show provenance, not that the generated wording is a confirmed personal fact. Editing that wording changes the saved text only; competency and career-history review retain their own source and confirmation states.

## Source-neutral advertisement details

Received text from any employer/source uses the same practical-field reader. Norwegian/English labels can appear inline or on the next line. Literal contact endpoints, deadline, location and employment details supplement partial AI facts and remain visible during AI failure. Newly saved snapshots include these details with source quotations; the complete text remains available. Standalone emails/phone numbers have contact links, without inferring which person owns an endpoint. Missing values are described as absent from received text rather than absent from the original advertisement.

New analyses conservatively validate importance from explicit wording/context. Unspecified importance is unclear, not an inferred mandatory qualification. Existing saved analyses are not rewritten. See ADR 0038; broader direct URL support and result caching are not implemented by this slice.

## AI configuration recovery

Model selectors in advertisement retrieval/analysis, full-document/excerpt review, personal matching and CV preparation distinguish active configuration retrieval, a failed retrieval and a missing task configuration. **Prøv igjen / Try again** refreshes `/api/ai/config` only; it never sends source material or starts an AI analysis. Successful recovery shows the actual selected provider/model. Private analysis remains blocked until task configuration and explicit consent are available; a changed selection clears consent through the existing approval-bound flow. Existing results and sources remain readable. Missing historical attribution is labeled as not recorded instead of indefinite loading.

## Selecting the CV for wording proposals

Application preparation preselects a document only when it is explicitly marked as the master CV. Without a master, select the CV document from the list; the first uploaded certificate or project description is never silently treated as the CV. This selects the wording source, not the competencies: matching/tailoring retain the full confirmed evidence. Clearing or changing the choice clears consent and makes older wording historical. A selected document with fewer than 40 text characters after trimming leading/trailing whitespace shows a local rereading/OCR guidance link before an AI call; originals and prior results are retained.

## Profile evidence changes and saved-match freshness

Confirming, editing, rejecting or deleting competency evidence refreshes the owned claims list and invalidates all cached saved-job match queries, not only the open job. The same refresh applies to documented profile population, manual source promotion and document deletion. Visible cards recheck saved assessments through read-only requests; while checking they label their percentage as being refreshed. The server decides whether a saved result is stale from the confirmed revision set. Historical percentages are retained and not silently recomputed. Updating an AI assessment still requires separate approval.

## Correcting a proposal during guided competency review

Choose **Rediger først / Edit first** in the guided review dialog to adjust the prefilled skill, contribution, company/project or source note. **Back without saving** returns to the same proposal without a write. Saving a correction returns to that same proposal and preserves the queue position; the correction remains unconfirmed until the separate confirmation action. Confirmation uses the updated revision and then advances to the next proposal. Filtering, skipping, rejection and original source evidence retain their existing behavior. No AI call is made.

## Completed document analysis: results first

After processing completes, the reader shows a compact **Review ready** strip and the result-review navigation. **Show source checks and analysis details** expands the retained processing counts, source-character coverage, actual saved model plan and source-usage review. It starts no request or AI analysis. While processing or paused, progress and source checks remain expanded for recovery. Completion is explicitly not a guarantee of complete extraction; originals, source quotations and all review/promotion actions retain their existing rules. The processing/source-check subtree stays mounted during the transition to preserve local review state.

## Finding documents in the profile

The document library uses compact rows with original names, local text-reading status and existing file actions. Search matches filenames only; filters show missing text, unknown legacy metadata or the designated master CV. These are display filters, not AI evidence selection. The combined-analysis shortcut stays above the list and still previews the complete collection, including unreadable sources requiring attention. Unknown metadata uses an inspection icon rather than a success check. A contextual explanation distinguishes text extraction from competency analysis/confirmation.

## Local recovery of long technology lists

The document extractor no longer discards an otherwise valid explicit technology list solely because it has more than 30 items on one line. Local recovery retains each literal label and its independently sourced employer/project context; repeated occurrences are not borrowed across employers. Existing source-row length, per-item validation, quotation and workflow-size bounds remain in force. This needs no additional model request and does not claim exhaustive extraction or change factual confirmation rules.


## Durable CV wording review — 2026-10-12

Application preparation reopens the latest owned wording session without AI calls. Approve/reject persists the selected wording; editing removes its approval locally, and Save wording draft persists PENDING. Unsaved drafts are labelled, block current copying/new generation and warn on browser unload. Failed saves preserve typed wording and pending state. Revision conflicts require explicit loading of saved work (which replaces local drafts). Changed/deleted CV or changed confirmed evidence retains historical reading but blocks review/copy. No new CV file or final approval is created.


## Source-bound CV section review — 2026-10-12

New wording analysis includes a preliminary CV plan. Select a source section to inspect its AI priority, explicit keep/change/review outcome, literal original passages and evidence, and filter its wording proposals. The pending/processed review queue remains persisted; saving review keeps the selected section. Unclassified text and absent assessments are clearly marked. Existing sessions without section plans remain reviewable; new analysis requires the same explicit private approval. Neither section outcome nor wording approval establishes facts or CV_READY.


## Review declared coverage and unsupported quantities — 2026-10-12

Section detail shows the model's declared source-passage review count and its limitations. Older results disclose unrecorded coverage. Unsupported numeric AI additions are withheld, retaining valid suggestions and the source. A new edited-wording approval with unsupported numbers or omitted historical year-shaped values is refused without changing decisions; the editor remains available and the text may be saved as a pending draft before clarification. These checks are not semantic verification or final document approval.

## Saved document analysis and career confirmation — 2026-10-12

Document-library rows distinguish local text reading from saved completed/partial AI processing. Hover, focus or tap the analysis badge for source-specific finding counts, processing characters, start time and recorded provider/models. Combined-analysis counts include findings referencing this document, including additional sources. Missing metadata from an older response remains unknown. Opening the reader retains the existing source/run workflow; it does not start a new AI request. Workflow progress invalidates the document list. Changed-text rereading removes outdated metadata through existing invalidation rules.

Model choices expand within reader cards and scroll when necessary. Choosing another model clears recipient-bound consent. Career confirmation groups organization, period, client and actual role with contribution and expandable source note; users can cancel or edit before confirmation. Unknown dates remain unknown, and editing still resets factual confirmation.

## Reviewed CV drafts and grouped confirmation — 2026-10-12

Resolve each saved CV wording proposal and accept at least one. Choose Save tailored CV draft to create an owned immutable wording version in My CVs without another AI call. The server uses saved decisions and the exact source; repeat clicks return the same version. All other original wording stays intact. The library preview displays saved text, source staleness and a route back to tailoring. This reviewed-text draft has no export artifacts; final document review/export is still pending, and the legacy export approval endpoint explicitly refuses it. Existing manually built standard exports remain unchanged.

In competency and career-history lists, Confirm multiple opens the currently filtered eligible contributions with no preselected rows. Select individual rows or all, inspect displayed text/context/revision and confirm the selection. Competencies already personally confirmed and rejected records are excluded; documentary competencies can be personally confirmed. Requests run sequentially through existing owned revision-checked endpoints. Show progress, stop after the current item, successful rows and per-item failures. Successful rows are not replayed or included in a newly opened pending selection. Partial success is explicit, not an atomic batch guarantee.

All shared Dialog/Sheet components use consistent typography, overlays, close buttons, mobile bounds and footer styling; competency review groups text/context/source. Public job model menus open above the page without stretching the task row. Document reader menus retain bounded in-card layout.

Owner feedback also refreshed application preparation: compact icon-led evidence/match/base-CV metrics, a clear job heading/back action, expandable matching and a two-column source/AI-approval setup that stacks on mobile. Existing source previews, recipient approval, readiness and review logic remain unchanged.


## 2026-10-12 — CV tailoring readiness guidance

CV tailoring consent now explains each active prerequisite beside the checkbox. An outdated or manual-evidence match offers Update job match, opening/focusing the existing match review without starting AI. Missing CV, unreadable source, missing confirmed competencies, unsaved reviews and unavailable AI configuration have specific recovery guidance. Open clarification questions remain non-blocking; model-bound consent still requires an explicit user choice.


## 2026-10-12 — Selected presentation sections and Documents navigation

Completed document summaries offer Use in my presentation (or Replace this presentation section). Saving an edited summary remains a draft update until the user explicitly selects it. The selected presentation stores one source-backed wording snapshot per kind and language, survives newer analyses/reloads, and shows saved source excerpts/model identity. Selection does not confirm competencies or history. Original deletion retains selected wording and excerpts as disclosed references. Next: move the existing upload/library/OCR/analysis workflow to a dedicated Documents page, preserving profile/matching/tailoring links and storage behavior.


## 2026-10-12 — Project history extraction correction

Project catalogs should produce distinct PROJECT history drafts as well as competencies. Project title remains the literal project name; delivery role and client remain separate. PROJECT may have unknown organization; other history kinds still require one. Missing months remain unknown, and users review AI history wording before factual confirmation. Source rereading/new analysis is needed to use the corrected extraction; existing imported history and user choices are preserved.


## 2026-10-12 — Dedicated library and retained profile review

Only upload and the full document library move to /documents. Min profil keeps its documents/AI-profile tab, compact source picker, single/combined analysis, OCR/source/manual review, summary editing/adoption, competencies and history. Navigation precedes analysis/presentation; existing #profile-documents links remain valid. Sidebar/mobile navigation includes Documents with a link back to profile review. Upload guidance and CV source repair links target the library. Completed analyses offer Analyze again with another model, opening source/model settings without calling AI and requiring renewed consent before Start new analysis.


## 2026-10-12 — One profile presentation and direct main CI repair

The profile now has one Your presentation card using the prior latest-suggestions design: gradient header, colored section icons, collapsible sections and saved sources/models. Only explicitly selected wording appears. Unselected/new draft summaries stay in document review, with existing editing and Use/Replace actions. The empty presentation directs users to review rather than silently adopting AI text.


## 2026-10-12 — Reviewed CV file drafts

From the reviewed CV draft in /cv, explicitly generate DOCX and PDF file drafts. Download each for inspection; both retain DRAFT status. The system reads both files back to check ordered character preservation. Standard layout is used; final factual, structural and visual checks remain required. Stale source evidence blocks generation; historical stored drafts remain downloadable.


## 2026-10-13 — Joined journey quality and CV coverage

New DOCX uploads and explicit Read original again preserve separate Word paragraphs for CV tailoring. Older merged CV text gets guidance to reread the original in Documents; exact-source changes can require an updated match/new wording analysis. Prior saved drafts and decisions remain readable. Tailoring accepts up to 40 evidence-linked proposals, with unresolved section review when output cannot be validated.


## 2026-10-13 — CV passage review transparency

Selecting a CV section now exposes every non-heading source passage in a compact expandable ledger. Compare original source with the original AI proposal and reason. Approval, edits and durable decisions remain in the existing proposal cards. A section keep recommendation is labelled as a section recommendation; passages without a proposal do not acquire an invented individual assessment.


## 2026-10-13 — Individual CV passage assessments

New CV tailoring runs supply individual AI reasons for each source paragraph, skills group and work contribution. The passage overview distinguishes AI keep recommendations from missing/unfinished assessment and shows the number of own reasons received. Valid wording proposals remain reviewable even if other passages are unfinished. Existing saved analyses keep their original section-only behavior; run new tailoring to obtain new assessment data. User acceptance and profile confirmation remain separate.


## 2026-10-13 — Regular Flash choice

Change model offers regular Gemini 3.6 Flash alongside the existing Flash-Lite alternative. Source retrieval remains separate. Existing saved results show their original model. Changing the private model plan clears consent; local explicit overrides are not rewritten.

## 2026-10-13 — Clean advertisement input and documentary languages

New analysis excludes recognized related-job tails from the AI input; saved original excerpts remain unchanged. Narrow source checks withhold negated stack expectations, benefits presented as applicant requirements and unsupported language labels, and consolidate formatting-equivalent duplicates. Ambiguous requirements remain available rather than being silently generalized. Historical criteria sourced only from excluded tails become unassessed on new matching; new CV proposals return CV_JOB_REVIEW_REQUIRED before any provider call until the advertisement is reanalyzed. Existing saved results remain readable.

During a newly approved document analysis, local recovery retains explicit natural-language names and verbatim stated proficiency, including supported PDF row pairs and short oral/written continuations. It does not infer proficiency levels or an employer. Eligible literal facts follow existing documentary population settings; generated prose and history retain their separate review states. User edits, rejections and removals remain protected on reanalysis. The coverage view labels language passages as Languages/Språk, while competencies use the existing OTHER category. Confirmed documentary languages enter automatic full-profile matching without individual manual selection. Existing saved analyses require explicit reanalysis to gain new recovery data; no background AI work is introduced.

## 2026-10-14 — Logical CV units and PDF rereading

New PDF uploads and explicit Read original again preserve geometric paragraph gaps and ordinary wrapped lines. Rereading keeps the original bytes and can make older exact-source work stale; saved historical wording remains readable. Start new tailoring only with the existing current-source/model-bound approval. The section ledger then shows application-owned text/skills/contribution units and recognized protected identity/headings/entry headers, with literal entry context when supported. Review/edit/accept stays in the existing wording cards; accepted replacements use those same stored ranges. Invalid stored units block review/copy/draft assembly instead of silently changing indexes. Sessions without source-unit metadata keep legacy segmentation and review behavior. No extra provider request or final approval is introduced.


## Cross-page CV context — 2026-10-14

New PDF uploads and explicit original rereading retain narrow skills columns as complete heading/content groups and keep known metadata labels beside their values. Employment bullets may continue onto the next page without resetting their dated employer scope. Compound prose such as “consulting - and product studio” is editable description, not a new protected entry header; an unfinished wrapped bullet remains one source unit. Previously saved text, original bytes and stored review ranges remain unchanged. Rereading requires a fresh analysis where the existing source checks demand it.

Numbered AI evidence may repeat a heading from a contents list. Source validation accepts a unique literal span within the existing quote limit, rather than bridging from the first repeated label. Competing distinct bounded spans remain rejected. This does not establish that generated wording is factually complete.

## Whole-criterion matching and localized wording review — 2026-10-14

New approved matching runs explicitly assess the complete stated requirement and explain supported scope separately from unresolved qualifiers. New CV wording runs request the chosen language for every user-facing reason, individual reviews for protected as well as editable source units, and specific skills-group reasoning. A previous strong match is guidance, never another confirmed candidate fact. Source-unit wording sessions record prompt version v7; previous results, sources, approvals and review decisions remain readable and unchanged. These instructions improve the contract but do not independently certify factual completeness or useful wording. No analysis starts automatically.

## CV visibility context and oversized AI calls — 2026-10-14

Open a CV visibility item to see the associated match classification and explanation beside the visibility judgment. Clearly expressed experience can still be only partly relevant to the criterion. Transferability and stale-match labels use existing metadata only. A classification is shown only when the loaded match ID equals the CV result's saved match ID; otherwise the original visibility/proposals remain readable with a neutral missing-assessment explanation. Reopening never attaches a newer assessment or starts AI.

For new structured Groq calls rejected with HTTP 413, the application explains the request-size rejection and preserves the source, profile and earlier results. There is no quota countdown or automatic retry/model change for this error. Select another available model and renew the existing approval to try a new analysis. Matching still includes the complete confirmed evidence set. Existing historical generic errors are not reclassified.


## Optional source review of saved CV wording — 2026-10-14

After saving a wording draft, optionally request a separate AI source review of all active (not rejected) proposals. Preview the exact saved text, known entry context and referenced confirmed evidence. The source opinion checks factual scope separately from advertisement relevance. Choose an available model and approve this one additional call separately from generation. Changing the model, saved revision, language or unsaved edits clears consent. No call starts on opening, saving or approving wording.

Findings distinguish AI-found support, scope needing review, potentially unsupported assertions and unassessed text. Each supplied quotation must literally belong to the proposal's referenced evidence. Findings do not confirm facts or approve wording/files. Earlier findings remain readable after failure or edits, explicitly marked as earlier when their exact saved revision no longer matches. Save edits before requesting another review. Findings are page-session-only; the durable wording session and existing human approval remain unchanged.


## Saved-wording review capacity and source continuity — 2026-10-14

Optional source review keeps complete evidence and entry context inside each draft. Its single approved request now reserves an output budget based on proposal count (2,048 tokens minimum, 16,384 maximum), independently of unchanged generation budgets. The system does not truncate evidence, retry an incomplete result or switch models automatically. Missing/invalid literal support stays unassessed. Small requests can still fail provider limits, and AI support remains an opinion requiring human review.

New CV source-unit creation keeps hyphen-ended employment prose followed by “og”/“and” in the same known entry, across an internal blank. Original text, stored legacy ranges and factual statuses remain unchanged; new dated employers/headings still reset context.


## Source-only wording opinions and exact excerpts — 2026-10-14

Optional saved-wording review now sends the saved draft, its linked confirmed statements/context and known entry scope. Job criteria and original CV prose remain available in normal preparation but are excluded from this factual-support opinion. The preview and consent describe this narrower disclosure. The selected model returns source references and a typed issue with an exact phrase to inspect. The application supplies literal saved excerpts and Norwegian/English explanations; providers no longer copy quotations or write those explanations.

Scope, uncertain source, context, absent support and contradiction remain advisory findings. A missing/foreign reference, invalid phrase or malformed assessment becomes unassessed; valid sibling results remain. Complete linked evidence and late qualifiers are retained even for long sources. Original files, profile facts, match scores, saved wording and decisions remain unchanged; no automatic follow-up call or final CV approval is added.
