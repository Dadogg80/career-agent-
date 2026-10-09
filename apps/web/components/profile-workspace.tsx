"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  ChevronDown,
  FileText,
  Languages,
  LogIn,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { isProfile, isSession } from "../lib/profile";
import type { Locale } from "../lib/translations";
import { CandidatePresentation } from "./candidate-presentation";
import { DocumentPanel } from "./document-panel";
import { CareerEntryPanel } from "./career-entry-panel";
import { ClaimPanel } from "./claim-panel";

const translations = {
  nb: {
    title: "Min profil",
    intro: "Et privat arbeidsområde for CV, kompetanse og jobbsøking.",
    login: "Logg inn",
    logout: "Logg ut av Career Agent",
    loading: "Henter profil …",
    unavailable: "Profilinnlogging er ikke aktivert i dette miljøet ennå.",
    unavailableHint: "Stillingsanalysen er tilgjengelig. Profilen åpnes når lokal innlogging og lagring er konfigurert.",
    name: "Navn",
    language: "Foretrukket profilspråk",
    save: "Lagre profil",
    saving: "Lagrer …",
    saved: "Profilen er lagret.",
    revision: "Profilversjon",
    reload: "Hent lagret versjon",
    next: "Lagre basisprofilen først for å legge til erfaring og kompetanse.",
    loginFailed: "Innloggingen ble ikke fullført. Prøv igjen.",
    private: "Privat profil",
    profileIntro: "Her samler du dokumentert erfaring, kompetanse og CV-er. Du avgjør hva som bekreftes.",
    photoChoose: "Velg profilbilde",
    photoSave: "Lagre bilde",
    photoSaving: "Lagrer bilde …",
    photoRemove: "Fjern bilde",
    photoLimit: "JPG eller PNG · maks 2 MB. Bildet lagres privat og sendes aldri til AI.",
    photoSelected: "Forhåndsvisning · ikke lagret ennå",
    photoSaved: "Profilbildet er oppdatert.",
    photoRemoved: "Profilbildet er fjernet.",
    photoTooLarge: "Bildet er for stort. Velg en JPG- eller PNG-fil på maks 2 MB.",
    photoInvalid: "Velg en gyldig JPG- eller PNG-bildefil.",
    profileSettings: "Profilinnstillinger",
    identity: "Identitet og presentasjon",
    contents: "Ditt kandidatgrunnlag",
    errors: {
      PROFILE_UNAVAILABLE: "Kunne ikke hente eller lagre profilen. Prøv igjen.",
      AUTH_REQUIRED: "Sesjonen er utløpt. Logg inn igjen.",
      ACCESS_DENIED: "Endringen ble avvist. Last siden på nytt og prøv igjen.",
      PROFILE_INVALID: "Kontroller navn og språk før du lagrer.",
      PROFILE_CONFLICT: "Profilen er endret i en annen fane. Hent lagret versjon før du redigerer videre; det erstatter utkastet ditt.",
      PROFILE_DISABLED: "Profillagring er ikke aktivert i dette miljøet.",
      PROFILE_AVATAR_INVALID: "Bildet kunne ikke leses. Velg en gyldig JPG- eller PNG-fil.",
      PROFILE_AVATAR_TOO_LARGE: "Bildet overskrider størrelsesgrensen. Velg et bilde på maks 2 MB.",
      PROFILE_AVATAR_NOT_FOUND: "Opprett en profil før du legger til et bilde.",
      PROFILE_AVATAR_UNAVAILABLE: "Kunne ikke lagre eller hente profilbildet. Prøv igjen.",
    },
  },
  en: {
    title: "My profile",
    intro: "A private workspace for your CV, experience and job search.",
    login: "Sign in",
    logout: "Sign out of Career Agent",
    loading: "Loading profile …",
    unavailable: "Profile sign-in is not enabled in this environment yet.",
    unavailableHint: "Job analysis is available. Your profile opens when local sign-in and storage are configured.",
    name: "Name",
    language: "Preferred profile language",
    save: "Save profile",
    saving: "Saving …",
    saved: "Profile saved.",
    revision: "Profile version",
    reload: "Load saved version",
    next: "Save your basic profile first to add experience and competencies.",
    loginFailed: "Sign-in did not complete. Try again.",
    private: "Private profile",
    profileIntro: "Keep your sourced experience, competencies and CVs together. You decide what is confirmed.",
    photoChoose: "Choose profile photo",
    photoSave: "Save photo",
    photoSaving: "Saving photo …",
    photoRemove: "Remove photo",
    photoLimit: "JPG or PNG · 2 MB max. Stored privately and never sent to AI.",
    photoSelected: "Preview · not saved yet",
    photoSaved: "Profile photo updated.",
    photoRemoved: "Profile photo removed.",
    photoTooLarge: "This image is too large. Choose a JPG or PNG file up to 2 MB.",
    photoInvalid: "Choose a valid JPG or PNG image file.",
    profileSettings: "Profile settings",
    identity: "Identity and presentation",
    contents: "Your candidate profile",
    errors: {
      PROFILE_UNAVAILABLE: "Could not load or save the profile. Try again.",
      AUTH_REQUIRED: "Your session has expired. Sign in again.",
      ACCESS_DENIED: "The change was rejected. Reload the page and try again.",
      PROFILE_INVALID: "Check your name and language before saving.",
      PROFILE_CONFLICT: "Your profile changed in another tab. Load the saved version before editing again; this replaces your draft.",
      PROFILE_DISABLED: "Profile storage is not enabled in this environment.",
      PROFILE_AVATAR_INVALID: "The image could not be read. Choose a valid JPG or PNG file.",
      PROFILE_AVATAR_TOO_LARGE: "The image exceeds the size limit. Choose an image up to 2 MB.",
      PROFILE_AVATAR_NOT_FOUND: "Create a profile before adding a photo.",
      PROFILE_AVATAR_UNAVAILABLE: "Could not save or load the profile photo. Try again.",
    },
  },
};

