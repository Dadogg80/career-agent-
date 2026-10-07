# Next delivery: URL-based job overview

Status: URL ingestion and the redesigned workspace are implemented on `feat/job-url-import`; merge is pending. Richer summaries, responsibilities and sourced metadata remain planned.

## Product goal

Paste a supported public job URL and receive a clear, sourced overview of the role in Norwegian or English. Candidate matching is a subsequent feature.

## Proposed experience

1. Default to a URL input; retain a Paste text alternative.
2. Show real stage progress: retrieving advertisement, extracting content, analyzing.
3. Present title/employer, available location/work arrangement/deadline/salary, a short summary, responsibilities, required qualifications, preferred qualifications and important unknowns.
4. Display missing metadata as Not specified. Never infer remote work, salary or deadlines.
5. Expose the original source text, quotations, retrieval timestamp and source link for review.
6. Preserve input on failure and offer manual text import if fetching is unsupported or blocked.

## Small implementation sequence

### A. URL ingestion

Investigate FINN and Arbeidsplassen for supported access and reliable extraction. Implement the first feasible source adapter rather than promise both before investigation. Use ordinary backend HTTP fetching and deterministic HTML/structured-data parsing. Do not add a browser worker unless the selected source genuinely requires it.

Separate source fetching, normalization and AI analysis. Prefer source-provided JobPosting data when valid; ignore navigation, scripts and unrelated listings. Never send raw page HTML directly as trusted model instructions.

Restrict initial fetching to explicit source hosts and supported advertisement paths. Validate schemes, redirects, resolved addresses, timeouts, response types and download size. Do not create an unrestricted server-side URL proxy or bypass source access controls. Block internal/local addresses and unsupported redirect destinations. Inspect actual access terms before implementing a source.

### B. Richer sourced analysis

Extend the output schema beyond the current requirement list. Separate responsibilities from qualifications. Attach evidence to factual metadata and summary points; quotation presence alone does not prove semantic correctness. Unknowns must remain visible. Continue bounded Groq calls and sanitized errors.

### C. Result interface

Use a compact overview, readable sections and expandable source evidence. Add real loading states, clear failures, accessibility and full Norwegian/English labels. Avoid fake match scores or application advice without a candidate profile.

### D. Verification

Use source fixtures and tests for valid/expired/non-advertisement pages, blocked redirects, local/private addresses, oversized responses and source extraction failures. Cover richer schema/evidence validation and the browser URL-to-result flow. Report live source checks separately from fixture tests.

## Later slices

Identity/ownership and PostgreSQL Compose → saved jobs and immutable advertisement snapshots → candidate profile and claim confirmation → evidence-based matching → tailored application material.

The first URL delivery may operate without persistence, like the existing public-text pilot. Durable saving must not be claimed until implemented. No Kafka, Temporal, Redis or vector store is necessary for this scope.

## Unresolved before URL implementation

The first source is NAV’s official vacancy API, using its public experiment token or an optional server-only NAV_API_TOKEN. Website scraping is excluded. FINN ads are absent from this API. Production consumer registration and feed update/deletion compliance must precede saved listings. See ADR-0008.

Groq Playground Browser Search was suggested by the user as a potential FINN integration. API/model availability, free-plan tool quotas/pricing, source retrieval and evidence validation remain unverified. Documentation access from this cloud environment returned HTTP errors; no search calls or paid features were enabled.
