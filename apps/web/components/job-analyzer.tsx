"use client";

import { useState, type FormEvent } from "react";
import { isExtraction, type Requirement } from "../lib/job-requirements";
import { jobTranslations } from "../lib/job-translations";
import type { Locale } from "../lib/translations";

export function JobAnalyzer({ locale }: { locale: Locale }) {
  const t = jobTranslations[locale];
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ requirements: Requirement[]; source: string; locale: Locale } | null>(null);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    if (text.trim().length < 40) { setError("INVALID_INPUT"); return; }
    const source = text;
    const resultLocale = locale;
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/jobs/requirements", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source, locale: resultLocale }),
      });
      const value = await response.json();
      if (!response.ok) { setError(typeof value.code === "string" ? value.code : "AI_UNAVAILABLE"); return; }
      if (!isExtraction(value)) { setError("AI_INVALID_RESULT"); return; }
      setResult({ requirements: value.requirements, source, locale: resultLocale });
    } catch {
      setError("AI_UNAVAILABLE");
    } finally {
      setPending(false);
    }
  }

  const outdated = result !== null && result.source !== text;
  return (
    <section className="card analyzer" aria-labelledby="analyzer-title">
      <h2 id="analyzer-title">{t.title}</h2>
      <p>{t.description}</p>
      <p className="notice">{t.privacy}</p>
      <form onSubmit={analyze}>
        <label htmlFor="job-text">{t.input}</label>
        <textarea id="job-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={15000} rows={9} disabled={pending} required />
        <p className="hint">{text.length.toLocaleString(locale === "nb" ? "nb-NO" : "en-US")} / 15 000 · {t.minimum}</p>
        <button type="submit" disabled={pending}>{pending ? t.pending : t.submit}</button>
      </form>
      {pending && <p role="status">{t.pending}</p>}
      {error && <p role="alert">{t.errors[error as keyof typeof t.errors] ?? t.errors.AI_UNAVAILABLE}</p>}
      {result && (
        <section aria-labelledby="results-title" lang={result.locale}>
          <h3 id="results-title">{t.results}</h3>
          <p>{t.review}</p>
          {outdated && <p role="alert">{t.outdated}</p>}
          {result.locale !== locale && <p className="notice">{t.otherLanguage}</p>}
          {result.requirements.length === 0 ? <p>{t.empty}</p> : (
            <ul className="requirements">
              {result.requirements.map((r, i) => (
                <li key={i}>
                  <span className="badge">{t.kinds[r.kind]}</span>
                  <h4>{r.label}</h4>
                  <blockquote>{r.quote}</blockquote>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  );
}