type AvatarCommand = { kind: "save"; file: File } | { kind: "remove" };

async function readJson(response: Response) {
  const value = await response.json();
  if (!response.ok) throw new Error(typeof value?.code === "string" ? value.code : "PROFILE_UNAVAILABLE");
  return value as unknown;
}

export function ProfileWorkspace({ locale }: { locale: Locale }) {
  const t = translations[locale];
  const cache = useQueryClient();
  const avatarInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState<Locale>("nb");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarInputError, setAvatarInputError] = useState<string | null>(null);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);
  const [loginFailed, setLoginFailed] = useState(false);
  const [section, setSection] = useState<"documents" | "competencies" | "history">("documents");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [claimExpired, setClaimExpired] = useState(false);

  useEffect(() => {
    const selectLinkedSection = () =>
      setSection(window.location.hash === "#profile-competencies" ? "competencies" : window.location.hash === "#profile-career-history" ? "history" : "documents");
    selectLinkedSection();
    window.addEventListener("hashchange", selectLinkedSection);
    window.addEventListener("popstate", selectLinkedSection);
    return () => {
      window.removeEventListener("hashchange", selectLinkedSection);
      window.removeEventListener("popstate", selectLinkedSection);
    };
  }, []);

  useEffect(() => {
    setLoginFailed(new URLSearchParams(window.location.search).get("login") === "failed");
  }, []);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const session = useQuery({
    queryKey: ["private-session"],
    gcTime: 0,
    refetchOnReconnect: false,
    queryFn: async () => {
      const value = await readJson(await fetch("/api/auth/session", { cache: "no-store" }));
      if (!isSession(value)) throw new Error("PROFILE_UNAVAILABLE");
      return value;
    },
  });
  const profile = useQuery({
    queryKey: ["private-profile"],
    gcTime: 0,
    refetchOnReconnect: false,
    enabled: session.data?.authenticated === true && session.data.profilesAvailable,
    queryFn: async () => {
      const response = await fetch("/api/profile/me", { cache: "no-store" });
      const value = await response.json();
      if (response.status === 404 && value?.code === "PROFILE_NOT_CREATED") return null;
      if (!response.ok) throw new Error(typeof value?.code === "string" ? value.code : "PROFILE_UNAVAILABLE");
      if (!isProfile(value)) throw new Error("PROFILE_UNAVAILABLE");
      return value;
    },
  });

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.displayName);
      setLanguage(profile.data.preferredLanguage);
    }
  }, [profile.data?.displayName, profile.data?.preferredLanguage, profile.data?.revision]);

  const save = useMutation({
    mutationFn: async () => {
      const value = await readJson(await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": session.data!.csrfToken },
        body: JSON.stringify({ displayName: name, preferredLanguage: language, revision: profile.data?.revision ?? 0 }),
      }));
      if (!isProfile(value)) throw new Error("PROFILE_UNAVAILABLE");
      return value;
    },
    onSuccess: value => cache.setQueryData(["private-profile"], value),
  });

  const avatar = useMutation({
    retry: false,
    mutationFn: async (command: AvatarCommand) => {
      const response = command.kind === "save"
        ? await (() => {
          const form = new FormData();
          form.set("file", command.file);
          return fetch("/api/profile/me/avatar", {
            method: "PUT",
            headers: { "X-CSRF-TOKEN": session.data!.csrfToken },
            body: form,
          });
        })()
        : await fetch("/api/profile/me/avatar", {
          method: "DELETE",
          headers: { "X-CSRF-TOKEN": session.data!.csrfToken },
        });
      if (response.status === 204 && command.kind === "remove") return command.kind;
      const value = await response.json();
      if (!response.ok) throw new Error(typeof value?.code === "string" ? value.code : "PROFILE_AVATAR_UNAVAILABLE");
      if (command.kind !== "save" || !value || typeof value !== "object" || value.updated !== true) {
        throw new Error("PROFILE_AVATAR_UNAVAILABLE");
      }
      return command.kind;
    },
    onSuccess: kind => {
      if (profile.data) cache.setQueryData(["private-profile"], { ...profile.data, avatarAvailable: kind === "save" });
      setAvatarVersion(Date.now());
      setAvatarFile(null);
      setAvatarInputError(null);
      setAvatarNotice(kind === "save" ? t.photoSaved : t.photoRemoved);
    },
    onError: () => setAvatarNotice(null),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!save.isPending) save.mutate();
  }

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setAvatarNotice(null);
    avatar.reset();
    if (!file) return;
    if (file.size > 2_000_000) {
      setAvatarFile(null);
      setAvatarInputError(t.photoTooLarge);
      event.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setAvatarFile(null);
      setAvatarInputError(t.photoInvalid);
      event.target.value = "";
      return;
    }
    setAvatarInputError(null);
    setAvatarFile(file);
  }

  const error = session.error ?? profile.error ?? save.error ?? avatar.error;
  const message = claimExpired ? t.errors.AUTH_REQUIRED : error ? t.errors[error.message as keyof typeof t.errors] ?? t.errors.PROFILE_UNAVAILABLE : undefined;
  const available = session.data?.loginAvailable && session.data.profilesAvailable;
  const loggedIn = session.data?.authenticated;
  const expired = claimExpired || [profile.error, save.error, avatar.error].some(value => value?.message === "AUTH_REQUIRED");
  const initials = (profile.data?.displayName ?? name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase(locale) || "CA";
  const photoSrc = avatarPreview ?? (profile.data?.avatarAvailable ? `/api/profile/me/avatar?v=${avatarVersion}` : null);
  const sectionTitle = section === "documents" ? (locale === "nb" ? "Dokumenter og AI-profil" : "Documents and AI profile")
    : section === "competencies" ? (locale === "nb" ? "Din kompetanse" : "Your competencies")
      : (locale === "nb" ? "Arbeid og utdanning" : "Career history");

  return (
    <section aria-labelledby="profile-title" className="profile-workspace">
      <Card className="profile-identity-card">
        <CardHeader className="profile-identity-header">
          <div className="profile-identity-layout">
            <div className="profile-avatar-column">
              <div className="profile-avatar" role="img" aria-label={profile.data?.displayName ?? t.title}>
                {photoSrc
                  ? <img src={photoSrc} alt={profile.data?.displayName ?? t.title} width={112} height={112} />
                  : <span>{initials}</span>}
                <span className="profile-avatar-status" aria-hidden="true"><Camera size={13} /></span>
              </div>
              {loggedIn && profile.data && !expired && (
                <div className="profile-avatar-actions">
                  <Input
                    ref={avatarInput}
                    id="profile-avatar-file"
                    className="profile-avatar-file"
                    type="file"
                    accept="image/jpeg,image/png"
                    aria-label={t.photoChoose}
                    onChange={selectAvatar}
                    disabled={avatar.isPending}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => avatarInput.current?.click()} disabled={avatar.isPending}>
                    <Camera size={15} aria-hidden="true" />{t.photoChoose}
                  </Button>
                  {avatarFile && <Button type="button" size="sm" onClick={() => avatar.mutate({ kind: "save", file: avatarFile })} disabled={avatar.isPending}>
                    <Save size={15} aria-hidden="true" />{avatar.isPending ? t.photoSaving : t.photoSave}
                  </Button>}
                  {profile.data.avatarAvailable && !avatarFile && <Button type="button" size="sm" variant="ghost" onClick={() => avatar.mutate({ kind: "remove" })} disabled={avatar.isPending}>
                    <Trash2 size={14} aria-hidden="true" />{t.photoRemove}
                  </Button>}
                </div>
              )}
            </div>

            <div className="profile-identity-copy">
              <span className="profile-overline">{t.identity}</span>
              <h2 id="profile-title">{profile.data?.displayName ?? t.title}</h2>
              <p>{profile.data ? t.profileIntro : t.intro}</p>
              <div className="profile-identity-meta">
                <span><ShieldCheck size={14} aria-hidden="true" />{t.private}</span>
                {profile.data && <span><Languages size={14} aria-hidden="true" />{profile.data.preferredLanguage === "nb" ? "Norsk" : "English"}</span>}
                {profile.data && <span>{t.revision} {profile.data.revision}</span>}
              </div>
            </div>

            {loggedIn && !expired && profile.data && (
              <details className="profile-settings" open={settingsOpen} onToggle={event => setSettingsOpen(event.currentTarget.open)}>
                <summary><Settings2 size={16} aria-hidden="true" />{t.profileSettings}<ChevronDown size={15} aria-hidden="true" /></summary>
                <form onSubmit={submit} className="profile-form">
                  <label htmlFor="profile-name">{t.name}</label>
                  <Input id="profile-name" value={name} onChange={event => { setName(event.target.value); save.reset(); }} required maxLength={200} disabled={save.isPending} autoComplete="name" />
                  <label htmlFor="profile-language">{t.language}</label>
                  <select id="profile-language" value={language} onChange={event => { setLanguage(event.target.value as Locale); save.reset(); }} disabled={save.isPending}>
                    <option value="nb">Norsk</option><option value="en">English</option>
                  </select>
                  <div className="profile-settings-actions">
                    <Button type="submit" disabled={save.isPending || !name.trim()}><Save size={15} aria-hidden="true" />{save.isPending ? t.saving : t.save}</Button>
                    <Button type="button" variant="outline" onClick={async () => { save.reset(); await profile.refetch(); }} disabled={save.isPending}>{t.reload}</Button>
                  </div>
                </form>
              </details>
            )}
          </div>
        </CardHeader>
        <CardContent className="profile-identity-feedback">
          {loginFailed && !loggedIn && <Alert variant="destructive"><AlertDescription>{t.loginFailed}</AlertDescription></Alert>}
          {message && <Alert variant="destructive" role="alert"><AlertDescription>{message}</AlertDescription></Alert>}
          {save.isSuccess && <p role="status" className="profile-inline-success">{t.saved}</p>}
          {avatarInputError && <p className="profile-inline-error" role="alert">{avatarInputError}</p>}
          {avatarNotice && <p className="profile-inline-success" role="status">{avatarNotice}</p>}
          {avatarFile && <p className="profile-photo-preview-note">{t.photoSelected}</p>}
          {loggedIn && profile.data && <p className="profile-photo-limit">{t.photoLimit}</p>}
          {session.isPending && <p role="status">{t.loading}</p>}
          {session.data && !available && <><p>{t.unavailable}</p><p className="hint">{t.unavailableHint}</p></>}
          {available && (!loggedIn || expired) && <Button asChild><a href="/login"><LogIn />{t.login}</a></Button>}
          {loggedIn && !expired && session.data?.profilesAvailable && (
            profile.isPending ? <p role="status">{t.loading}</p> : profile.data === null ? (
              <details className="profile-settings profile-settings-create" open>
                <summary><Settings2 size={16} aria-hidden="true" />{t.profileSettings}<ChevronDown size={15} aria-hidden="true" /></summary>
                <form onSubmit={submit} className="profile-form">
                  <label htmlFor="profile-name">{t.name}</label>
                  <Input id="profile-name" value={name} onChange={event => { setName(event.target.value); save.reset(); }} required maxLength={200} disabled={save.isPending} autoComplete="name" />
                  <label htmlFor="profile-language">{t.language}</label>
                  <select id="profile-language" value={language} onChange={event => { setLanguage(event.target.value as Locale); save.reset(); }} disabled={save.isPending}>
                    <option value="nb">Norsk</option><option value="en">English</option>
                  </select>
                  <Button type="submit" disabled={save.isPending || !name.trim()}><Save size={15} aria-hidden="true" />{save.isPending ? t.saving : t.save}</Button>
                </form>
              </details>
            ) : null
          )}
          {session.isError && <Button variant="outline" onClick={() => void session.refetch()}>{t.reload}</Button>}
        </CardContent>
      </Card>

      {loggedIn && !expired && profile.data && session.data && <>
        <CandidatePresentation locale={locale} csrfToken={session.data.csrfToken} onAuthRequired={()=>setClaimExpired(true)} onReviewDocuments={()=>{setSection("documents");if(window.location.hash!=="#profile-documents")window.history.pushState(null,"","#profile-documents");}}/>
        <div className="profile-section-navigation">
          <div className="profile-section-intro">
            <span className="profile-overline">{t.contents}</span>
            <h2>{sectionTitle}</h2>
            <p>{locale === "nb" ? "Kildene er dine. Gå gjennom forslag og bestem selv hva som blir bekreftet." : "Your sources stay yours. Review proposals and decide what to confirm."}</p>
          </div>
          <nav aria-label={locale === "nb" ? "Profilområder" : "Profile sections"} className="profile-section-buttons">
            {(["documents", "competencies", "history"] as const).map(key => (
              <Button
                key={key}
                aria-pressed={section === key}
                aria-controls={`profile-section-${key}`}
                variant={section === key ? "default" : "outline"}
                onClick={() => {
                  setSection(key);
                  const hash = key === "competencies" ? "#profile-competencies" : key === "history" ? "#profile-career-history" : "#profile-documents";
                  if (window.location.hash !== hash) window.history.pushState(null, "", hash);
                }}
              >
                {key === "documents" ? <FileText size={16} aria-hidden="true"/> : key === "competencies" ? <BadgeCheck size={16} aria-hidden="true"/> : <BriefcaseBusiness size={16} aria-hidden="true"/>}
                {key === "documents" ? locale === "nb" ? "Dokumenter og AI-profil" : "Documents and AI profile"
                  : key === "competencies" ? locale === "nb" ? "Din kompetanse" : "Your competencies"
                    : locale === "nb" ? "Arbeid og utdanning" : "Career history"}
              </Button>
            ))}
          </nav>
        </div>
        <div id="profile-section-documents" hidden={section !== "documents"}>
          <DocumentPanel locale={locale} csrfToken={session.data.csrfToken} onAuthRequired={() => setClaimExpired(true)}/>
        </div>
        <div id="profile-section-competencies" hidden={section !== "competencies"}>
          <ClaimPanel locale={locale} csrfToken={session.data.csrfToken} onAuthRequired={() => setClaimExpired(true)}/>
        </div>
        <div id="profile-section-history" hidden={section !== "history"}>
          <CareerEntryPanel locale={locale} csrfToken={session.data.csrfToken} onAuthRequired={() => setClaimExpired(true)} sectionActive={section === "history"}/>
        </div>
      </>}
    </section>
  );
}
