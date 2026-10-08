"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, FileText, Link2, Search, ShieldCheck, LoaderCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { WorkflowNotice } from "./workflow-notice";
import { SaveJob } from "./save-job";
import { JobOverview } from "./job-overview";
import { RequirementResults } from "./requirement-results";
import { isExtraction, type Requirement, type JobFact } from "../lib/job-requirements";
import { isImportedJob, type ImportedJob } from "../lib/job-import";
import { jobTranslations } from "../lib/job-translations";
import type { Locale } from "../lib/translations";
import { AnalysisProgress } from "./analysis-progress";
import { AnalysisDiagnostics } from "./analysis-diagnostics";
import { safeAnalysisReason, type AnalysisFailureReason, analysisDelaySeconds, diagnosticsEnabled, waitForAnalysis, type AnalysisPhase, type AnalysisStage, type DiagnosticEvent } from "../lib/analysis-workflow";

class RequestFailure extends Error {
  constructor(code: string, readonly retryAfterSeconds?: number, readonly httpStatus?: number, readonly durationMs?: number, readonly reason?: AnalysisFailureReason) { super(code); }
}

async function post(path: string, input: unknown, signal?: AbortSignal) {
  const started = performance.now();
  let response: Response;
  try { response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal }); }
  catch { throw new RequestFailure("NETWORK_ERROR", undefined, undefined, Math.round(performance.now() - started)); }
  const durationMs = Math.round(performance.now() - started);
  let value;
  try { value = await response.json(); } catch { throw new RequestFailure(path.endsWith("import") ? "SOURCE_INVALID" : "AI_INVALID_RESULT", undefined, response.status, durationMs); }
  if (!response.ok) {
    const retryAfter = Number(value?.retryAfterSeconds ?? response.headers.get("retry-after"));
    const code = typeof value?.code === "string" && Object.hasOwn(jobTranslations.nb.errors, value.code) ? value.code : "AI_UNAVAILABLE";
    const providerRateLimit = ["AI_RATE_LIMITED", "SOURCE_RATE_LIMITED"].includes(code);
    throw new RequestFailure(code, response.status === 429 && providerRateLimit ? Math.min(300, Math.max(1, Math.ceil(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60))) : undefined, response.status, durationMs, safeAnalysisReason(value?.reason));
  }
  return { value: value as unknown, httpStatus: response.status, durationMs };
}

