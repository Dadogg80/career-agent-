"use client";
import { retryAfterSeconds as parseRetryAfter, retryWaitLabel } from "../lib/retry-after";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAiChoice } from "../lib/use-ai-configuration";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, ChevronDown, CircleHelp, FileText, Link2, ListChecks, LoaderCircle, Quote, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { WorkflowNotice } from "./workflow-notice";
import { AiChoice, AiIdentity } from "./ai-identity";
import type { AiSelection } from "../lib/ai-configuration";
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

type ManualFactKind = "LOCATION" | "CONTACT" | "DEADLINE" | "OTHER";
type ManualJobFact = { id: string; source: string; fact: JobFact };
function isManualFactKind(value: string): value is ManualFactKind {
  return value === "LOCATION" || value === "CONTACT" || value === "DEADLINE" || value === "OTHER";
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
    throw new RequestFailure(code, response.status === 429 && providerRateLimit ? (parseRetryAfter(retryAfter) ?? 60) : undefined, response.status, durationMs, safeAnalysisReason(value?.reason));
  }
  return { value: value as unknown, httpStatus: response.status, durationMs };
}

export function JobAnalyzer({ locale }: { locale: Locale }) {
  const t = jobTranslations[locale];
  const choice=useAiChoice("job"); const selection=choice.approval?.selections[0];
  const sourceChoice=useAiChoice("sourceRetrieval"); const sourceSelection=sourceChoice.approval?.selections[0];
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
  function failed(error: Error, stage: AnalysisStage, characters?: number) {
    if (!mounted.current) return;
    running.current = false; setPhase("error");
    const diagnosticSelection = stage === "source" ? (sourceSelection ?? choice.configuration.data?.sourceBrowser) : selection;
    record(stage, "error", {
      code: Object.hasOwn(t.errors, error.message) ? error.message : stage === "source" ? "SOURCE_UNAVAILABLE" : "AI_UNAVAILABLE",
      ...(stage === "source" ? { endpoint: "/api/jobs/import" as const } : stage === "analysis" ? { endpoint: "/api/jobs/requirements" as const } : {}),
      ...(characters !== undefined ? { characters } : {}),
      ...(diagnosticSelection ? { provider: diagnosticSelection.provider, model: diagnosticSelection.model } : {}),
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
  const [result, setResult] = useState<{ requirements: Requirement[]; facts: JobFact[]; omittedItems: number; source: string; locale: Locale; imported: ImportedJob | null; analysisFailed?: boolean; refreshFailed?: boolean; aiSelection?:AiSelection|null } | null>(null);
  const [manualFacts, setManualFacts] = useState<ManualJobFact[]>([]);
  const [manualKind, setManualKind] = useState<ManualFactKind>("LOCATION");
  const [manualTitle, setManualTitle] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [manualQuote, setManualQuote] = useState("");
  const [manualError, setManualError] = useState("");
  const sourceReaderRef = useRef<HTMLDetailsElement | null>(null);
  const extraction = useMutation({ mutationFn: async (input: { text: string; locale: Locale; imported: ImportedJob | null }) => {
    if (input.text.trim().length < 40) throw new Error("INVALID_INPUT");
    setPhase("analysis"); record("analysis", "running", { endpoint: "/api/jobs/requirements", characters: input.text.length, provider:selection?.provider, model:selection?.model });
    const response = await post("/api/jobs/requirements", { text: input.text, locale: input.locale, ...(choice.approval?.token?{aiApproval:choice.approval.token}:{}) }, controller.current?.signal);
    if (!isExtraction(response.value)) throw new RequestFailure("AI_INVALID_RESULT", undefined, response.httpStatus, response.durationMs);
    return { aiSelection:response.value.aiSelection, requirements: response.value.requirements, facts: response.value.facts, omittedItems: response.value.omittedItems ?? 0, source: input.text, locale: input.locale, imported: input.imported, httpStatus: response.httpStatus, durationMs: response.durationMs };
  }, onError: (error, input) => {
    failed(error, "analysis", input.text.length);
    if (mounted.current && !controller.current?.signal.aborted && input.text.trim()) {
      setResult(previous => previous && previous.source === input.text && !previous.analysisFailed ? { ...previous, refreshFailed: true } : { requirements: [], facts: [], omittedItems: 0, source: input.text, locale: input.locale, imported: input.imported, analysisFailed: true });
      setResultRevision(revision => revision + 1);
    }
  }, onSuccess: ({ httpStatus, durationMs, ...value }) => {
    if (!mounted.current) return;
    running.current = false; setPhase("done");
    record("analysis", "success", { endpoint: "/api/jobs/requirements", httpStatus, durationMs, requirements: value.requirements.length, facts: value.facts.length, omittedItems: value.omittedItems, provider:value.aiSelection?.provider, model:value.aiSelection?.model });
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
    setPhase("source"); record("source", "running", { endpoint: "/api/jobs/import", provider: sourceSelection?.provider, model: sourceSelection?.model });
    const response = await post("/api/jobs/import", { url: input.url, ...(sourceChoice.approval?.token ? { aiApproval: sourceChoice.approval.token } : {}) }, controller.current?.signal);
    if (!isImportedJob(response.value)) throw new RequestFailure("SOURCE_INVALID", undefined, response.httpStatus, response.durationMs);
    return { job: response.value, locale: input.locale, httpStatus: response.httpStatus, durationMs: response.durationMs };
  }, onError: error => failed(error, "source"), onSuccess: async ({ job, locale: resultLocale, httpStatus, durationMs }) => {
    if (!mounted.current) return;
    setImported(job); setText(job.text);
    record("source", "success", { endpoint: "/api/jobs/import", httpStatus, durationMs, characters: job.text.length, sourceType: job.sourceType ?? "NAV_API",provider:job.aiSelection?.provider,model:job.aiSelection?.model });
    nextAnalysisAt.current = job.sourceType === "GROQ_BROWSER_EXCERPT" && selection?.provider !== "Gemini" ? Date.now() + analysisDelaySeconds * 1000 : 0;
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
      record("source", "success", { characters: text.length, sourceType: imported?.sourceType ?? "NAV_API", reused: true,provider:imported?.aiSelection?.provider,model:imported?.aiSelection?.model });
      void continueAnalysis({ text, locale, imported });
    } else {
      setImported(null); setText(""); importing.mutate({ url, locale });
    }
  }
  function addManualFact(e: FormEvent) {
    e.preventDefault();
    if (!result) return;
    const value = manualValue.trim();
    const quote = manualQuote.trim();
    const title = manualTitle.trim();
    const current = manualFacts.filter(item => item.source === result.source).map(item => item.fact);
    if (!value || value.length > 500 || !quote || quote.length > 1000 || !result.source.includes(quote)) {
      setManualError(t.manualQuoteError);
      return;
    }
    if (manualKind === "OTHER" && (!title || title.length > 60)) {
      setManualError(t.manualTitleError);
      return;
    }
    if (result.facts.length + current.length >= 20) {
      setManualError(t.manualFactLimit);
      return;
    }
    if ([...result.facts, ...current].some(fact => fact.kind === manualKind && fact.value === value && fact.quote === quote)) {
      setManualError(t.manualDuplicateError);
      return;
    }
    const fact: JobFact = {
      kind: manualKind,
      label: manualKind === "OTHER" ? `${t.manualSourceLabel}: ${title}` : t.manualSourceLabel,
      value,
      quote,
    };
    setManualFacts(previous => [...previous, { id: crypto.randomUUID(), source: result.source, fact }]);
    setManualTitle(""); setManualValue(""); setManualQuote(""); setManualError("");
  }
  function changeMode(value: "url" | "text") { setMode(value); importing.reset(); extraction.reset(); setPhase("idle"); }
  const outdated = result !== null && result.source !== text;
  const currentManualFacts = result ? manualFacts.filter(item => item.source === result.source) : [];
  const isSourceExcerpt = Boolean(result?.imported && ["GROQ_BROWSER_EXCERPT", "GEMINI_URL_CONTEXT_EXCERPT"].includes(result.imported.sourceType ?? ""));
  const overviewFacts = result ? [...result.facts, ...currentManualFacts.map(item => item.fact)] : [];
  const requirementCounts = result ? [
    { label: t.requiredCount, count: result.requirements.filter(requirement => requirement.kind === "REQUIRED").length, icon: ShieldCheck, tone: "required" },
    { label: t.preferredCount, count: result.requirements.filter(requirement => requirement.kind === "PREFERRED").length, icon: Sparkles, tone: "preferred" },
    { label: t.unclearCount, count: result.requirements.filter(requirement => requirement.kind === "UNCLEAR").length, icon: CircleHelp, tone: "unclear" },
  ] : [];
  return (
    <section className="workspace job-analysis-workspace" aria-labelledby="analyzer-title">
      <div className="workspace-heading job-analysis-heading">
        <div className="job-analysis-heading-copy">
          <span className="job-analysis-heading-icon"><FileText aria-hidden="true"/></span>
          <div><p className="job-analysis-overline">{locale === "nb" ? "ANNONSE → INNSIKT" : "ADVERTISEMENT → INSIGHT"}</p><h2 id="analyzer-title">{t.workspaceTitle}</h2><p>{t.workspaceDescription}</p></div>
        </div>
        <div className="job-analysis-model-choices" aria-label={locale==="nb"?"Modellvalg per oppgave":"Model selection by task"}>
          <AiChoice area="sourceRetrieval" label={locale==="nb"?"Hent annonse":"Retrieve ad"} approval={sourceChoice.approval} options={sourceChoice.options} choose={sourceChoice.choose} disabled={pending || mode!=="url"} locale={locale}/>
          <AiChoice area="job" label={locale==="nb"?"Analyser krav":"Analyze requirements"} approval={choice.approval} options={choice.options} choose={token=>{choice.choose(token);setCooldownUntil(0);setRetryIn(0);extraction.reset();}} disabled={pending} locale={locale}/>
        </div>
      </div>
      <div className={`analysis-grid ${result ? "has-result" : ""} ${!result && !pending && mode === "text" ? "is-paste-entry" : ""}`}>
        <aside className="analysis-source-rail" aria-label={t.sourcePanel}>
        <Card className={`input-card job-analysis-input-card ${result && !result.analysisFailed && mode === "url" ? "completed-input" : ""}`}><CardHeader><div className="job-analysis-input-heading"><span className="job-analysis-step">01</span><p className="step-label">{t.inputStep}</p></div>
          <div className="mode-picker" aria-label={locale === "nb" ? "Inndatametode" : "Input method"}>
            <Button type="button" variant={mode === "url" ? "default" : "ghost"} onClick={() => changeMode("url")} disabled={!ready || pending} aria-pressed={mode === "url"}><Link2 />{t.urlMode}</Button>
            <Button type="button" variant={mode === "text" ? "default" : "ghost"} onClick={() => changeMode("text")} disabled={!ready || pending} aria-pressed={mode === "text"}><FileText />{t.textMode}</Button>
          </div></CardHeader><CardContent>
          {mode === "url" && <form onSubmit={analyzeUrl} className="import-form">
            <label htmlFor="job-url">{t.urlLabel}</label><Input id="job-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.finn.no/job/ad/…" maxLength={2048} required disabled={!ready || pending} />
            <p className="hint">{matchesImportedUrl() ? t.reuseSource : t.sourceHelp}</p><Button disabled={blocked} type="submit">{pending ? <LoaderCircle className="animate-spin" /> : <Link2 />}{pending ? (phase === "source" ? t.fetching : phase === "wait" ? t.pacing : t.pending) : t.fetch}</Button>
          </form>}
          {(mode === "text") && <form onSubmit={analyze} className="text-form">
            {imported && <div className="source-meta"><h3>{imported.title}</h3>{imported.sourceType === "GROQ_BROWSER_EXCERPT" && <p className="notice">{t.browserSource}</p>}{imported.sourceType === "GEMINI_URL_CONTEXT_EXCERPT" && <p className="notice">{t.geminiSource}</p>}<a href={imported.sourceUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink}<ArrowUpRight size={14}/></a><p>{t.retrieved}: {new Date(imported.retrievedAt).toLocaleString(locale === "nb" ? "nb-NO" : "en-US")}</p>{text !== imported.text && <p>{t.sourceEdited}</p>}</div>}
            <label htmlFor="job-text">{t.input}</label>{imported && <p className="hint">{t.reviewSource}</p>}
            <Textarea id="job-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={15000} rows={10} disabled={!ready || pending} required />
            <p className="hint character-count">{text.length.toLocaleString(locale === "nb" ? "nb-NO" : "en-US")} / 15 000 · {t.minimum}</p>
            <Button className="analyze-button" type="submit" disabled={blocked}>{pending ? <LoaderCircle className="animate-spin" /> : <Search />}{pending ? (phase === "wait" ? t.pacing : t.pending) : t.submit}<ArrowRight /></Button>
          </form>}
          {!ready && <p role="status" className="hint">{t.starting}</p>}
          <noscript><p className="notice">{t.javascriptRequired}</p></noscript>
          {error && !result?.analysisFailed && !result?.refreshFailed && (error.startsWith("SOURCE_") || error.startsWith("AI_") || error === "NETWORK_ERROR" ? <WorkflowNotice code={error} locale={locale} onPaste={mode === "url" ? () => changeMode("text") : undefined}/> : <Alert variant="destructive" role="alert" className="feedback"><AlertDescription>{t.errors[error as keyof typeof t.errors] ?? t.errors.AI_UNAVAILABLE}</AlertDescription></Alert>)}
          {error?.startsWith("AI_") && ["AI_RATE_LIMITED","AI_INVALID_RESULT","AI_UNAVAILABLE","AI_ACCESS_DENIED"].includes(error) && choice.alternatives.map(option=><Button key={option.approval.token} size="sm" variant="outline" onClick={()=>{choice.choose(option.approval.token);setCooldownUntil(0);setRetryIn(0);extraction.reset();}}>{locale==="nb"?"Prøv med":"Try with"} {option.approval.selections.map(s=>`${s.provider} · ${s.model}`).join(" / ")}</Button>)}
          {retryIn > 0 && <p role="status" className="notice">{t.retryWait} {retryIn >= 60 ? retryWaitLabel(retryIn) : `${retryIn} ${t.seconds}`}</p>}
          {phase === "cancelled" && <p role="status" className="hint">{t.cancelled}</p>}
          <details className="privacy-note"><summary><ShieldCheck size={16}/><span>{t.privacySummary}</span><ChevronDown size={14}/></summary><p>{t.privacy.replaceAll("{{sourceProvider}}", sourceSelection?.provider ?? (locale==="nb"?"valgt kildeleverandør":"selected source provider")).replaceAll("{{analysisProvider}}", selection?.provider ?? (locale==="nb"?"valgt AI-leverandør":"selected AI provider"))}</p></details>
        </CardContent></Card>
        </aside>
        <div className="result-panel">
          <p className="step-label">{t.resultStep}</p>
          {!result && pending && <AnalysisProgress sourceSelection={/^https:\/\/(?:www\.)?finn\.no\//i.test(url.trim())?sourceSelection:undefined} selection={selection} phase={phase} seconds={waitIn} locale={locale} pasted={mode === "text"} paused={pacedRun} onCancel={() => controller.current?.abort()} />}
          {!result && !pending && <Card className="empty-state job-analysis-empty"><CardContent>
            <div className="analysis-empty-intro"><div className="empty-icon"><FileText size={27}/></div><p className="analysis-empty-kicker">{locale==="nb"?"KLAR FOR ANNONSEN":"READY FOR THE AD"}</p><h3>{t.emptyTitle}</h3><p>{t.emptyDescription}</p></div>
            <div className="analysis-preview-points" aria-label={locale==="nb"?"Dette får du i analysen":"What the analysis includes"}>
              <p>{locale==="nb"?"I ARBEIDSFLYTEN":"IN YOUR WORKSPACE"}</p>
              <div><span className="analysis-preview-step">01</span><span className="analysis-preview-icon"><Quote aria-hidden="true"/></span><span>{t.previewEvidence}</span></div>
              <div><span className="analysis-preview-step">02</span><span className="analysis-preview-icon"><Sparkles aria-hidden="true"/></span><span>{t.previewCategories}</span></div>
              <div><span className="analysis-preview-step">03</span><span className="analysis-preview-icon"><CircleHelp aria-hidden="true"/></span><span>{t.previewClarifications}</span></div>
            </div>
          </CardContent></Card>}
          {result && pending && <AnalysisProgress sourceSelection={/^https:\/\/(?:www\.)?finn\.no\//i.test(url.trim())?sourceSelection:undefined} selection={selection} phase={phase} seconds={waitIn} locale={locale} pasted={mode === "text"} paused={pacedRun} onCancel={() => controller.current?.abort()}/>}
          {result && <section aria-labelledby="results-title" lang={result.locale}>
            <div className="analysis-result-header">
              <div className="analysis-result-title"><span className="analysis-result-icon"><ListChecks aria-hidden="true"/></span><div><p className="analysis-result-overline">{locale === "nb" ? "ANNONSEN ER GJENNOMGÅTT" : "ADVERTISEMENT REVIEWED"}</p><h3 id="results-title">{result.imported?.title ?? t.results}</h3>{result.imported && <a className="analysis-source-link" href={result.imported.sourceUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink}<ArrowUpRight size={14} aria-hidden="true" /></a>}</div></div>
              <div className="analysis-result-identities">{result.imported?.aiSelection && <AiIdentity selections={[result.imported.aiSelection]} locale={locale} label={locale==="nb"?"Kildeinnhenting":"Source retrieval"}/>} {result.aiSelection && <AiIdentity selections={[result.aiSelection]} locale={locale} label={locale==="nb"?"Brukt i analysen":"Used in this analysis"}/>}</div>
            </div>
            {!result.analysisFailed && <div className="analysis-result-stats" aria-label={locale === "nb" ? "Kategorier i analysen" : "Analysis categories"}>{requirementCounts.map(({ label, count, icon: Icon, tone }) => <div className={`analysis-result-stat analysis-result-stat-${tone}`} key={tone}><span className="analysis-result-stat-icon"><Icon aria-hidden="true"/></span><span className="analysis-result-stat-label">{label}</span><strong>{count}</strong></div>)}</div>}
            {!result.analysisFailed && <p className="analysis-review-note"><ShieldCheck aria-hidden="true"/><span>{t.review}</span></p>}
            {(isSourceExcerpt || result.omittedItems > 0) && <div className="analysis-quality-notices" aria-label={locale === "nb" ? "Kilde- og analyseforbehold" : "Source and analysis notes"}>
              {isSourceExcerpt && <details className="analysis-quality-item analysis-quality-source">
                <summary><span className="analysis-quality-icon"><FileText aria-hidden="true"/></span><span><strong>{t.sourceExcerptLabel}</strong><small>{result.imported?.sourceType === "GEMINI_URL_CONTEXT_EXCERPT" ? t.geminiSourceShort : t.browserSourceShort}</small></span><ChevronDown aria-hidden="true"/></summary>
                <p>{result.imported?.sourceType === "GEMINI_URL_CONTEXT_EXCERPT" ? t.geminiSource : t.browserSource}</p>
              </details>}
              {result.omittedItems > 0 && <details className="analysis-quality-item analysis-quality-omissions">
                <summary><span className="analysis-quality-icon"><CircleHelp aria-hidden="true"/></span><span><strong>{result.omittedItems} {t.omittedCountLabel}</strong><small>{t.partialEvidenceShort}</small></span><ChevronDown aria-hidden="true"/></summary>
                <div className="analysis-quality-detail"><p>{t.omissionsHelp}</p>
                  <Button type="button" variant="outline" size="sm" className="manual-source-jump" onClick={() => { const reader=sourceReaderRef.current; if(reader){reader.open=true;reader.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});} }}><FileText size={14}/>{t.reviewSourceText}</Button>
                  <form className="manual-job-fact-form" onSubmit={addManualFact}>
                    <h5>{t.manualReview}</h5><p>{t.manualReviewHelp}</p>
                    <label htmlFor="manual-fact-kind">{t.manualCategory}</label>
                    <select id="manual-fact-kind" value={manualKind} disabled={outdated || pending} onChange={event=>{if(isManualFactKind(event.target.value))setManualKind(event.target.value);setManualError("");}}>
                      <option value="LOCATION">{t.manualLocation}</option><option value="CONTACT">{t.manualContact}</option><option value="DEADLINE">{t.manualDeadline}</option><option value="OTHER">{t.manualOther}</option>
                    </select>
                    {manualKind==="OTHER" && <><label htmlFor="manual-fact-title">{t.manualTitle}</label><Input id="manual-fact-title" value={manualTitle} onChange={event=>{setManualTitle(event.target.value);setManualError("");}} maxLength={60} disabled={outdated || pending} required/></>}
                    <label htmlFor="manual-fact-value">{t.manualValue}</label><Input id="manual-fact-value" value={manualValue} onChange={event=>{setManualValue(event.target.value);setManualError("");}} maxLength={500} disabled={outdated || pending} required/>
                    <label htmlFor="manual-fact-quote">{t.manualQuote}</label><Textarea id="manual-fact-quote" value={manualQuote} onChange={event=>{setManualQuote(event.target.value);setManualError("");}} maxLength={1000} rows={3} disabled={outdated || pending} required/>
                    <span className="manual-fact-quote-help">{t.manualQuoteHelp}</span>
                    {manualError && <p className="manual-fact-error" role="alert">{manualError}</p>}
                    <div className="manual-fact-form-footer"><span>{result.facts.length+currentManualFacts.length} / 20 {locale==="nb"?"opplysninger":"details"}</span><Button type="submit" size="sm" disabled={outdated || pending}>{t.manualAdd}</Button></div>
                  </form>
                  {currentManualFacts.length>0 && <ul className="manual-fact-list" aria-label={locale==="nb"?"Manuelt tillagte kildeopplysninger":"Manually added source details"}>{currentManualFacts.map(item=><li key={item.id}><div><strong>{item.fact.label.replace(`${t.manualSourceLabel}: `,"")}</strong><span>{item.fact.value}</span><details><summary>{t.originalQuote}</summary><blockquote lang={result.locale}>{item.fact.quote}</blockquote></details></div><Button type="button" variant="ghost" size="sm" aria-label={`${t.manualRemove}: ${item.fact.value}`} onClick={()=>setManualFacts(previous=>previous.filter(candidate=>candidate.id!==item.id))}><X size={14}/></Button></li>)}</ul>}
                </div>
              </details>}
            </div>}
            {outdated && <Alert variant="destructive" role="alert"><AlertDescription>{t.outdated}</AlertDescription></Alert>}
            {result.locale !== locale && <p className="hint">{t.otherLanguage}</p>}
            {(result.analysisFailed || result.refreshFailed) && <WorkflowNotice code={error ?? "AI_INVALID_RESULT"} locale={locale} retained previous={!!result.refreshFailed}/> }
            <JobOverview locallyOrganized={!!result.analysisFailed} sourceText={result.source} facts={overviewFacts} locale={locale} sourceLocale={result.locale} fallbackText={result.analysisFailed ? result.source : undefined} sourceReaderRef={sourceReaderRef} />
            <SaveJob key={`save-${resultRevision}`} disabled={outdated || pending} content={{ title: result.imported?.title.slice(0, 200) ?? (locale === "nb" ? "Stillingsannonse" : "Job advertisement"), text: result.source, locale: result.locale, sourceUrl: result.imported?.sourceUrl ?? null, sourceType: result.imported?.sourceType ?? (result.imported ? "NAV_API" : "PASTED_TEXT"), retrievedAt: result.imported?.retrievedAt ?? null, requirements: result.requirements, facts: overviewFacts, omittedItems: result.omittedItems }}/>
            {!result.analysisFailed && <RequirementResults key={`requirements-${resultRevision}`} requirements={result.requirements} source={result.source} locale={locale} resultLocale={result.locale} browserExcerpt={isSourceExcerpt} outdated={outdated} />}
            <details className="source-evidence"><summary>{t.evidence}</summary><p className="hint">{t.sourceTitle}</p>{result.imported && <p><a href={result.imported.sourceUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink}</a> · {t.retrieved}: {new Date(result.imported.retrievedAt).toLocaleString(locale === "nb" ? "nb-NO" : "en-US")}</p>}</details>
          </section>}
        </div>
      </div>
      {ready && diagnosticsEnabled && <AnalysisDiagnostics events={events} imported={imported} delay={analysisDelaySeconds} locale={locale} />}
    </section>
  );
}
