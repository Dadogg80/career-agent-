# Test the advertisement-analysis pilot

Status: Ready for a local pilot test after checking out `feat/job-requirements` or merging its PR. Codex tests and live Groq checks do not establish that the application is already installed on the user's Mac.

## What is available

- Norwegian-first interface with English selection.
- Pasted advertisement text, 40–15,000 characters.
- Groq extraction of at most 12 requirements with source quotations.
- Required/preferred/unclear categories, error handling, and retained text after a failed call.
- A warning when the source changes after analysis.

This is advertisement extraction, not candidate matching. There is no candidate profile, score, CV upload, persistent storage, or login yet. Use public advertisements or fictional data only. Text is sent to Groq when Analyze is selected; the application does not persist it. Provider processing has its own terms.

## Start on your Mac

Prerequisites: ARM64 JDK 21, Node.js 24 and npm. Docker is not required for this screen. Do not assume Codex installations exist on your Mac.

From the repository root, start the backend:

```sh
cd apps/backend
./gradlew test bootJar
```

Configure `GROQ_API_KEY` securely in that terminal's process environment, then:

```sh
java -jar build/libs/career-agent-backend.jar
```

For Bash, a hidden prompt can set the key without putting the value in command history. Run `bash` first if using zsh, then enter:

```sh
read -r -s -p "Groq API key: " GROQ_API_KEY
printf '\n'
export GROQ_API_KEY
java -jar build/libs/career-agent-backend.jar
```

Use either launch approach, not both simultaneously. Codex secrets are not automatically transferred to your Mac. Do not save the real key in `env_example` or another tracked file.

In a second terminal, from the repository root:

```sh
cd apps/web
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open the application on your Mac's loopback port 3000. This is a local test, not a deployed web link.

## First test

Paste this fictional advertisement:

> Vi søker kundebehandler. Du må snakke norsk og engelsk. Erfaring med kundeservice er en fordel. Arbeidet innebærer telefon og e-post.

Select **Analyser**. Verify that language skills are identified, quoted evidence actually appears in the source, and customer-service experience is desirable rather than mandatory. Review whether duties were incorrectly treated as candidate requirements; quotation matching cannot prove semantic correctness.

Switch to English and analyze an English advertisement. Check the output language, edit the source to see the outdated-result warning, and confirm that a failed call retains the pasted text.

## Limits and feedback

Default model: `openai/gpt-oss-20b`, configurable through backend `GROQ_MODEL`. There is no automatic fallback or plan upgrade. Availability and free quotas are controlled by Groq.

Default safety limit: 20 accepted analysis attempts per backend process, including failed attempts, and one in-flight call. Restart resets this limit; it is not a durable billing cap. `AI_MAX_REQUESTS` can reduce the limit. Output is bounded to 2,200 completion tokens per call. A limited smoke test does not establish complete Norwegian quality or prompt-injection resistance.

Report missing/incorrect requirements, misleading categories, invented labels, latency, and confusing UI. Avoid copying real private candidate data into GitHub issues.

## URL import and redesigned workspace

After the URL-import PR is merged, update your local clone (`git switch main`, `git pull --ff-only`). Stop both running processes with Ctrl+C. Run `npm ci` in apps/web to install the new dependencies, and restart backend/frontend using the existing run instructions. Keep your existing backend `.env`; no Groq key changes are required.

1. Open the Norwegian interface and select Use a link (Bruk lenke).
2. Paste an individual Arbeidsplassen URL. Select Hent annonse.
3. Review the title, source link/time and editable text. Correct/remove any unnecessary personal details.
4. Select Analyser; check categories and quotations. Open Se kildegrunnlaget.
5. Edit the text and verify the outdated-result warning.
6. Try FINN: the import should explain the limitation and retain your URL. Select Lim inn tekst and paste the advertisement instead.
7. Switch to English and repeat. Test a narrow browser window; the columns should stack without horizontal scrolling.

NAV’s public token is used automatically for experimentation. A NAV_API_TOKEN is optional, backend-only; do not add it to Git or browser variables. Some Arbeidsplassen links (especially FINN-origin ads) are not in NAV’s API. Rich summaries and candidate matching are still pending. Reload loses the current text/results.

## FINN URL test after merging Browser Search support

1. Stop both processes, pull merged main, rebuild backend and restart both. No new packages or keys are required for this delivery.
2. Paste `https://www.finn.no/job/ad/478077416` and select Hent annonse.
3. Expect the AI Engineer / Tieto Banktech source title, editable provider excerpt and Groq/Exa provenance notice while the ad remains accessible.
4. Open the original and check that the relevant qualifications appear; correct/remove unnecessary information before selecting Analyser.
5. Check the cited requirements and the persistent excerpt warning. Switch to English to check both stages.
6. If the provider cannot retrieve the exact page, is rate limited, or reaches the local 10-attempt cap, the URL stays available and pasted text remains an alternative. Successful test-day access does not guarantee future source availability.

