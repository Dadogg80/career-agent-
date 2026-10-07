# PR handoff: reviewed URL import and workspace redesign

Base: `main`
Head: `feat/job-url-import`

## Title

Add reviewed NAV job URL import and redesign the analysis workspace

## Description

Jobseekers can now import an individual Arbeidsplassen advertisement through NAV’s official API, review and edit the normalized source text, then request cited requirement extraction. Unsupported, missing and inactive sources keep the URL and offer pasted text as a fallback. Retrieval uses fixed official endpoints with redirect rejection, private-address checks, timeouts and response/text size limits; it does not scrape job websites or invoke AI automatically.

Redesign the Norwegian/English interface around responsive input and results columns, clear requirement counts, quotation cards and inspectable source evidence. Adopt TanStack Query and shadcn/ui with Tailwind CSS and document them as the frontend development rule. Disable automatic AI mutation retries. Update architecture decisions, user flows/stories, roadmap, security guidance and local test instructions.

Validation:
- 25 backend tests passed, including source contracts, URL validation, unsafe addresses, redirects and oversized responses.
- Frontend production build and TypeScript check passed.
- 12 Playwright tests passed, covering review before analysis, manual fallback, both languages, real proxy behavior and mobile overflow.
- Production npm audit reported zero vulnerabilities.
- Live official NAV API import succeeded; desktop/mobile synthetic result screenshots reviewed.

Limitations: NAV’s API excludes FINN advertisements; use pasted text for those. This is a local experiment using the public NAV token, with production registration/compliance pending. No persistent storage, authentication, candidate matching or richer role summary is included. Groq Browser Search is a separate unverified follow-up; no paid tooling was enabled. Live Groq analysis and GitHub Actions execution were not reverified in this delivery.
