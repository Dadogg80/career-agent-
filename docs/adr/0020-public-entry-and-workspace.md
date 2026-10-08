# ADR 0020: Separate public entry, sign-in and workspace orientation

Status: Accepted, delegated UX decision for the local pilot.

## Context

Opening the application directly into advertisement analysis and discovering sign-in through profile settings makes the product difficult to understand. The owner explicitly requested a landing page, dedicated sign-in and coherent UX/UI, with freedom to improve usability.

## Decision

Use Next routes for landing, dedicated sign-in, authenticated overview and existing work areas. Move public analysis to `/jobs/analyze`, retain guest analysis, and reuse existing OIDC/PKCE with fixed success `/dashboard` and failure `/login?login=failed` destinations. Use the shared shadcn desktop/mobile navigation and account controls. Show only actual saved counts and working destinations; no fabricated activity or extra model calls.

## Consequences

Root bookmarks now open the landing page; analysis automation/docs use the new route. Entry guards improve orientation without replacing backend authorization. Local Keycloak remains the pilot provider; production identity is a separate decision. Existing evidence workflows remain intact. Adding a future feature requires a real destination, bilingual states and relevant interaction/authorization verification.
