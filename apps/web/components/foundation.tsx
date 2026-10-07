"use client";

import { useCallback, useEffect, useState } from "react";
import { translations, type Locale } from "../lib/translations";
import { JobAnalyzer } from "./job-analyzer";

type Connection = "loading" | "online" | "offline";

export function Foundation() {
  const [locale, setLocale] = useState<Locale>("nb");
  const [connection, setConnection] = useState<Connection>("loading");
  const t = translations[locale];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("career-agent.locale");
      if (saved === "nb" || saved === "en") setLocale(saved);
    } catch {
      // Language selection still works if browser storage is disabled.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const checkConnection = useCallback(async () => {
    setConnection("loading");
    try {
      const response = await fetch("/api/status");
      const result = await response.json();
      setConnection(response.ok && result.status === "UP" ? "online" : "offline");
    } catch {
      setConnection("offline");
    }
  }, []);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  function changeLocale(value: Locale) {
    setLocale(value);
    try {
      localStorage.setItem("career-agent.locale", value);
    } catch {
      // Persistence is optional; do not block the user's choice.
    }
  }

  return (
    <div className="shell">
      <header>
        <a className="brand" href="/">Career Agent</a>
        <label className="language-picker">
          {t.language}
          <select value={locale} onChange={(event) => changeLocale(event.target.value as Locale)}>
            <option value="nb">Norsk</option>
            <option value="en">English</option>
          </select>
        </label>
      </header>
      <main>
        <p className="eyebrow">{t.stage}</p>
        <h1>{t.title}</h1>
        <p className="introduction">{t.introduction}</p>
        <JobAnalyzer locale={locale} />
        <section aria-labelledby="next-title" className="card">
          <h2 id="next-title">{t.nextTitle}</h2>
          <p>{t.nextDescription}</p>
        </section>
        <section aria-labelledby="connection-title" className="card">
          <h2 id="connection-title">{t.connection}</h2>
          <p role="status" aria-live="polite">{t[connection === "loading" ? "loading" : connection]}</p>
          {connection === "offline" && <button onClick={() => void checkConnection()}>{t.retry}</button>}
        </section>
        <p className="principle">{t.principle}</p>
      </main>
    </div>
  );
}
