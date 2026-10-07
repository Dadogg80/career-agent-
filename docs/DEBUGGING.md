# Advertisement workflow diagnostics

The local pilot must make URL retrieval, analysis and failures inspectable before profile/CV work continues. This panel describes actual application events; it is not a simulated agent activity feed.

## Inspect a run

1. Start the frontend with `npm run dev` and open the local application.
2. Select the **DEV** tab protruding from the right edge to open **Utviklerdiagnostikk / Developer diagnostics** in a shadcn/ui Sheet. It starts hidden and does not block interaction with the workspace.
3. Submit a supported public advertisement URL. Inspect the three lights: retrieval, pause and analysis.
4. After retrieval, expand **Se teksten som faktisk ble hentet / See the text actually retrieved** to inspect the exact source context received by the frontend. This is not the provider's generated answer. FINN excerpts may be incomplete or stale.
5. Open browser developer tools → Console and filter on `[Career Agent]`. The same sanitized events include a per-run ID, elapsed time, HTTP status/request duration, text length and result counts. Network shows the actual POST requests to `/api/jobs/import` and `/api/jobs/requirements`.

Green means that stage completed and its response passed client validation. Yellow means active work or a deliberate pause. Red means a mapped error; inspect its HTTP status/error code and the visible error message. Gray means queued, skipped or stopped, with a text label. Colors never replace the labels. Green does not establish semantic correctness, completeness or freshness of AI/source content.

Expected retrieval/provider failures are logged with `console.warn`, preserving the red workflow state and sanitized details. Using `console.error` for these handled failures caused Next.js development mode to show a runtime-error overlay at the logging line. That line is not the underlying provider cause. Inspect the DEV stage's mapped code/HTTP status and the normal visible error message instead.

Close the panel using its translated close button or Escape; keyboard focus returns to the edge tab. Closing hides the panel, while the current run remains in workspace memory. The panel fits narrow screens and respects reduced-motion preferences. The Sheet uses the existing Radix Dialog dependency; opening it makes no provider request.

The panel and logs are enabled by default in development. Production builds hide them unless explicitly enabled with `NEXT_PUBLIC_JOB_DIAGNOSTICS=true` before building. Source previews are rendered as text, never HTML. Only the latest run is retained in component memory (bounded to 40 events); reload clears it. There is no exported diagnostic file or server log of advertisement bodies. Browser developer tools can retain their own console history independently.

## Configure pacing

Optional settings in ignored `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_ANALYSIS_DELAY_SECONDS=10
# Optional for an explicitly diagnostic production pilot build:
# NEXT_PUBLIC_JOB_DIAGNOSTICS=true
```

Restart the development server after changing these settings. For production, rebuild and restart: `NEXT_PUBLIC_*` settings are compiled into the browser bundle. They must never contain provider keys or other secrets. Groq keys remain in the backend environment.

The FINN flow is retrieval → a default 10-second minimum pause → structured analysis → sourced overview and requirement cards. Pause is bounded to 0–120 seconds; invalid numeric configuration falls back to 10. NAV retrieval is not a Groq call and normally skips the pause. Pasted text normally uses one analysis call. A pending pause from a stopped FINN run is still honored when resuming.

The loading component shows actual stages and a countdown, with a decorative document/card animation that makes no model requests. It has no invented percentage or artificial claims of work during the pause. Reduced-motion preferences disable the animation.

**Stop before analysis** cancels the scheduled second call and retains the retrieved source. Retrying the same URL reuses it and observes any remaining pause; it does not fetch again. Leaving the component aborts its local wait/request. An already dispatched backend/provider operation may still finish.

## Quota limits remain real

Ten seconds is a configurable pacing aid, not an assurance that the shared account/model token quota has reset. Playground, other clients and browser tool work can consume the same quota. The UI still honors bounded reactive provider Retry-After cooldowns and offers a manual retry using fetched text. It does not poll for quota, forecast token availability, automatically retry failures, rotate keys or upgrade the account.

No advertisement body, title, full URL, contact details, raw provider payload, exception message or API key is added to console events. Development source inspection is explicitly expanded in the UI. Current use remains public advertisements only; this does not authorize private CV diagnostics or production private-data processing.

## Validation boundary

Automated browser tests mock provider outcomes or disable the backend key. They prove sequencing, cancellation, source reuse, diagnostic data boundaries and UI behavior, not live provider availability or model quality. A real pilot run is still needed to assess the current advertisement and account quota. Verify the result overview and quotes against the original before relying on the analysis.


## Analysis rejected after Groq HTTP 200

HTTP 200 means the provider returned a response, not that the app accepted the structured content/evidence. The backend and DEV events now include an allowlisted reason: PROVIDER_SCHEMA_MISMATCH, OUTPUT_INCOMPLETE, EMPTY_OUTPUT, MALFORMED_JSON, INVALID_STRUCTURE or NO_SUPPORTED_ITEMS. No raw failed_generation, provider body or input text is logged. A failed analysis shows the available source excerpt and a retry, without an empty result panel. Missing structured fields mean not identified, not proof they are absent from the source. Private CV import never uses this diagnostic panel.
