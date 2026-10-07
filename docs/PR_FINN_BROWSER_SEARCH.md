# PR handoff: FINN Browser Search import

Base: `main`
Head: `feat/finn-browser-search`

## Title

Support FINN job links through bounded Groq Browser Search

## Description

FINN job URLs previously returned an unsupported-source error. Add a separate Groq Browser Search source adapter using the existing backend key/model. Import only browser.open source output matching the exact canonical advertisement URL; discard generated final answers and reasoning. Keep NAV import unchanged and require user review before separate structured requirement extraction.

Show Groq/Exa excerpt provenance and completeness/freshness limits before and after analysis in Norwegian and English. Add bounded search attempts, safe provider errors, no automatic retries and a backend disable flag. Preserve URL/text and the manual alternative on failure. Update architecture decisions, user flows, roadmap, security and local run instructions. No new dependencies or paid-plan fallback.

Validation:
- 34 backend tests passed.
- 15 Playwright tests passed.
- Frontend production build and TypeScript check passed.
- Live Groq source retrieval and full browser-to-backend FINN import succeeded for the user-supplied public URL; source provenance was verified and the screenshot reviewed.

Limitations: provider excerpts may be partial or stale and do not establish current ad status. Local counters are not monetary billing controls. Use the existing free-tier pilot account. Production source/provider terms and billing controls remain pending. Subsequent structured analysis was not rerun live and GitHub Actions status was not independently verified. No persistence or candidate matching is added.
