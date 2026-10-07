# PR handoff: compact requirement details

Base: `main`
Head: `feat/compact-requirement-details`

## Title

Make job requirements compact and add inspectable detail dialogs

## Description

The analysis result repeated every long requirement and quote in large cards. Replace it with compact grouped tiles and category filters with real counts. Each tile opens a shadcn Dialog with its full label, original quote, deterministic category guidance and surrounding analyzed-source context. Preserve stale-result and Groq/Exa provenance, keyboard focus restoration and Norwegian/English controls. Opening details makes no additional AI request.

Add the official shadcn Dialog dependency and consolidate the roadmap around actual implementation status and the next three recommended deliveries: identity/storage/profile, CV source import/claim confirmation, then evidence-based matching/CV recommendations. Update architecture, user flows/stories and pilot test guidance. No backend contract or private-data feature is changed.

Validation: frontend production build and TypeScript check passed; 17 Playwright tests passed; production npm audit reported zero vulnerabilities; synthetic result/detail screenshots reviewed. Backend unit tests were not rerun because backend code is unchanged; E2E exercised the existing backend with Groq disabled. No live Groq call made; GitHub Actions status is not independently verified.

Limitations: details explain categories and show source context, not new AI technical explanations or candidate matching. Profile, persistence, CV upload and export remain future deliveries.
