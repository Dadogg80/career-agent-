"use client";
import { ClaimEvidence } from "./claim-evidence";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Check, X, History, Trash2, Search, ShieldCheck, ClipboardCheck, Files } from "lucide-react";
import { Card, CardHeader, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { isClaim, isClaimList, isClaimHistory, type CompetencyClaim, type ClaimStatus, type ClaimContent } from "../lib/claims";
import type { Locale } from "../lib/translations";

const copy = {
  nb: {
    existing: "Det samme kompetansepunktet finnes fra før. Bekreftelsesstatusen er beholdt.", title: "Erfaring og kompetanse", intro: "Beskriv ditt eget bidrag. Du bekrefter hver opplysning før den kan brukes som bekreftet erfaring.", add: "Legg til kompetanse", edit: "Rediger", confirm: "Bekreft", reject: "Avvis", history: "Historikk", remove: "Slett", close: "Lukk", cancel: "Avbryt", all: "Alle", loading: "Henter kompetanse …", empty: "Ingen kompetanse registrert ennå.", emptyFilter: "Ingen opplysninger i denne kategorien.", firstSave: "Lagre basisprofilen først for å legge til erfaring og kompetanse.", skill: "Kompetanse", statement: "Hva gjorde du selv?", context: "Prosjekt eller arbeidsforhold", sourceNote: "Grunnlag / kilde", sourceHint: "For eksempel egen hukommelse eller en henvisning til et dokument. CV-kildesitater kan legges til i dokumentdelen.", save: "Lagre opplysning", busy: "Lagrer …", created: "Opplysningen er lagret som ubekreftet.", changed: "Endringen er lagret. Innholdet må bekreftes på nytt.", reviewed: "Vurderingen er lagret.", deleted: "Opplysningen og historikken er slettet.", reload: "Hent lagret versjon og lukk utkast", editNotice: "Lagring oppretter en ny ubekreftet revisjon, også når opplysningen tidligere var bekreftet.", confirmTitle: "Bekreft din egen erfaring", confirmNotice: "Bekreft bare hvis teksten og konteksten nedenfor beskriver det du selv har gjort. Bekreftelsen er din egen opplysning, ikke en ekstern sertifisering.", confirmAction: "Ja, dette beskriver min erfaring", rejectTitle: "Avvis opplysningen", rejectNotice: "Opplysningen beholdes som avvist med historikk. Det betyr ikke at du mangler kompetansen generelt.", rejectAction: "Avvis denne opplysningen", deleteTitle: "Slett opplysningen permanent?", deleteNotice: "Både opplysningen og alle revisjonene slettes. Lagrede jobbvurderinger kan inneholde en tidligere kopi; slett den lagrede stillingen for å fjerne disse. Dette kan ikke angres.", deleteAction: "Slett opplysning og historikk", revision: "Revisjon", byYou: "Registrert av deg", latest: "Viser de siste 20 hendelsene.", count: "Opplysninger", aiBoundary: "Kompetansen lagres lokalt. Valgte bekreftede opplysninger kan deles med Groq etter godkjenning i personlig matching.", statuses: { UNVERIFIED: "Ubekreftet", INFERRED: "Utledet", CONFIRMED: "Bekreftet", REJECTED: "Avvist" }, actions: { MANUAL_ENTRY: "Manuelt registrert", CONTENT_EDIT: "Innhold endret", USER_CONFIRMATION: "Bekreftet av deg", USER_REJECTION: "Avvist av deg" }, errors: { CLAIM_UNAVAILABLE: "Kunne ikke hente eller lagre kompetansen. Prøv igjen.", PROFILE_UNAVAILABLE: "Tjenesten er utilgjengelig. Prøv igjen.", CLAIM_INVALID: "Kontroller opplysningen, kilde og kontekst.", CLAIM_NOT_FOUND: "Opplysningen finnes ikke eller er ikke tilgjengelig.", CLAIM_CONFLICT: "Opplysningen er endret i en annen fane. Utkastet er beholdt. Hent lagret versjon før du vurderer eller redigerer videre; det lukker utkastet.", CLAIM_REVIEW_INVALID: "Denne vurderingen er allerede registrert. Hent lagret versjon.", CLAIM_LIMIT: "Du har nådd pilotgrensen på 100 opplysninger.", ACCESS_DENIED: "Endringen ble avvist. Last siden på nytt og prøv igjen.", AUTH_REQUIRED: "Sesjonen er utløpt. Logg inn igjen.", PROFILE_DISABLED: "Profillagring er ikke aktivert.", PROFILE_NOT_CREATED: "Lagre basisprofilen først." },
  },
  en: {
    existing: "This competency already exists. Its review status is retained.", title: "Experience and competencies", intro: "Describe your own contribution. You confirm each statement before it can be used as confirmed experience.", add: "Add competency", edit: "Edit", confirm: "Confirm", reject: "Reject", history: "History", remove: "Delete", close: "Close", cancel: "Cancel", all: "All", loading: "Loading competencies …", empty: "No competencies recorded yet.", emptyFilter: "No statements in this category.", firstSave: "Save your basic profile first to add experience and competencies.", skill: "Competency", statement: "What did you personally do?", context: "Project or employment", sourceNote: "Basis / source", sourceHint: "For example, your recollection or a reference to a document. CV source quotes can be added in the documents section.", save: "Save statement", busy: "Saving …", created: "Statement saved as unverified.", changed: "Change saved. The content needs confirmation again.", reviewed: "Review saved.", deleted: "Statement and history deleted.", reload: "Load saved version and close draft", editNotice: "Saving creates a new unverified revision, including when the statement was previously confirmed.", confirmTitle: "Confirm your own experience", confirmNotice: "Confirm only if the text and context below describe what you personally did. This is your own confirmation, not an external certification.", confirmAction: "Yes, this describes my experience", rejectTitle: "Reject the statement", rejectNotice: "The statement is retained as rejected with its history. This does not mean you lack the competency in general.", rejectAction: "Reject this statement", deleteTitle: "Permanently delete this statement?", deleteNotice: "The statement and all its revisions will be deleted. Saved job assessments may retain an earlier copy; delete the saved job to remove those copies. This cannot be undone.", deleteAction: "Delete statement and history", revision: "Revision", byYou: "Recorded by you", latest: "Showing the latest 20 events.", count: "Statements", aiBoundary: "Competencies are stored locally. Selected confirmed statements may be shared with Groq after approval in personal matching.", statuses: { UNVERIFIED: "Unverified", INFERRED: "Inferred", CONFIRMED: "Confirmed", REJECTED: "Rejected" }, actions: { MANUAL_ENTRY: "Manually recorded", CONTENT_EDIT: "Content edited", USER_CONFIRMATION: "Confirmed by you", USER_REJECTION: "Rejected by you" }, errors: { CLAIM_UNAVAILABLE: "Could not load or save competencies. Try again.", PROFILE_UNAVAILABLE: "The service is unavailable. Try again.", CLAIM_INVALID: "Check the statement, source and context.", CLAIM_NOT_FOUND: "The statement does not exist or is unavailable.", CLAIM_CONFLICT: "The statement changed in another tab. Your draft was kept. Load the saved version before reviewing or editing again; this closes your draft.", CLAIM_REVIEW_INVALID: "This review is already recorded. Load the saved version.", CLAIM_LIMIT: "You reached the pilot limit of 100 statements.", ACCESS_DENIED: "The change was rejected. Reload and try again.", AUTH_REQUIRED: "Your session expired. Sign in again.", PROFILE_DISABLED: "Profile storage is not enabled.", PROFILE_NOT_CREATED: "Save the basic profile first." },
  },
};
type Modal = { kind: "create" } | { kind: "edit" | "confirm" | "reject" | "history" | "delete"; claim: CompetencyClaim };
type Command = { kind: "create"; content: ClaimContent } | { kind: "edit"; content: ClaimContent; claim: CompetencyClaim } | { kind: "confirm" | "reject" | "delete"; claim: CompetencyClaim };
const empty: ClaimContent = { skill: "", statement: "", context: "", sourceNote: "" };
async function jsonResponse(response: Response): Promise<unknown> {
  const value = await response.json();
  if (!response.ok) throw new Error(typeof value?.code === "string" ? value.code : "CLAIM_UNAVAILABLE");
  return value;
}

export function ClaimPanel({ locale, csrfToken, onAuthRequired }: { locale: Locale; csrfToken: string; onAuthRequired: () => void }) {
  const t = copy[locale]; const cache = useQueryClient();
  const [modal, setModal] = useState<Modal | null>(null);
  const [draft, setDraft] = useState<ClaimContent>(empty);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClaimStatus | "ALL">("ALL");
  const [reviewQueue, setReviewQueue] = useState<string[] | null>(null);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewFinished, setReviewFinished] = useState(false);
  const [notice, setNotice] = useState<"created" | "changed" | "reviewed" | "deleted" | "existing" | null>(null);
  const list = useQuery({ queryKey: ["private-claims"], gcTime: 0, refetchOnReconnect: false, queryFn: async () => {
    const response = await fetch("/api/profile/me/claims", { cache: "no-store" });
    if (response.status === 401) onAuthRequired();
    const value = await jsonResponse(response); if (!isClaimList(value)) throw new Error("CLAIM_UNAVAILABLE"); return value;
  } });
  const historyId = modal?.kind === "history" ? modal.claim.id : undefined;
  const history = useQuery({ queryKey: ["private-claim-history", historyId], enabled: !!historyId, gcTime: 0, refetchOnReconnect: false, queryFn: async () => {
    const response = await fetch(`/api/profile/me/claims/${historyId}/history`, { cache: "no-store" });
    if (response.status === 401) onAuthRequired();
    const value = await jsonResponse(response); if (!isClaimHistory(value)) throw new Error("CLAIM_UNAVAILABLE"); return value;
  } });
  const change = useMutation({ mutationFn: async (command: Command) => {
    const id = command.kind === "create" ? undefined : command.claim.id;
    const url = `/api/profile/me/claims${id ? `/${id}` : ""}${["confirm", "reject"].includes(command.kind) ? "/review" : ""}`;
    const body = command.kind === "create" ? command.content : command.kind === "edit" ? { ...command.content, revision: command.claim.revision } : command.kind === "delete" ? { revision: command.claim.revision } : { decision: command.kind === "confirm" ? "CONFIRM" : "REJECT", revision: command.claim.revision };
    const response = await fetch(url, { method: command.kind === "edit" ? "PUT" : command.kind === "delete" ? "DELETE" : "POST", headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken }, body: JSON.stringify(body) });
    if (response.status === 401) onAuthRequired();
    if (command.kind === "delete" && response.status === 204) return;
    const value = await jsonResponse(response); if (!isClaim(value)) throw new Error("CLAIM_UNAVAILABLE"); return value;
  }, onSuccess: async (value, command) => {
    const existing=command.kind === "create" && value && ((list.data??[]).some(item=>item.id===value.id) || value.status!=="UNVERIFIED");
    if (value) cache.setQueryData<CompetencyClaim[]>(["private-claims"], previous => previous?.some(item => item.id === value.id) ? previous.map(item => item.id === value.id ? value : item) : [...(previous ?? []), value]);
    if (!reviewQueue) setModal(null);
    setDraft(empty);
    setNotice(command.kind === "create" ? existing ? "existing" : "created" : command.kind === "edit" ? "changed" : command.kind === "delete" ? "deleted" : "reviewed");
    cache.removeQueries({ queryKey: ["private-claim-history"] });
    await cache.invalidateQueries({ queryKey: ["private-claims"] });
    if (reviewQueue && command.kind !== "create") advanceReview(command.claim.id);
  } });
  function open(value: Modal) { setReviewQueue(null); setReviewFinished(false); change.reset(); setNotice(null); setModal(value); setDraft(value.kind === "edit" ? { skill: value.claim.skill, statement: value.claim.statement, context: value.claim.context, sourceNote: value.claim.sourceNote } : empty); }
  function close() { if (!change.isPending) { setReviewQueue(null); setModal(null); change.reset(); setDraft(empty); } }
  async function reload() { close(); setNotice(null); await list.refetch(); }
  function submit(event: FormEvent) { event.preventDefault(); if (change.isPending || !modal) return; if (modal.kind === "create") change.mutate({ kind: "create", content: draft }); else if (modal.kind === "edit") change.mutate({ kind: "edit", content: draft, claim: modal.claim }); }
  function message(error: Error | null) { return error ? t.errors[error.message as keyof typeof t.errors] ?? t.errors.CLAIM_UNAVAILABLE : null; }
  const visible = (list.data ?? []).filter(claim => (filter === "ALL" || claim.status === filter) && `${claim.skill} ${claim.statement} ${claim.context} ${claim.sourceNote}`.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)));
  const reviewable = visible.filter(claim => ["UNVERIFIED", "INFERRED"].includes(claim.status));
  function startReview() {
    if (!reviewable.length || change.isPending) return;
    change.reset(); setNotice(null); setReviewFinished(false);
    setReviewTotal(reviewable.length); setReviewQueue(reviewable.map(claim => claim.id));
    setModal({ kind: "confirm", claim: reviewable[0] });
  }
  function advanceReview(currentId: string) {
    change.reset();
    const remaining = (reviewQueue ?? []).filter(id => id !== currentId);
    const current = cache.getQueryData<CompetencyClaim[]>(["private-claims"]) ?? list.data ?? [];
    const next = remaining.map(id => current.find(claim => claim.id === id && ["UNVERIFIED", "INFERRED"].includes(claim.status))).find(claim => !!claim);
    if (next) { setReviewQueue(remaining); setModal({ kind: "confirm", claim: next }); }
    else { setReviewQueue(null); setModal(null); setReviewFinished(true); }
  }
  const stats = [
    { label: locale === "nb" ? "Kompetanseområder" : "Distinct skills", value: new Set((list.data ?? []).filter(c => c.status !== "REJECTED").map(c => c.skill.toLocaleLowerCase(locale).trim())).size, icon: Files },
    { label: locale === "nb" ? "Bekreftede opplysninger" : "Confirmed statements", value: (list.data ?? []).filter(c => c.status === "CONFIRMED").length, icon: ShieldCheck },
    { label: locale === "nb" ? "Trenger gjennomgang" : "Needs review", value: (list.data ?? []).filter(c => ["UNVERIFIED", "INFERRED"].includes(c.status)).length, icon: ClipboardCheck },
  ];
  const actions = (claim: CompetencyClaim) => <div className="claim-actions">
    <Button variant="outline" size="sm" onClick={() => open({ kind: "edit", claim })}><Pencil size={14}/>{t.edit}</Button>
    {claim.status !== "CONFIRMED" && <Button variant="outline" size="sm" onClick={() => open({ kind: "confirm", claim })}><Check size={14}/>{t.confirm}</Button>}
    {claim.status !== "REJECTED" && <Button variant="ghost" size="sm" onClick={() => open({ kind: "reject", claim })}><X size={14}/>{t.reject}</Button>}
    <Button variant="ghost" size="sm" onClick={() => open({ kind: "history", claim })}><History size={14}/>{t.history}</Button>
    <Button variant="ghost" size="sm" onClick={() => open({ kind: "delete", claim })}><Trash2 size={14}/>{t.remove}</Button>
  </div>;
  const selected = modal && modal.kind !== "create" ? modal.claim : null;
  const modalTitle = modal?.kind === "create" ? t.add : modal?.kind === "edit" ? t.edit : modal?.kind === "confirm" ? t.confirmTitle : modal?.kind === "reject" ? t.rejectTitle : modal?.kind === "delete" ? t.deleteTitle : t.history;
  return <Card className="claim-panel" id="profile-competencies"><CardHeader><div className="claim-heading"><h2>{t.title}</h2><Button onClick={() => open({ kind: "create" })} disabled={list.isPending || list.isError}><Plus size={16}/>{t.add}</Button></div><p className="hint">{t.intro}</p></CardHeader><CardContent>
    {reviewFinished && <p role="status" className="claim-notice">{locale === "nb" ? "Gjennomgangen er ferdig. Punkter du hoppet over, er fortsatt ubekreftet." : "Review complete. Skipped items remain unconfirmed."}</p>}
    {notice && <p role="status" className="claim-notice">{t[notice]}</p>}
    {list.isPending && <p role="status">{t.loading}</p>}
    {list.isError && <Alert variant="destructive"><AlertDescription>{message(list.error)}</AlertDescription></Alert>}
    {list.data && <><div className="competency-stats">{stats.map(stat => <div key={stat.label}><stat.icon size={20}/><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
      {reviewable.length > 0 && <div className="guided-review-start"><div><h3>{locale === "nb" ? "La oss avklare erfaringen din" : "Let’s review your experience"}</h3><p>{locale === "nb" ? "Ett synlig forslag om gangen. Les bidrag og kilde, og velg det som stemmer." : "One visible proposal at a time. Read the contribution and source, then choose what is accurate."}</p></div><Button onClick={startReview} disabled={change.isPending}><ClipboardCheck size={17}/>{locale === "nb" ? `Gjennomgå ${reviewable.length} forslag` : `Review ${reviewable.length} proposals`}</Button></div>}
      <div className="competency-search"><Search size={18}/><Input aria-label={locale === "nb" ? "Søk i kompetanse" : "Search competencies"} placeholder={locale === "nb" ? "Søk etter kompetanse, prosjekt eller kilde …" : "Search skills, projects or sources …"} value={search} onChange={event => setSearch(event.target.value)}/></div>
      <div className="claim-filters" aria-label={t.count}><Button variant={filter === "ALL" ? "default" : "outline"} size="sm" aria-pressed={filter === "ALL"} onClick={() => setFilter("ALL")}>{t.all} ({list.data.length})</Button>{(Object.keys(t.statuses) as ClaimStatus[]).map(status => <Button key={status} size="sm" variant={filter === status ? "default" : "outline"} aria-pressed={filter === status} onClick={() => setFilter(status)}>{t.statuses[status]} ({list.data!.filter(claim => claim.status === status).length})</Button>)}</div>
      {visible.length === 0 ? <p className="hint">{list.data.length ? t.emptyFilter : t.empty}</p> : <div className="claim-grid">{visible.map(claim => <article key={claim.id} className="claim-tile" aria-label={claim.skill}><div className="claim-heading"><h3>{claim.skill}</h3><Badge variant="outline" data-claim-status={claim.status}>{t.statuses[claim.status]}</Badge></div><p className="claim-statement">{claim.statement}</p><p className="hint">{claim.context}</p><details><summary>{t.sourceNote}</summary><p className="claim-statement-full">{claim.statement}</p><p className="claim-source">{claim.sourceNote}</p>{claim.sourceQuote && <blockquote className="claim-source">{claim.sourceQuote}</blockquote>}<p className="hint">{t.revision}: {claim.revision}</p><ClaimEvidence id={claim.id} locale={locale}/></details>{actions(claim)}</article>)}</div>}
    </>}
    <p className="hint mt-5">{t.aiBoundary}</p><Button variant="ghost" size="sm" onClick={() => void reload()} disabled={change.isPending}>{t.reload}</Button>
    <Dialog open={!!modal} onOpenChange={value => { if (!value) close(); }}><DialogContent className="claim-dialog" closeLabel={t.close}><DialogHeader><DialogTitle>{modalTitle}</DialogTitle><DialogDescription>{modal?.kind === "edit" ? t.editNotice : modal?.kind === "confirm" ? t.confirmNotice : modal?.kind === "reject" ? t.rejectNotice : modal?.kind === "delete" ? t.deleteNotice : modal?.kind === "create" ? t.sourceHint : t.byYou}</DialogDescription></DialogHeader>
      {change.isError && <Alert variant="destructive" role="alert"><AlertDescription>{message(change.error)}</AlertDescription></Alert>}
      {(modal?.kind === "create" || modal?.kind === "edit") && <form onSubmit={submit} className="claim-form">{(Object.keys(empty) as (keyof ClaimContent)[]).map(key => <div key={key}><label htmlFor={`claim-${key}`}>{t[key]}</label>{key === "skill" ? <Input id={`claim-${key}`} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} maxLength={120} required disabled={change.isPending}/> : <Textarea id={`claim-${key}`} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} maxLength={key === "statement" ? 1000 : 500} rows={key === "statement" ? 3 : 2} required disabled={change.isPending}/>}</div>)}<Button type="submit" disabled={change.isPending}>{change.isPending ? t.busy : t.save}</Button></form>}
      {reviewQueue && <div className="review-progress"><span>{locale === "nb" ? "Forslag" : "Proposal"} {reviewTotal - reviewQueue.length + 1} / {reviewTotal}</span><progress value={reviewTotal - reviewQueue.length} max={reviewTotal} aria-label={locale === "nb" ? "Gjennomgang" : "Review progress"}/></div>}
      {selected && !["edit", "history"].includes(modal!.kind) && <div className="claim-review"><h3>{selected.skill}</h3><p>{selected.statement}</p><p className="hint">{selected.context}</p><p><strong>{t.sourceNote}:</strong> {selected.sourceNote}</p>{selected.sourceQuote && <blockquote className="claim-source">{selected.sourceQuote}</blockquote>}<ClaimEvidence id={selected.id} locale={locale}/><p className="hint">{t.revision}: {selected.revision}</p><Button variant={modal!.kind === "delete" ? "destructive" : "default"} disabled={change.isPending} onClick={() => { if (modal && ["confirm", "reject", "delete"].includes(modal.kind)) change.mutate({ kind: modal.kind as "confirm" | "reject" | "delete", claim: selected }); }}>{change.isPending ? t.busy : modal!.kind === "confirm" ? (reviewQueue ? (locale === "nb" ? "Stemmer · Bekreft min erfaring" : "Accurate · Confirm my experience") : t.confirmAction) : modal!.kind === "reject" ? t.rejectAction : t.deleteAction}</Button>{reviewQueue && <div className="review-secondary"><Button variant="outline" disabled={change.isPending} onClick={() => change.mutate({ kind: "reject", claim: selected })}>{locale === "nb" ? "Stemmer ikke · Avvis" : "Not accurate · Reject"}</Button><Button variant="ghost" disabled={change.isPending} onClick={() => advanceReview(selected.id)}>{locale === "nb" ? "Hopp over" : "Skip for now"}</Button></div>}</div>}
      {modal?.kind === "history" && <div className="claim-history">{history.isPending && <p role="status">{t.loading}</p>}{history.isError && <Alert variant="destructive"><AlertDescription>{message(history.error)}</AlertDescription></Alert>}{history.data && <><ol>{history.data.items.map(item => <li key={item.revision}><div className="claim-heading"><strong>{t.actions[item.action]}</strong><Badge variant="outline">{t.statuses[item.status]}</Badge></div><p className="hint">{t.revision} {item.revision} · {new Date(item.recordedAt).toLocaleString(locale === "nb" ? "nb-NO" : "en-GB")} · {t.byYou}</p><h3>{item.skill}</h3><p>{item.statement}</p><p className="hint">{item.context}</p><p><strong>{t.sourceNote}:</strong> {item.sourceNote}</p>{item.sourceQuote && <blockquote className="claim-source">{item.sourceQuote}</blockquote>}</li>)}</ol>{history.data.total > 20 && <p className="hint">{t.latest}</p>}</>}{history.isError && <Button variant="outline" onClick={() => void history.refetch()}>{t.history}</Button>}</div>}
      <div className="claim-dialog-actions"><Button variant="outline" disabled={change.isPending} onClick={close}>{t.cancel}</Button>{change.isError && <Button variant="outline" disabled={change.isPending} onClick={() => void reload()}>{t.reload}</Button>}</div>
    </DialogContent></Dialog>
  </CardContent></Card>;
}
