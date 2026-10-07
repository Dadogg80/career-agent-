"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, ArrowUpRight, Compass, ShieldCheck, CircleCheck, CircleAlert } from "lucide-react";
import { translations, type Locale } from "../lib/translations";
import { JobAnalyzer } from "./job-analyzer";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function Foundation() {
  const [locale, setLocale] = useState<Locale>("nb");
  const t = translations[locale];
  const connection = useQuery({ queryKey: ["system-status"], queryFn: async () => {
    const response = await fetch("/api/status"); const value = await response.json();
    if (!response.ok || value.status !== "UP") throw new Error("Unavailable"); return value;
  } });
  useEffect(() => { try { const saved = localStorage.getItem("career-agent.locale"); if (saved === "nb" || saved === "en") setLocale(saved); } catch {} }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  function changeLocale(value: Locale) { setLocale(value); try { localStorage.setItem("career-agent.locale", value); } catch {} }
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="/"><span className="brand-mark"><BriefcaseBusiness size={20}/></span>Career Agent<span className="brand-dot">.</span></a>
      <p className="nav-caption">{locale === "nb" ? "ARBEIDSOMRÅDE" : "WORKSPACE"}</p><a className="nav-active" href="#analyzer-title"><Compass size={18}/>{locale === "nb" ? "Stillingsanalyse" : "Job analysis"}<ArrowUpRight size={15}/></a>
      <div className="sidebar-note"><ShieldCheck size={22}/><h2>{locale === "nb" ? "Din erfaring, korrekt fortalt." : "Your experience, accurately told."}</h2><p>{t.principle}</p></div><Badge variant="outline" className="pilot-badge">{locale === "nb" ? "Pilot · ikke lagret" : "Pilot · not saved"}</Badge>
    </aside>
    <div className="main-shell"><header className="topbar"><span>{locale === "nb" ? "Jobbsøking med retning" : "A clearer path to your next role"}</span><label className="language-picker">{t.language}<select value={locale} onChange={(e) => changeLocale(e.target.value as Locale)}><option value="nb">Norsk</option><option value="en">English</option></select></label></header>
      <main><div className="page-intro"><p className="eyebrow">{locale === "nb" ? "FRA ANNONSE TIL OVERSIKT" : "FROM ADVERTISEMENT TO CLARITY"}</p><h1>{t.title}</h1><p className="introduction">{t.introduction}</p></div><JobAnalyzer locale={locale}/>
      <footer className="app-footer"><div className="connection-status">{connection.isError ? <CircleAlert size={15}/> : <CircleCheck size={15}/>}<span role="status">{t[connection.isFetching ? "loading" : connection.isError ? "offline" : "online"]}</span>{connection.isError && <Button variant="ghost" size="sm" onClick={() => void connection.refetch()}>{t.retry}</Button>}</div><span>{locale === "nb" ? "Profil og personlig matching kommer senere" : "Profiles and personal matching are coming later"}</span></footer>
      </main>
    </div>
  </div>;
}
