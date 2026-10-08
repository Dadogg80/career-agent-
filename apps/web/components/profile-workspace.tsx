"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, Save, UserRound } from "lucide-react";
import { Card, CardHeader, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { isProfile, isSession } from "../lib/profile";
import type { Locale } from "../lib/translations";
import { DocumentPanel } from "./document-panel";
import { CareerEntryPanel } from "./career-entry-panel";
import { ClaimPanel } from "./claim-panel";

const translations = {
  nb: { title: "Min profil", intro: "Et lagret grunnlag for din videre jobbsøking.", login: "Logg inn", logout: "Logg ut av Career Agent", loading: "Henter profil …", unavailable: "Profilinnlogging er ikke aktivert i dette miljøet ennå.", unavailableHint: "Stillingsanalysen er tilgjengelig. Profilen åpnes når lokal innlogging og lagring er konfigurert.", name: "Navn", language: "Foretrukket profilspråk", save: "Lagre profil", saving: "Lagrer …", saved: "Profilen er lagret.", revision: "Lagret versjon", reload: "Hent lagret versjon", next: "Lagre basisprofilen først for å legge til erfaring og kompetanse.", loginFailed: "Innloggingen ble ikke fullført. Prøv igjen.", errors: { PROFILE_UNAVAILABLE: "Kunne ikke hente eller lagre profilen. Prøv igjen.", AUTH_REQUIRED: "Sesjonen er utløpt. Logg inn igjen.", ACCESS_DENIED: "Endringen ble avvist. Last siden på nytt og prøv igjen.", PROFILE_INVALID: "Kontroller navn og språk før du lagrer.", PROFILE_CONFLICT: "Profilen er endret i en annen fane. Hent lagret versjon før du redigerer videre; det erstatter utkastet ditt.", PROFILE_DISABLED: "Profillagring er ikke aktivert i dette miljøet." } },
  en: { title: "My profile", intro: "A saved foundation for your job search.", login: "Sign in", logout: "Sign out of Career Agent", loading: "Loading profile …", unavailable: "Profile sign-in is not enabled in this environment yet.", unavailableHint: "Job analysis is available. Your profile opens when local sign-in and storage are configured.", name: "Name", language: "Preferred profile language", save: "Save profile", saving: "Saving …", saved: "Profile saved.", revision: "Saved revision", reload: "Load saved version", next: "Save your basic profile first to add experience and competencies.", loginFailed: "Sign-in did not complete. Try again.", errors: { PROFILE_UNAVAILABLE: "Could not load or save the profile. Try again.", AUTH_REQUIRED: "Your session has expired. Sign in again.", ACCESS_DENIED: "The change was rejected. Reload the page and try again.", PROFILE_INVALID: "Check your name and language before saving.", PROFILE_CONFLICT: "Your profile changed in another tab. Load the saved version before editing again; this replaces your draft.", PROFILE_DISABLED: "Profile storage is not enabled in this environment." } },
};
async function readJson(response: Response) {
  const value = await response.json();
  if (!response.ok) throw new Error(typeof value?.code === "string" ? value.code : "PROFILE_UNAVAILABLE");
  return value as unknown;
}
export function ProfileWorkspace({ locale }: { locale: Locale }) {
  const t = translations[locale]; const cache = useQueryClient();
  const [name, setName] = useState(""); const [language, setLanguage] = useState<Locale>("nb");
  const [loginFailed, setLoginFailed] = useState(false);
  const [section, setSection] = useState<"documents"|"competencies"|"history">("documents");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [claimExpired, setClaimExpired] = useState(false);
  useEffect(() => {
    const selectLinkedSection = () => setSection(window.location.hash === "#profile-competencies" ? "competencies" : window.location.hash === "#profile-career-history" ? "history" : "documents");
    selectLinkedSection();
    window.addEventListener("hashchange", selectLinkedSection);
    window.addEventListener("popstate", selectLinkedSection);
    return () => {window.removeEventListener("hashchange", selectLinkedSection);window.removeEventListener("popstate", selectLinkedSection);};
  }, []);
  useEffect(() => { setLoginFailed(new URLSearchParams(window.location.search).get("login") === "failed"); }, []);
  const session = useQuery({ queryKey: ["private-session"], gcTime: 0, refetchOnReconnect: false, queryFn: async () => {
    const value = await readJson(await fetch("/api/auth/session", { cache: "no-store" }));
    if (!isSession(value)) throw new Error("PROFILE_UNAVAILABLE"); return value;
  } });
  const profile = useQuery({ queryKey: ["private-profile"], gcTime: 0, refetchOnReconnect: false, enabled: session.data?.authenticated === true && session.data.profilesAvailable, queryFn: async () => {
    const response = await fetch("/api/profile/me", { cache: "no-store" }); const value = await response.json();
    if (response.status === 404 && value?.code === "PROFILE_NOT_CREATED") return null;
    if (!response.ok) throw new Error(typeof value?.code === "string" ? value.code : "PROFILE_UNAVAILABLE");
    if (!isProfile(value)) throw new Error("PROFILE_UNAVAILABLE"); return value;
  } });
  useEffect(() => { if (profile.data) { setName(profile.data.displayName); setLanguage(profile.data.preferredLanguage); } }, [profile.data]);
  const save = useMutation({ mutationFn: async () => {
    const value = await readJson(await fetch("/api/profile/me", { method: "PUT", headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": session.data!.csrfToken }, body: JSON.stringify({ displayName: name, preferredLanguage: language, revision: profile.data?.revision ?? 0 }) }));
    if (!isProfile(value)) throw new Error("PROFILE_UNAVAILABLE"); return value;
  }, onSuccess: value => cache.setQueryData(["private-profile"], value) });
  function submit(event: FormEvent) { event.preventDefault(); if (!save.isPending) save.mutate(); }
  const error = session.error ?? profile.error ?? save.error;
  const message = claimExpired ? t.errors.AUTH_REQUIRED : error ? t.errors[error.message as keyof typeof t.errors] ?? t.errors.PROFILE_UNAVAILABLE : undefined;
  const available = session.data?.loginAvailable && session.data.profilesAvailable;
  const loggedIn = session.data?.authenticated;
  const expired = claimExpired || [profile.error, save.error].some(value => value?.message === "AUTH_REQUIRED");
  return <section aria-labelledby="profile-title" className="profile-workspace"><Card>
    <CardHeader><h2 id="profile-title" className="flex items-center gap-2"><UserRound size={20} />{t.title}</h2><p className="hint">{profile.data ? profile.data.displayName : t.intro}</p></CardHeader><CardContent>
      {loginFailed && !loggedIn && <Alert variant="destructive"><AlertDescription>{t.loginFailed}</AlertDescription></Alert>}
      {message && <Alert variant="destructive" role="alert"><AlertDescription>{message}</AlertDescription></Alert>}
      {session.isPending && <p role="status">{t.loading}</p>}
      {session.data && !available && <><p>{t.unavailable}</p><p className="hint">{t.unavailableHint}</p></>}
      {available && (!loggedIn || expired) && <Button asChild><a href="/login"><LogIn />{t.login}</a></Button>}
      {loggedIn && !expired && session.data?.profilesAvailable && <>
        {profile.isPending ? <p role="status">{t.loading}</p> : !profile.isError && <details className="profile-settings" open={profile.data === null || settingsOpen} onToggle={event => setSettingsOpen(event.currentTarget.open)}><summary>{locale === "nb" ? "Profilinnstillinger" : "Profile settings"}{profile.data && <span>{profile.data.displayName}</span>}</summary><form onSubmit={submit} className="profile-form">
          <label htmlFor="profile-name">{t.name}</label><Input id="profile-name" value={name} onChange={event => { setName(event.target.value); save.reset(); }} required maxLength={200} disabled={save.isPending} autoComplete="name" />
          <label htmlFor="profile-language">{t.language}</label><select id="profile-language" value={language} onChange={event => { setLanguage(event.target.value as Locale); save.reset(); }} disabled={save.isPending}><option value="nb">Norsk</option><option value="en">English</option></select>
          <Button type="submit" disabled={save.isPending || !name.trim()}><Save />{save.isPending ? t.saving : t.save}</Button>
          {save.isSuccess && <p role="status">{t.saved}</p>}
          {profile.data && <p className="hint">{t.revision}: {profile.data.revision}</p>}
        </form>        <div className="profile-actions"><Button variant="outline" onClick={async () => { save.reset(); await profile.refetch(); }} disabled={save.isPending}>{t.reload}</Button></div></details>}
        {profile.data === null && <p className="hint">{t.next}</p>}

      </>}
      {session.isError && <Button variant="outline" onClick={() => void session.refetch()}>{t.reload}</Button>}
    </CardContent></Card>{loggedIn && !expired && profile.data && session.data && <><div className="profile-section-navigation"><p className="hint">{locale === "nb" ? "Start med dokumentene. Vi foreslår kompetanse og historikk; du kontrollerer innholdet." : "Start with documents. We propose competencies and career history; you review the content."}</p><nav aria-label={locale === "nb" ? "Profilområder" : "Profile sections"} className="profile-section-buttons">{(["documents","competencies","history"] as const).map(key=><Button key={key} aria-pressed={section===key} aria-controls={`profile-section-${key}`} variant={section===key?"default":"outline"} onClick={()=>{setSection(key);const hash=key==="competencies"?"#profile-competencies":key==="history"?"#profile-career-history":"#profile-documents";if(window.location.hash!==hash)window.history.pushState(null,"",hash);}}>{key === "documents" ? locale === "nb" ? "Dokumenter og AI-profil" : "Documents and AI profile" : key === "competencies" ? locale === "nb" ? "Din kompetanse" : "Your competencies" : locale === "nb" ? "Arbeid og utdanning" : "Career history"}</Button>)}</nav></div><div id="profile-section-documents" hidden={section!=="documents"}><DocumentPanel locale={locale} csrfToken={session.data.csrfToken} onAuthRequired={() => setClaimExpired(true)}/></div><div id="profile-section-competencies" hidden={section!=="competencies"}><ClaimPanel locale={locale} csrfToken={session.data.csrfToken} onAuthRequired={() => setClaimExpired(true)}/></div><div id="profile-section-history" hidden={section!=="history"}><CareerEntryPanel locale={locale} csrfToken={session.data.csrfToken} onAuthRequired={() => setClaimExpired(true)}/></div></>}</section>;
}
