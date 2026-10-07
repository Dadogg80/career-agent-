"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, Save, UserRound } from "lucide-react";
import { Card, CardHeader, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { isProfile, isSession } from "../lib/profile";
import type { Locale } from "../lib/translations";
import { DocumentPanel } from "./document-panel";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [claimExpired, setClaimExpired] = useState(false);
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
  const logout = useMutation({ mutationFn: async () => {
    const response = await fetch("/api/auth/logout", { method: "POST", headers: { "X-CSRF-TOKEN": session.data!.csrfToken } });
    if (response.status !== 204) await readJson(response);
  }, onSuccess: () => { setName(""); cache.removeQueries({ queryKey: ["private-profile"] }); cache.removeQueries({ queryKey: ["private-session"] }); cache.removeQueries({ queryKey: ["private-claims"] }); cache.removeQueries({ queryKey: ["private-claim-history"] }); cache.removeQueries({ queryKey: ["private-documents"] }); cache.removeQueries({ queryKey: ["private-document-analysis"] }); cache.removeQueries({ queryKey: ["private-document-collection-text"] }); cache.removeQueries({ queryKey: ["private-document-detail"] }); window.location.assign("/"); } });
  function submit(event: FormEvent) { event.preventDefault(); if (!save.isPending && !logout.isPending) save.mutate(); }
  const error = session.error ?? profile.error ?? save.error ?? logout.error;
  const message = claimExpired ? t.errors.AUTH_REQUIRED : error ? t.errors[error.message as keyof typeof t.errors] ?? t.errors.PROFILE_UNAVAILABLE : undefined;
  const available = session.data?.loginAvailable && session.data.profilesAvailable;
  const loggedIn = session.data?.authenticated;
  const expired = claimExpired || [profile.error, save.error, logout.error].some(value => value?.message === "AUTH_REQUIRED");
  return <section aria-labelledby="profile-title" className="profile-workspace"><Card>
    <CardHeader><h2 id="profile-title" className="flex items-center gap-2"><UserRound size={20} />{t.title}</h2><p className="hint">{profile.data ? profile.data.displayName : t.intro}</p></CardHeader><CardContent>
      {loginFailed && !loggedIn && <Alert variant="destructive"><AlertDescription>{t.loginFailed}</AlertDescription></Alert>}
      {message && <Alert variant="destructive" role="alert"><AlertDescription>{message}</AlertDescription></Alert>}
      {session.isPending && <p role="status">{t.loading}</p>}
      {session.data && !available && <><p>{t.unavailable}</p><p className="hint">{t.unavailableHint}</p></>}
      {available && (!loggedIn || expired) && <Button asChild><a href="/api/auth/login"><LogIn />{t.login}</a></Button>}
      {loggedIn && !expired && session.data?.profilesAvailable && <>
        {profile.isPending ? <p role="status">{t.loading}</p> : !profile.isError && <details className="profile-settings" open={profile.data === null || settingsOpen} onToggle={event => setSettingsOpen(event.currentTarget.open)}><summary>{locale === "nb" ? "Profilinnstillinger" : "Profile settings"}{profile.data && <span>{profile.data.displayName}</span>}</summary><form onSubmit={submit} className="profile-form">
          <label htmlFor="profile-name">{t.name}</label><Input id="profile-name" value={name} onChange={event => { setName(event.target.value); save.reset(); }} required maxLength={200} disabled={save.isPending || logout.isPending} autoComplete="name" />
          <label htmlFor="profile-language">{t.language}</label><select id="profile-language" value={language} onChange={event => { setLanguage(event.target.value as Locale); save.reset(); }} disabled={save.isPending || logout.isPending}><option value="nb">Norsk</option><option value="en">English</option></select>
          <Button type="submit" disabled={save.isPending || logout.isPending || !name.trim()}><Save />{save.isPending ? t.saving : t.save}</Button>
          {save.isSuccess && <p role="status">{t.saved}</p>}
          {profile.data && <p className="hint">{t.revision}: {profile.data.revision}</p>}
        </form>        <div className="profile-actions"><Button variant="outline" onClick={async () => { save.reset(); await profile.refetch(); }} disabled={save.isPending || logout.isPending}>{t.reload}</Button><Button variant="ghost" onClick={() => logout.mutate()} disabled={save.isPending || logout.isPending}><LogOut />{t.logout}</Button></div></details>}
        {profile.data === null && <p className="hint">{t.next}</p>}

      </>}
      {session.isError && <Button variant="outline" onClick={() => void session.refetch()}>{t.reload}</Button>}
    </CardContent></Card>{loggedIn && !expired && profile.data && session.data && <><nav className="career-jump-links" aria-label={locale === "nb" ? "Profilområder" : "Profile sections"}><Button variant="outline" asChild><a href="#profile-competencies">{locale === "nb" ? "Din kompetanse" : "Your competencies"}</a></Button><Button variant="outline" asChild><a href="#profile-documents">{locale === "nb" ? "Dokumentgrunnlag" : "Document sources"}</a></Button></nav><ClaimPanel locale={locale} csrfToken={session.data.csrfToken} onAuthRequired={() => setClaimExpired(true)}/><DocumentPanel locale={locale} csrfToken={session.data.csrfToken} onAuthRequired={() => setClaimExpired(true)}/></>}</section>;
}
