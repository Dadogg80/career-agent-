# AI call and advertisement diagnostics

## Temporary AI request/response inspection

The DEV Sheet is available beside job analysis, document analysis, CV preparation, and the personal-match panel inside an opened saved-job detail. It is not shown on the saved-job list or unrelated workspace views. The opened-job match panel shows only captured calls for that job ID; opening another job does not mix match history into its panel. Its **Start content capture** control is off until explicitly enabled. When enabled, the backend records the actual structured-model instructions, user input, schema/tool configuration and model text, plus the exact request/response payloads for Groq Browser Search and Gemini URL Context. Provider/model, task, endpoint, elapsed time and safe failure codes are shown per call. Calls from one resumable document workflow are grouped and numbered across `/next` requests.

This intentionally sensitive view can display advertisement text, document excerpts and profile/CV content. Use it only on the local pilot and do not share the screen while open. Captured content is held only in backend process memory, for up to 10 minutes, with a 200-call and 12-million-character total bound; an individual field is limited to 60,000 characters and marked when truncated. Capture automatically stops after 30 minutes. Stopping capture keeps the existing in-memory entries for inspection; **Clear content** removes them immediately. Backend restart also clears all entries. Closing the Sheet removes its client query-cache copy; reopening fetches the current backend buffer. No prompt, input or response is written to application logs, browser console, database or files. The existing sanitized `[Career Agent]` events remain content-free.

The inspection endpoint is loopback-only, exposed through a same-origin local Next.js proxy and controlled by explicit in-app consent. `AI_CALL_DIAGNOSTICS_ENABLED=false` disables payload capture support; it defaults to enabled for the loopback-only local pilot. Do not enable this facility on a shared or public deployment. Do not send private documents to public advertisement endpoints: this trace view is a distinct local-only diagnostics surface, not the advertisement event log or an authorization to change provider consent.

Open the DEV tab, review the privacy notice, start capture, and then run the desired workflow. Expand a run, then choose **Inspect call content** on a numbered call to inspect **Instructions**, **Input**, **Schema and tools**, and **Model response**. Payload text is rendered only after opening its call. The panel polls only while open and capture is active. Calls reflect the provider exchange; an application-level validator may still reject an otherwise successful provider response.

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

The legacy stage panel and its content-free events are enabled by default in development. Production builds hide them unless explicitly enabled with `NEXT_PUBLIC_JOB_DIAGNOSTICS=true` before building. Source previews are rendered as text, never HTML. Only the latest run is retained in component memory (bounded to 40 events); reload clears it. There is no exported diagnostic file or server log of advertisement bodies. Browser developer tools can retain their own console history independently. Full provider request/response bodies use the separate explicit-consent buffer described above.

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

Ten seconds is a configurable pacing aid, not an assurance that the shared account/model token quota has reset. Playground, other clients and browser tool work can consume the same quota. Quota waits can be minutes or hours, especially for tokens per day. Cooldown handling now preserves positive numeric or HTTP-date Retry-After hints and a recognized Groq “Please try again in …” duration, choosing the longer valid hint and bounding it to 24 hours. Invalid/missing hints default to 60 seconds. This is provider feedback, not a guarantee that the next request will fit the available quota.

The backend cooldown blocks further dispatch for the provider/model that returned a rate response, including calls from other features using that same model. A different configured model has its own application cooldown and remains selectable. Advertisement, document and personal-matching proxies and controls preserve the delay; they no longer shorten it to five minutes. Long UI waits display minutes/hours. Existing text and earlier saved results remain available. Cooldowns are process-local and are lost on backend restart; provider project/account quotas can still span models. The app does not poll for quota, forecast token availability, automatically retry failures, rotate keys or upgrade the account.

No advertisement body, title, full URL, contact details, raw provider payload, exception message or API key is added to console events. Development source inspection is explicitly expanded in the UI. The optional local in-memory AI trace is separate from those events and can display private documents only after explicit capture is started; this does not authorize production private-data processing.

## Validation boundary

Automated browser tests mock provider outcomes or disable the backend key. They prove sequencing, cancellation, source reuse, diagnostic data boundaries and UI behavior, not live provider availability or model quality. A real pilot run is still needed to assess the current advertisement and account quota. Verify the result overview and quotes against the original before relying on the analysis.


## Analysis rejected after Groq HTTP 200

HTTP 200 means the provider returned a response, not that the app accepted the structured content/evidence. The backend and DEV events now include an allowlisted reason: PROVIDER_SCHEMA_MISMATCH, OUTPUT_INCOMPLETE, EMPTY_OUTPUT, MALFORMED_JSON, INVALID_STRUCTURE or NO_SUPPORTED_ITEMS. No raw failed_generation, provider body or input text is logged. A failed analysis shows the available source excerpt and a retry, without an empty result panel. Missing structured fields mean not identified, not proof they are absent from the source. Private CV import never uses this diagnostic panel.

Individual invalid/overlong fields and unsupported quotes are omitted without discarding valid sourced items. Result limits remain 12 requirements and 10 facts; at most 128 candidates from each array are inspected. Excess/invalid item counts are reported through `omittedItems`, including counts beyond the old 22-item assumption so partial results can still be saved. Logs include only omission categories/counts. Malformed top-level JSON/containers remain errors; if every proposed item is invalid, the source-reader recovery remains available. No extra repair call is made to Groq.
