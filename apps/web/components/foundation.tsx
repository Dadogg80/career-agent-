"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, ArrowUpRight, Compass, ShieldCheck, CircleCheck, CircleAlert } from "lucide-react";
import { translations, type Locale } from "../lib/translations";
import { JobAnalyzer } from "./job-analyzer";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { SavedJobsWorkspace } from "./saved-jobs-workspace";
import { ProfileWorkspace } from "./profile-workspace";

export function Foundation({ view = "jobs" }: { view?: "jobs" | "profile" | "saved" }) {
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
      <p className="nav-caption">{locale === "nb" ? "ARBEIDSOMRÅDE" : "WORKSPACE"}</p><Link className={view === "jobs" ? "nav-active" : "nav-link"} href="/"><Compass size={18}/>{locale === "nb" ? "Stillingsanalyse" : "Job analysis"}<ArrowUpRight size={15}/></Link>
      <Link className={view === "profile" ? "nav-active" : "nav-link"} href="/career/profile">{locale === "nb" ? "Min profil" : "My profile"}</Link>
      <Link className={view === "saved" ? "nav-active" : "nav-link"} href="/jobs/saved">{locale === "nb" ? "Mine stillinger" : "Saved jobs"}</Link>
      <div className="sidebar-note"><ShieldCheck size={22}/><h2>{locale === "nb" ? "Din erfaring, korrekt fortalt." : "Your experience, accurately told."}</h2><p>{t.principle}</p></div><Badge variant="outline" className="pilot-badge">{locale === "nb" ? "Lokal pilot" : "Local pilot"}</Badge>
    </aside>
    <div className="main-shell"><header className="topbar"><nav aria-label={locale === "nb" ? "Arbeidsområde" : "Workspace"} className="topbar-nav"><Link href="/" aria-current={view === "jobs" ? "page" : undefined}>{locale === "nb" ? "Stillingsanalyse" : "Job analysis"}</Link><Link href="/career/profile" aria-current={view === "profile" ? "page" : undefined}>{locale === "nb" ? "Min profil" : "My profile"}</Link><Link href="/jobs/saved" aria-current={view === "saved" ? "page" : undefined}>{locale === "nb" ? "Mine stillinger" : "Saved jobs"}</Link></nav><label className="language-picker">{t.language}<select value={locale} onChange={(e) => changeLocale(e.target.value as Locale)}><option value="nb">Norsk</option><option value="en">English</option></select></label></header>
      <main><div className="page-intro"><p className="eyebrow">{view === "profile" ? (locale === "nb" ? "DIN KARRIERE" : "YOUR CAREER") : (locale === "nb" ? "FRA ANNONSE TIL OVERSIKT" : "FROM ADVERTISEMENT TO CLARITY")}</p><h1>{view === "profile" ? (locale === "nb" ? "Bygg din kandidatprofil." : "Build your candidate profile.") : view === "saved" ? (locale === "nb" ? "Dine neste muligheter." : "Your next opportunities.") : t.title}</h1><p className="introduction">{view === "profile" ? (locale === "nb" ? "Lagre dine opplysninger og behold kontroll over din egen historie." : "Save your information and stay in control of your own story.") : view === "saved" ? (locale === "nb" ? "Behold annonsene, vurder dem i ro og ta neste steg." : "Keep advertisements, review them and take the next step.") : t.introduction}</p></div>{view === "profile" ? <ProfileWorkspace locale={locale}/> : view === "saved" ? <SavedJobsWorkspace locale={locale}/> : <JobAnalyzer locale={locale}/> }
      <footer className="app-footer"><div className="connection-status">{connection.isError ? <CircleAlert size={15}/> : <CircleCheck size={15}/>}<span role="status">{t[connection.isFetching ? "loading" : connection.isError ? "offline" : "online"]}</span>{connection.isError && <Button variant="ghost" size="sm" onClick={() => void connection.refetch()}>{t.retry}</Button>}</div><span>{locale === "nb" ? "Bekreftede fakta. Dine valg." : "Confirmed facts. Your choices."}</span></footer>
      </main>
    </div>
  </div>;
}
