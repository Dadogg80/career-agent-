"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Link2, LoaderCircle, Unlink } from "lucide-react";
import type { CompetencyClaim } from "../lib/claims";
import { entryKinds, entryPeriod, isEntries, type CareerEntry } from "../lib/career-entries";
import { isContextOverview, type ContextCommand, type ClaimCareerContext } from "../lib/claim-contexts";
import type { Locale } from "../lib/translations";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

export function ClaimCareerLinks({ claim, locale, csrfToken, onAuthRequired }: { claim: CompetencyClaim; locale: Locale; csrfToken: string; onAuthRequired: () => void }) {
  const nb = locale === "nb"; const cache = useQueryClient();
  const [open, setOpen] = useState(false); const [picker, setPicker] = useState(false); const [search, setSearch] = useState("");
  const key = ["private-claim-context", claim.id, claim.revision];
  async function request(path: string, body?: ContextCommand) {
    const response = await fetch(path, { cache: "no-store", ...(body ? { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken }, body: JSON.stringify(body) } : {}) });
    if (response.status === 401) onAuthRequired();
    const value: unknown = await response.json();
    if (!response.ok) throw new Error(value && typeof value === "object" && "code" in value ? String(value.code) : "CONTEXT_UNAVAILABLE");
    return value;
  }
  const links = useQuery({ queryKey: key, enabled: open, retry: false, gcTime: 0, queryFn: async () => {
    const value = await request(`/api/profile/me/claims/${claim.id}/contexts`); if (!isContextOverview(value)) throw new Error("CONTEXT_UNAVAILABLE"); return value;
  } });
  const entries = useQuery({ queryKey: ["private-entries"], enabled: picker, retry: false, gcTime: 0, queryFn: async () => {
    const value = await request("/api/profile/me/entries"); if (!isEntries(value)) throw new Error("CONTEXT_UNAVAILABLE"); return value;
  } });
  const change = useMutation({ retry: false, mutationFn: async (body: ContextCommand) => {
    const value = await request(`/api/profile/me/claims/${claim.id}/contexts`, body); if (!isContextOverview(value)) throw new Error("CONTEXT_UNAVAILABLE"); return value;
  }, onSuccess: value => { cache.setQueryData(key, value); setPicker(false); } });
  function decide(entry: CareerEntry, decision: ContextCommand["decision"]) {
    if (!links.data || change.isPending) return;
    const previous = links.data.links.find(link => link.entry.id === entry.id);
    change.mutate({ entryId: entry.id, claimRevision: claim.revision, entryRevision: entry.revision, version: previous?.version ?? 0, decision });
  }
  const label = (entry: CareerEntry) => `${entry.content.organization} · ${entry.content.title}`;
  const visible = links.data?.links.filter(link => link.state !== "REMOVED") ?? [];
  const candidates = (entries.data ?? []).filter(entry => entry.status !== "REJECTED" && !visible.some(link => link.entry.id === entry.id && link.state !== "STALE") &&
    `${label(entry)} ${entry.content.client}`.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)));
  const error = change.error ?? links.error;
  function message(error: Error) { return error.message === "CONTEXT_CONFLICT"
    ? nb ? "Grunnlaget er endret. Hent siste versjon før du velger tilknytning på nytt." : "The evidence changed. Reload before choosing a relationship again."
    : nb ? "Tilknytningen kunne ikke oppdateres. Kompetansen og historikken er beholdt." : "Could not update the relationship. Your competency and history are retained."; }
  function row(link: ClaimCareerContext) {
    const stale = link.state === "STALE"; const inactive = link.state === "INACTIVE";
    return <div className="career-context-row" key={link.entry.id} data-context-state={link.state}>
      <div className="career-context-heading"><Building2 size={15}/><strong>{label(link.entry)}</strong><Badge variant="outline">{stale ? nb ? "Gjennomgå på nytt" : "Review again" : inactive ? nb ? "Inaktiv" : "Inactive" : link.basis === "DOCUMENT" ? nb ? "Fra dokument" : "From document" : nb ? "Valgt av deg" : "Chosen by you"}</Badge></div>
      <p className="hint">{entryKinds[locale][link.entry.content.kind]} · {entryPeriod(link.entry.content, locale)}{link.entry.status === "UNVERIFIED" ? nb ? " · historikk er utkast" : " · history is a draft" : ""}</p>
      {link.entry.content.client && <p className="hint">{nb ? "Kunde" : "Client"}: {link.entry.content.client}</p>}
      {stale && <p className="hint">{nb ? "Kompetansen eller historikken er redigert siden koblingen ble laget." : "The competency or history was edited after linking."}</p>}
      {link.sourceQuote && <details><summary>{nb ? "Kilde for koblingen" : "Relationship source"}</summary><blockquote tabIndex={0} role="region" aria-label={nb ? "Kilde for tilknytningen" : "Relationship evidence"}>{link.sourceQuote}</blockquote>{!link.sourceDocumentId && <p className="hint">{nb ? "Originalen er slettet; sitatet er bevart." : "Original deleted; quote retained."}</p>}</details>}
      <div className="career-context-actions">{stale && claim.status !== "REJECTED" && link.entry.status !== "REJECTED" && <Button size="sm" variant="outline" disabled={change.isPending} onClick={() => decide(link.entry, "LINK")}>{nb ? "Bekreft tilknytningen" : "Confirm relationship"}</Button>}<Button size="sm" variant="ghost" disabled={change.isPending} onClick={() => decide(link.entry, "UNLINK")}><Unlink size={13}/>{nb ? "Fjern kobling" : "Unlink"}</Button></div>
    </div>;
  }
  return <div className="career-context-panel">
    <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}><Link2 size={14}/>{nb ? "Arbeid og prosjekter" : "Work and projects"}{open && visible.length > 0 ? ` (${visible.length})` : ""}</Button>
    {open && <div className="career-context-content" tabIndex={0} role="region" aria-label={nb ? `Tilknytninger: ${claim.skill}` : `Relationships: ${claim.skill}`}>
      {links.isPending && <p role="status" className="hint"><LoaderCircle size={14} className="animate-spin"/>{nb ? "Henter tilknytninger …" : "Loading relationships …"}</p>}
      {error && <p role="status" className="hint">{message(error)} <Button variant="outline" size="sm" disabled={change.isPending} onClick={() => { change.reset(); void cache.invalidateQueries({ queryKey: ["private-claims"] }); void links.refetch(); void entries.refetch(); }}>{nb ? "Hent siste versjon" : "Reload"}</Button></p>}
      {links.data && <>{visible.map(row)}{!visible.length && <p className="hint">{nb ? "Ingen sikker kobling til karrierehistorikken ennå. Velg hvor denne erfaringen hører til." : "No supported career relationship yet. Choose where this experience belongs."}</p>}
        {claim.status !== "REJECTED" && <Button variant="outline" size="sm" disabled={change.isPending} onClick={() => { change.reset(); setSearch(""); setPicker(true); }}><Link2 size={14}/>{nb ? "Knytt til arbeid eller prosjekt" : "Link to work or a project"}</Button>}
        <p className="hint career-context-note">{nb ? "Koblingen organiserer erfaringen; den bekrefter ikke kompetanse eller historikk." : "Linking organizes experience; it does not confirm competency or history."}</p></>}
    </div>}
    <Dialog open={picker} onOpenChange={value => { if (!change.isPending) setPicker(value); }}><DialogContent className="claim-dialog" closeLabel={nb ? "Lukk" : "Close"}><DialogHeader><DialogTitle>{nb ? "Hvor brukte du kompetansen?" : "Where did you use this competency?"}</DialogTitle><DialogDescription>{claim.skill} · {nb ? "Velg en lagret opplysning. Utkast kan knyttes til, og beholder statusen sin." : "Choose a saved entry. Drafts keep their status when linked."}</DialogDescription></DialogHeader>
      <Input aria-label={nb ? "Søk i karrierehistorikken" : "Search career history"} placeholder={nb ? "Firma, prosjekt eller kunde …" : "Company, project or client …"} value={search} disabled={change.isPending} onChange={event => setSearch(event.target.value)}/>
      {change.isError && <p role="alert" className="hint">{message(change.error)}<Button variant="outline" size="sm" onClick={() => { change.reset(); void cache.invalidateQueries({ queryKey: ["private-claims"] }); void links.refetch(); void entries.refetch(); }}>{nb ? "Hent siste versjon" : "Reload"}</Button></p>}
      {entries.isPending && <p role="status">{nb ? "Henter historikk …" : "Loading history …"}</p>}
      {entries.isError && <p role="status">{nb ? "Historikken kunne ikke hentes." : "Could not load history."}<Button variant="outline" onClick={() => void entries.refetch()}>{nb ? "Prøv igjen" : "Try again"}</Button></p>}
      <div className="career-context-picker">{candidates.map(entry => <Button variant="outline" className="career-context-choice" key={entry.id} disabled={change.isPending} onClick={() => decide(entry, "LINK")}><strong>{label(entry)}</strong><span>{entryKinds[locale][entry.content.kind]} · {entryPeriod(entry.content, locale)}{entry.content.client ? ` · ${entry.content.client}` : ""}</span><span>{entry.status === "CONFIRMED" ? nb ? "Bekreftet historikk" : "Confirmed history" : nb ? "Utkast" : "Draft"}</span></Button>)}</div>
      {entries.data && !candidates.length && <p className="hint">{nb ? "Ingen tilgjengelige treff. Arbeid og utdanning finner du i den egne profilfanen." : "No available matches. Work and education are in their own profile tab."}</p>}
      {change.isPending && <p role="status"><LoaderCircle size={16} className="animate-spin"/>{nb ? "Lagrer koblingen …" : "Saving relationship …"}</p>}
    </DialogContent></Dialog>
  </div>;
}