Browser Search uses the existing backend key and supported model. Adding `GROQ_BROWSER_SEARCH_ENABLED=false` to the backend environment disables it. Search and analysis use independent process limits. A counter is not a provider billing control; keep the existing account on its free tier.

## Compact requirements

After merging feat/compact-requirement-details, pull main and run npm ci in apps/web (the shadcn Dialog dependency is new), then restart the frontend. Backend behavior is unchanged. Analyze an advertisement; filter required/preferred/unclear items, open a tile, inspect original quote and surrounding context, and close using Escape or the translated close button. Repeat in English and on a narrow screen. Editing source should still mark the old result stale. No profile/CV capability is introduced by this UI delivery.

## PostgreSQL foundation update (2026-10-07)

The complete backend test suite now requires Docker for disposable real PostgreSQL tests. Public-ad startup remains database independent; `./gradlew bootJar` can build the application without starting database tests. Optional local persistence startup and required credentials are documented in [POSTGRES_SETUP.md](POSTGRES_SETUP.md). Profile login/API/UI and CV upload are not yet available. URL analysis now runs directly from **Analyze link**, with no mandatory excerpt-review step.

## Local development interaction troubleshooting

The development config explicitly allows `localhost` and `127.0.0.1` for Next.js development assets/HMR. This does not relax API request-origin checks or production security. Restart the frontend after updating Next config, and consistently open the same local hostname.

Analysis controls are disabled until React initializes, with a visible preparing message and a JavaScript-required fallback. A native form reload must not erase a submitted link. If the preparing message never disappears or mode buttons remain disabled, inspect browser Console and Network for failed scripts; an HMR warning alone does not identify every possible browser startup failure. Private browsing can help diagnose stale resources/extensions without deleting profile data.

Run `npm run test:dev` from apps/web to test both loopback hostnames against a real Next development server. AI calls are mocked, and the tests verify origin enforcement, mode switching and one-click URL analysis without navigation. The regular production browser suite includes a delayed-script hydration check.

## Paced URL workflow checkpoint

Before starting the profile/CV delivery, use the frontend development server and test a supported public URL. Expect retrieval status, then a 10-second countdown for FINN, then analysis status and the sourced overview/compact requirements. No manual excerpt screen is required.

Expand **Utviklerdiagnostikk** and inspect the received text, stage lights, HTTP status and result counts. In browser Console, filter `[Career Agent]` to see the same sanitized sequence. Source bodies/keys must not appear in console events. Try stopping during the pause and continuing the same link: the source must be reused, with no second browser search. Repeat in English and at a narrow viewport. Check source quotes and useful metadata against the original ad; a successful HTTP response alone is insufficient.

The current fixed pause reduces rapid back-to-back calls but may still encounter account-level quota rejection. Inspect the reactive retry countdown and manually retry using the retained source. Settings and diagnostic boundaries are in [DEBUGGING.md](DEBUGGING.md). Do not run repeated live probes while assessing free-tier limits.