export function JobAnalyzer({ locale }: { locale: Locale }) {
  const t = jobTranslations[locale];
  const [ready, setReady] = useState(false);
  const mounted = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const running = useRef(false);
  const run = useRef({ id: "", started: 0 });
  const nextAnalysisAt = useRef(0);
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [pacedRun, setPacedRun] = useState(false);
  const [waitUntil, setWaitUntil] = useState(0);
  const [waitIn, setWaitIn] = useState(0);
  useEffect(() => { mounted.current = true; setReady(true); return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => {
    if (!waitUntil) return;
    const tick = () => setWaitIn(Math.max(0, Math.ceil((waitUntil - Date.now()) / 1000)));
    tick(); const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [waitUntil]);
  function record(stage: AnalysisStage, state: DiagnosticEvent["state"], details: DiagnosticEvent["details"] = {}) {
    if (!mounted.current) return;
    const event: DiagnosticEvent = { runId: run.current.id, elapsedMs: Math.round(performance.now() - run.current.started), stage, state, details };
    if (diagnosticsEnabled) {
      setEvents(previous => [...previous, event].slice(-40));
      // Expected request failures belong in the workflow UI, not Next's runtime-error overlay.
      if (state === "error") console.warn("[Career Agent]", event);
      else console.info("[Career Agent]", event);
    }
  }
  function begin() {
    running.current = true;
    controller.current = new AbortController();
    run.current = { id: crypto.randomUUID(), started: performance.now() };
    setEvents([]); setResult(previous => previous?.source === text && (mode === "text" || matchesImportedUrl()) ? previous : null); setPacedRun(false); importing.reset(); extraction.reset();
  }
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [retryIn, setRetryIn] = useState(0);
  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => setRetryIn(Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);
  function failed(error: Error, stage: AnalysisStage) {
    if (!mounted.current) return;
    running.current = false; setPhase("error");
    record(stage, "error", {
      code: Object.hasOwn(t.errors, error.message) ? error.message : stage === "source" ? "SOURCE_UNAVAILABLE" : "AI_UNAVAILABLE",
      ...(error instanceof RequestFailure ? { httpStatus: error.httpStatus, durationMs: error.durationMs, seconds: error.retryAfterSeconds, reason: error.reason } : {}),
    });
    if (error instanceof RequestFailure && error.retryAfterSeconds) {
      setRetryIn(error.retryAfterSeconds);
      setCooldownUntil(Date.now() + error.retryAfterSeconds * 1000);
    }
  }
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [imported, setImported] = useState<ImportedJob | null>(null);
  const [resultRevision, setResultRevision] = useState(0);
  const [result, setResult] = useState<{ requirements: Requirement[]; facts: JobFact[]; omittedItems: number; source: string; locale: Locale; imported: ImportedJob | null; analysisFailed?: boolean; refreshFailed?: boolean } | null>(null);
  const extraction = useMutation({ mutationFn: async (input: { text: string; locale: Locale; imported: ImportedJob | null }) => {
    if (input.text.trim().length < 40) throw new Error("INVALID_INPUT");
    setPhase("analysis"); record("analysis", "running", { endpoint: "/api/jobs/requirements", characters: input.text.length });
    const response = await post("/api/jobs/requirements", { text: input.text, locale: input.locale }, controller.current?.signal);
    if (!isExtraction(response.value)) throw new RequestFailure("AI_INVALID_RESULT", undefined, response.httpStatus, response.durationMs);
    return { requirements: response.value.requirements, facts: response.value.facts, omittedItems: response.value.omittedItems ?? 0, source: input.text, locale: input.locale, imported: input.imported, httpStatus: response.httpStatus, durationMs: response.durationMs };
  }, onError: (error, input) => {
    failed(error, "analysis");
    if (mounted.current && !controller.current?.signal.aborted && input.text.trim()) {
      setResult(previous => previous && previous.source === input.text && !previous.analysisFailed ? { ...previous, refreshFailed: true } : { requirements: [], facts: [], omittedItems: 0, source: input.text, locale: input.locale, imported: input.imported, analysisFailed: true });
      setResultRevision(revision => revision + 1);
    }
  }, onSuccess: ({ httpStatus, durationMs, ...value }) => {
    if (!mounted.current) return;
    running.current = false; setPhase("done");
    record("analysis", "success", { endpoint: "/api/jobs/requirements", httpStatus, durationMs, requirements: value.requirements.length, facts: value.facts.length, omittedItems: value.omittedItems });
    setResult(value); setResultRevision(revision => revision + 1);
  } });
  async function continueAnalysis(input: { text: string; locale: Locale; imported: ImportedJob | null }) {
    const signal = controller.current!.signal;
    const seconds = Math.max(0, (nextAnalysisAt.current - Date.now()) / 1000);
    setPacedRun(seconds > 0);
    if (seconds > 0) {
      setPhase("wait"); setWaitUntil(nextAnalysisAt.current); setWaitIn(Math.ceil(seconds));
      record("wait", "running", { seconds: Math.ceil(seconds) });
      const completed = await waitForAnalysis(seconds, signal);
      if (!mounted.current) return;
      setWaitUntil(0); setWaitIn(0);
      if (!completed) { running.current = false; setPhase("cancelled"); record("wait", "cancelled"); return; }
      record("wait", "success");
    } else { record("wait", "skipped"); }
    if (mounted.current && !signal.aborted) extraction.mutate(input);
  }
  const importing = useMutation({ mutationFn: async (input: { url: string; locale: Locale }) => {
    setPhase("source"); record("source", "running", { endpoint: "/api/jobs/import" });
    const response = await post("/api/jobs/import", { url: input.url }, controller.current?.signal);
    if (!isImportedJob(response.value)) throw new RequestFailure("SOURCE_INVALID", undefined, response.httpStatus, response.durationMs);
    return { job: response.value, locale: input.locale, httpStatus: response.httpStatus, durationMs: response.durationMs };
  }, onError: error => failed(error, "source"), onSuccess: async ({ job, locale: resultLocale, httpStatus, durationMs }) => {
    if (!mounted.current) return;
    setImported(job); setText(job.text);
    record("source", "success", { endpoint: "/api/jobs/import", httpStatus, durationMs, characters: job.text.length, sourceType: job.sourceType ?? "NAV_API" });
    if (job.sourceType === "GROQ_BROWSER_EXCERPT") nextAnalysisAt.current = Date.now() + analysisDelaySeconds * 1000;
    await continueAnalysis({ text: job.text, locale: resultLocale, imported: job });
  } });
  const pending = phase === "source" || phase === "wait" || phase === "analysis";
  const blocked = !ready || pending || retryIn > 0;
  const error = importing.error?.message ?? extraction.error?.message;
  function analyze(e: FormEvent) {
    e.preventDefault(); if (blocked || running.current) return;
    begin(); record("source", "skipped", { characters: text.length, sourceType: "PASTED_TEXT" });
    void continueAnalysis({ text, locale, imported });
  }
  function matchesImportedUrl() {
    if (!imported) return false;
    try {
      const current = new URL(url.trim()); const prior = new URL(imported.sourceUrl);
      const host = (value: string) => value === "finn.no" ? "www.finn.no" : value;
      return current.protocol === "https:" && current.username === "" && current.password === "" && current.port === "" && host(current.hostname) === prior.hostname && current.pathname.replace(/\/$/, "") === prior.pathname;
    } catch { return false; }
  }
  function analyzeUrl(e: FormEvent) {
    e.preventDefault();
    if (blocked || running.current) return;
    begin();
    if (matchesImportedUrl()) {
      record("source", "success", { characters: text.length, sourceType: imported?.sourceType ?? "NAV_API", reused: true });
      void continueAnalysis({ text, locale, imported });
    } else {
      setImported(null); setText(""); importing.mutate({ url, locale });
    }
  }
  function changeMode(value: "url" | "text") { setMode(value); importing.reset(); extraction.reset(); setPhase("idle"); }
  const outdated = result !== null && result.source !== text;
  return (
    <section className="workspace" aria-labelledby="analyzer-title">
      <div className="workspace-heading"><div><h2 id="analyzer-title">{t.title}</h2><p>{t.description}</p></div><Badge variant="outline">{locale === "nb" ? "Kildebasert AI" : "Sourced AI"}</Badge></div>
      <div className={`analysis-grid ${result ? "has-result" : ""}`}>
        <Card className={`input-card ${result && !result.analysisFailed && mode === "url" ? "completed-input" : ""}`}><CardHeader><p className="step-label">{t.inputStep}</p>
          <div className="mode-picker" aria-label={locale === "nb" ? "Inndatametode" : "Input method"}>
            <Button type="button" variant={mode === "url" ? "default" : "ghost"} onClick={() => changeMode("url")} disabled={!ready || pending} aria-pressed={mode === "url"}><Link2 />{t.urlMode}</Button>
            <Button type="button" variant={mode === "text" ? "default" : "ghost"} onClick={() => changeMode("text")} disabled={!ready || pending} aria-pressed={mode === "text"}><FileText />{t.textMode}</Button>
          </div></CardHeader><CardContent>
          {mode === "url" && <form onSubmit={analyzeUrl} className="import-form">
            <label htmlFor="job-url">{t.urlLabel}</label><Input id="job-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.finn.no/job/ad/…" maxLength={2048} required disabled={!ready || pending} />
            <p className="hint">{matchesImportedUrl() ? t.reuseSource : t.sourceHelp}</p><Button disabled={blocked} type="submit">{pending ? <LoaderCircle className="animate-spin" /> : <Link2 />}{pending ? (phase === "source" ? t.fetching : phase === "wait" ? t.pacing : t.pending) : t.fetch}</Button>
          </form>}
          {(mode === "text") && <form onSubmit={analyze} className="text-form">
            {imported && <div className="source-meta"><h3>{imported.title}</h3>{imported.sourceType === "GROQ_BROWSER_EXCERPT" && <p className="notice">{t.browserSource}</p>}<a href={imported.sourceUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink}<ArrowUpRight size={14}/></a><p>{t.retrieved}: {new Date(imported.retrievedAt).toLocaleString(locale === "nb" ? "nb-NO" : "en-US")}</p>{text !== imported.text && <p>{t.sourceEdited}</p>}</div>}
            <label htmlFor="job-text">{t.input}</label>{imported && <p className="hint">{t.reviewSource}</p>}
            <Textarea id="job-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={15000} rows={10} disabled={!ready || pending} required />
            <p className="hint character-count">{text.length.toLocaleString(locale === "nb" ? "nb-NO" : "en-US")} / 15 000 · {t.minimum}</p>
            <Button className="analyze-button" type="submit" disabled={blocked}>{pending ? <LoaderCircle className="animate-spin" /> : <Search />}{pending ? (phase === "wait" ? t.pacing : t.pending) : t.submit}<ArrowRight /></Button>
          </form>}
          {!ready && <p role="status" className="hint">{t.starting}</p>}
          <noscript><p className="notice">{t.javascriptRequired}</p></noscript>
          {error && !result?.analysisFailed && !result?.refreshFailed && (error.startsWith("SOURCE_") || error.startsWith("AI_") || error === "NETWORK_ERROR" ? <WorkflowNotice code={error} locale={locale} onPaste={mode === "url" ? () => changeMode("text") : undefined}/> : <Alert variant="destructive" role="alert" className="feedback"><AlertDescription>{t.errors[error as keyof typeof t.errors] ?? t.errors.AI_UNAVAILABLE}</AlertDescription></Alert>)}
          {retryIn > 0 && <p role="status" className="notice">{t.retryWait} {retryIn} {t.seconds}</p>}
          {phase === "cancelled" && <p role="status" className="hint">{t.cancelled}</p>}
          <div className="privacy-note"><ShieldCheck size={18}/><p>{t.privacy}</p></div>
        </CardContent></Card>
        <div className="result-panel">
          <p className="step-label">{t.resultStep}</p>
          {!result && pending && <AnalysisProgress phase={phase} seconds={waitIn} locale={locale} pasted={mode === "text"} paused={pacedRun} onCancel={() => controller.current?.abort()} />}
          {!result && !pending && <Card className="empty-state"><CardContent><div className="empty-icon"><FileText size={30}/></div><h3>{t.emptyTitle}</h3><p>{t.emptyDescription}</p><div className="empty-preview" aria-hidden="true"><span/><span/><span/></div></CardContent></Card>}
          {result && pending && <AnalysisProgress phase={phase} seconds={waitIn} locale={locale} pasted={mode === "text"} paused={pacedRun} onCancel={() => controller.current?.abort()}/>}
          {result && <section aria-labelledby="results-title" lang={result.locale}>
            <h3 id="results-title">{result.imported?.title ?? t.results}</h3>{result.imported && <a className="hint underline" href={result.imported.sourceUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink}<ArrowUpRight size={14} className="inline" /></a>}<p className="hint">{t.review}</p>{result.imported?.sourceType === "GROQ_BROWSER_EXCERPT" && <p className="notice">{t.browserSource}</p>}
            {result.omittedItems > 0 && <p className="notice" role="status">{t.partialEvidence} ({result.omittedItems})</p>}
            {outdated && <Alert variant="destructive" role="alert"><AlertDescription>{t.outdated}</AlertDescription></Alert>}
            {result.locale !== locale && <p className="hint">{t.otherLanguage}</p>}
            {(result.analysisFailed || result.refreshFailed) && <WorkflowNotice code={error ?? "AI_INVALID_RESULT"} locale={locale} retained previous={!!result.refreshFailed}/> }
            <SaveJob key={`save-${resultRevision}`} disabled={outdated || pending} content={{ title: result.imported?.title.slice(0, 200) ?? (locale === "nb" ? "Stillingsannonse" : "Job advertisement"), text: result.source, locale: result.locale, sourceUrl: result.imported?.sourceUrl ?? null, sourceType: result.imported?.sourceType ?? (result.imported ? "NAV_API" : "PASTED_TEXT"), retrievedAt: result.imported?.retrievedAt ?? null, requirements: result.requirements, facts: result.facts, omittedItems: result.omittedItems }}/><JobOverview locallyOrganized={!!result.analysisFailed} sourceText={result.source} facts={result.facts} locale={locale} sourceLocale={result.locale} fallbackText={result.analysisFailed ? result.source : undefined} />
            {!result.analysisFailed && <RequirementResults key={`requirements-${resultRevision}`} requirements={result.requirements} source={result.source} locale={locale} resultLocale={result.locale} browserExcerpt={result.imported?.sourceType === "GROQ_BROWSER_EXCERPT"} outdated={outdated} />}
            <details className="source-evidence"><summary>{t.evidence}</summary><p className="hint">{t.sourceTitle}</p>{result.imported && <p><a href={result.imported.sourceUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink}</a> · {t.retrieved}: {new Date(result.imported.retrievedAt).toLocaleString(locale === "nb" ? "nb-NO" : "en-US")}</p>}<pre>{result.source}</pre></details>
          </section>}
        </div>
      </div>
      {ready && diagnosticsEnabled && <AnalysisDiagnostics events={events} imported={imported} delay={analysisDelaySeconds} locale={locale} />}
    </section>
  );
}
