"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, FileText, Link2, Search, ShieldCheck, LoaderCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { RequirementResults } from "./requirement-results";
import { isExtraction, type Requirement, type JobFact } from "../lib/job-requirements";
import { isImportedJob, type ImportedJob } from "../lib/job-import";
import { jobTranslations } from "../lib/job-translations";
import type { Locale } from "../lib/translations";

async function post(path: string, input: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const value = await response.json();
  if (!response.ok) throw new Error(typeof value.code === "string" ? value.code : "AI_UNAVAILABLE");
  return value as unknown;
}

export function JobAnalyzer({ locale }: { locale: Locale }) {
  const t = jobTranslations[locale];
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [imported, setImported] = useState<ImportedJob | null>(null);
  const [resultRevision, setResultRevision] = useState(0);
  const [result, setResult] = useState<{ requirements: Requirement[]; facts: JobFact[]; source: string; locale: Locale; imported: ImportedJob | null } | null>(null);
  const extraction = useMutation({ mutationFn: async (input: { text: string; locale: Locale; imported: ImportedJob | null }) => {
    if (input.text.trim().length < 40) throw new Error("INVALID_INPUT");
    const value = await post("/api/jobs/requirements", { text: input.text, locale: input.locale });
    if (!isExtraction(value)) throw new Error("AI_INVALID_RESULT");
    return { requirements: value.requirements, facts: value.facts, source: input.text, locale: input.locale, imported: input.imported };
  }, onSuccess: (value) => { setResult(value); setResultRevision(revision => revision + 1); } });
  const importing = useMutation({ mutationFn: async (input: { url: string; locale: Locale }) => {
    const value = await post("/api/jobs/import", { url: input.url });
    if (!isImportedJob(value)) throw new Error("SOURCE_INVALID");
    return { job: value, locale: input.locale };
  }, onSuccess: ({ job, locale: resultLocale }) => { setImported(job); setText(job.text); extraction.mutate({ text: job.text, locale: resultLocale, imported: job }); } });
  const pending = extraction.isPending || importing.isPending;
  const error = importing.error?.message ?? extraction.error?.message;
  function analyze(e: FormEvent) { e.preventDefault(); if (!pending) { importing.reset(); setResult(null); extraction.mutate({ text, locale, imported }); } }
  function changeMode(value: "url" | "text") { setMode(value); importing.reset(); extraction.reset(); }
  const outdated = result !== null && result.source !== text;
  return (
    <section className="workspace" aria-labelledby="analyzer-title">
      <div className="workspace-heading"><div><h2 id="analyzer-title">{t.title}</h2><p>{t.description}</p></div><Badge variant="outline">{locale === "nb" ? "Kildebasert AI" : "Sourced AI"}</Badge></div>
      <div className={`analysis-grid ${result ? "has-result" : ""}`}>
        <Card className={`input-card ${result && mode === "url" ? "completed-input" : ""}`}><CardHeader><p className="step-label">{t.inputStep}</p>
          <div className="mode-picker" aria-label={locale === "nb" ? "Inndatametode" : "Input method"}>
            <Button variant={mode === "url" ? "default" : "ghost"} onClick={() => changeMode("url")} disabled={pending} aria-pressed={mode === "url"}><Link2 />{t.urlMode}</Button>
            <Button variant={mode === "text" ? "default" : "ghost"} onClick={() => changeMode("text")} disabled={pending} aria-pressed={mode === "text"}><FileText />{t.textMode}</Button>
          </div></CardHeader><CardContent>
          {mode === "url" && <form onSubmit={(e) => { e.preventDefault(); if (!pending) { extraction.reset(); setResult(null); setImported(null); importing.mutate({ url, locale }); } }} className="import-form">
            <label htmlFor="job-url">{t.urlLabel}</label><Input id="job-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.finn.no/job/ad/…" maxLength={2048} required disabled={pending} />
            <p className="hint">{t.sourceHelp}</p><Button disabled={pending} type="submit">{pending ? <LoaderCircle className="animate-spin" /> : <Link2 />}{pending ? (importing.isPending ? t.fetching : t.pending) : t.fetch}</Button>
          </form>}
          {(mode === "text") && <form onSubmit={analyze} className="text-form">
            {imported && <div className="source-meta"><h3>{imported.title}</h3>{imported.sourceType === "GROQ_BROWSER_EXCERPT" && <p className="notice">{t.browserSource}</p>}<a href={imported.sourceUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink}<ArrowUpRight size={14}/></a><p>{t.retrieved}: {new Date(imported.retrievedAt).toLocaleString(locale === "nb" ? "nb-NO" : "en-US")}</p>{text !== imported.text && <p>{t.sourceEdited}</p>}</div>}
            <label htmlFor="job-text">{t.input}</label>{imported && <p className="hint">{t.reviewSource}</p>}
            <Textarea id="job-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={15000} rows={10} disabled={pending} required />
            <p className="hint character-count">{text.length.toLocaleString(locale === "nb" ? "nb-NO" : "en-US")} / 15 000 · {t.minimum}</p>
            <Button className="analyze-button" type="submit" disabled={pending}>{extraction.isPending ? <LoaderCircle className="animate-spin" /> : <Search />}{extraction.isPending ? t.pending : t.submit}<ArrowRight /></Button>
          </form>}
          {error && <Alert variant="destructive" role="alert" className="feedback"><AlertDescription>{t.errors[error as keyof typeof t.errors] ?? t.errors.AI_UNAVAILABLE}</AlertDescription></Alert>}
          {pending && <p role="status" className="hint">{importing.isPending ? t.fetching : t.pending}</p>}
          <div className="privacy-note"><ShieldCheck size={18}/><p>{t.privacy}</p></div>
        </CardContent></Card>
        <div className="result-panel">
          <p className="step-label">{t.resultStep}</p>
          {!result && <Card className="empty-state"><CardContent><div className="empty-icon"><FileText size={30}/></div><h3>{extraction.isPending ? t.pending : t.emptyTitle}</h3><p>{t.emptyDescription}</p><div className="empty-preview" aria-hidden="true"><span/><span/><span/></div></CardContent></Card>}
          {result && <section aria-labelledby="results-title" lang={result.locale}>
            <h3 id="results-title">{result.imported?.title ?? t.results}</h3>{result.imported && <a className="hint underline" href={result.imported.sourceUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink}<ArrowUpRight size={14} className="inline" /></a>}<p className="hint">{t.review}</p>{result.imported?.sourceType === "GROQ_BROWSER_EXCERPT" && <p className="notice">{t.browserSource}</p>}
            {outdated && <Alert variant="destructive" role="alert"><AlertDescription>{t.outdated}</AlertDescription></Alert>}
            {result.locale !== locale && <p className="hint">{t.otherLanguage}</p>}
            <section aria-labelledby="overview-title" className="job-overview"><h4 id="overview-title">{t.overview}</h4>
              {result.facts.length === 0 && <p className="hint">{t.noFacts}</p>}
              <div className="job-facts">{result.facts.map((fact, index) => <Card key={index}><CardContent>
                <p className="fact-label">{fact.label}</p><p className="fact-value">{fact.value}</p>
                <details><summary>{t.originalQuote}</summary><blockquote>{fact.quote}</blockquote></details>
              </CardContent></Card>)}</div><p className="hint">{t.missingFacts}</p>
            </section>
            <RequirementResults key={resultRevision} requirements={result.requirements} source={result.source} locale={locale} resultLocale={result.locale} browserExcerpt={result.imported?.sourceType === "GROQ_BROWSER_EXCERPT"} outdated={outdated} />
            <details className="source-evidence"><summary>{t.evidence}</summary><p className="hint">{t.sourceTitle}</p>{result.imported && <p><a href={result.imported.sourceUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink}</a> · {t.retrieved}: {new Date(result.imported.retrievedAt).toLocaleString(locale === "nb" ? "nb-NO" : "en-US")}</p>}<pre>{result.source}</pre></details>
          </section>}
        </div>
      </div>
    </section>
  );
}
