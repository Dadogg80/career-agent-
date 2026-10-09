"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, LoaderCircle } from "lucide-react";
import { careerPeriodDifferences } from "../lib/career-comparison";
import { entryPeriod, entryKinds, isEntryEvidence, type CareerEntry } from "../lib/career-entries";
import type { Locale } from "../lib/translations";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

function ComparisonSource({ entry, locale, onAuthRequired }: {
  entry: CareerEntry; locale: Locale; onAuthRequired: () => void;
}) {
  const nb = locale === "nb";
  const sources = useQuery({
    queryKey: ["private-entry-evidence", entry.id], gcTime: 0, retry: false,
    queryFn: async () => {
      const response = await fetch(`/api/profile/me/entries/${entry.id}/evidence`, { cache: "no-store" });
      if (response.status === 401) onAuthRequired();
      const value: unknown = await response.json();
      if (!response.ok || !isEntryEvidence(value)) throw new Error("ENTRY_UNAVAILABLE");
      return value;
    },
  });
  return <div className="career-comparison-source" tabIndex={0} role="region" aria-label={nb ? `Kilder for ${entry.content.title}` : `Sources for ${entry.content.title}`}>
    <p className="hint">{nb ? "Kildebeskrivelse" : "Source note"}: {entry.content.sourceNote}</p>
    {sources.isPending && <p role="status" className="flex items-center gap-2"><LoaderCircle size={16} className="animate-spin"/>{nb ? "Henter kilder …" : "Loading sources …"}</p>}
    {sources.isError && <p role="alert">{nb ? "Kildene kunne ikke hentes. Lukk og åpne sammenligningen for å prøve igjen." : "Sources could not be loaded. Close and reopen the comparison to retry."}</p>}
    {sources.data?.length === 0 && <p className="hint">{nb ? "Ingen dokumentutdrag lagret. Kildebeskrivelsen er ikke dokumentbevis." : "No document excerpts saved. The source note is not documentary evidence."}</p>}
    {sources.data?.map((source, index) => <details key={index} open={index === 0}>
      <summary>{source.originalName}</summary>
      <p className="hint">{nb ? "Importrevisjon" : "Import revision"} {source.revision} · {source.periodText || (nb ? "Periode ikke oppgitt" : "Period not stated")}{!source.documentId && (nb ? " · originalen er slettet" : " · original deleted")}</p>
      <blockquote>{source.quote}</blockquote>
    </details>)}
  </div>;
}

export function CareerComparison({ entries, locale, onEdit, onAuthRequired }: {
  entries: CareerEntry[]; locale: Locale; onEdit: (entry: CareerEntry) => void; onAuthRequired: () => void;
}) {
  const nb = locale === "nb";
  const [selection, setSelection] = useState<[string, string] | null>(null);
  const candidates = entries.filter(entry => entry.status !== "REJECTED");
  const differences = careerPeriodDifferences(entries);
  const selected = selection?.map(id => candidates.find(entry => entry.id === id));
  const label = (entry: CareerEntry) => `${entry.content.title} · ${entry.content.organization} · ${entryPeriod(entry.content, locale)} · ${entry.id.slice(0, 8)}`;
  return <section className="career-comparison" aria-label={nb ? "Sammenlign historikk" : "Compare career entries"}>
    <div className="workspace-heading"><div><h3>{nb ? "Stemmer periodene?" : "Do the periods agree?"}</h3>
      <p className="hint">{nb ? "Sammenlign kildene før du retter en opplysning. Flere roller og parallelle prosjekter kan være riktige." : "Compare sources before correcting an entry. Multiple roles and parallel projects can be valid."}</p></div>
      <Button size="sm" variant="outline" disabled={candidates.length < 2} onClick={() => setSelection([candidates[0].id, candidates[1].id])}><ArrowLeftRight size={16}/>{nb ? "Sammenlign historikk" : "Compare career entries"}</Button></div>
    {differences.length > 0 && <details><summary>{nb ? `${differences.length} mulige periodeforskjeller` : `${differences.length} possible period differences`}</summary>
      <p className="hint">{nb ? "Dette er ikke en konklusjon om feil. En eldre CV kan beskrive et arbeid som fortsatt pågikk." : "This is not a finding of error. An older CV may describe employment as still ongoing."}</p>
      <div className="career-difference-list">{differences.map(([a, b]) => <Button key={`${a.id}:${b.id}`} variant="outline" onClick={() => setSelection([a.id, b.id])}><span>{a.content.title} · {a.content.organization}<small>{entryPeriod(a.content, locale)} / {entryPeriod(b.content, locale)}</small></span></Button>)}</div>
    </details>}
    <Dialog open={selection !== null} onOpenChange={open => { if (!open) setSelection(null); }}>
      <DialogContent className="career-comparison-dialog" closeLabel={nb ? "Lukk" : "Close"}><DialogHeader><DialogTitle>{nb ? "Sammenlign historikk og kilder" : "Compare history and sources"}</DialogTitle>
        <DialogDescription>{nb ? "Ingen opplysninger endres av sammenligningen. Rett bare det du vet er feil; redigering krever ny bekreftelse. Begge punktene beholdes når du lukker." : "Comparison changes no facts. Correct only known errors; editing requires renewed confirmation. Closing retains both entries."}</DialogDescription></DialogHeader>
        <div className="career-comparison-columns">{selection?.map((id, side) => {
          const entry = selected?.[side];
          return <article className="career-comparison-column" key={side}>
            <label htmlFor={`career-compare-${side}`}>{nb ? `Historikkpunkt ${side + 1}` : `Career entry ${side + 1}`}</label>
            <select id={`career-compare-${side}`} value={id} onChange={event => setSelection(side === 0 ? [event.target.value, selection[1]] : [selection[0], event.target.value])}>
              {candidates.filter(item => item.id !== selection[1 - side]).map(item => <option key={item.id} value={item.id}>{label(item)}</option>)}
            </select>
            {entry ? <><div className="flex flex-wrap gap-2"><Badge variant="outline">{entryKinds[locale][entry.content.kind]}</Badge><Badge variant="secondary">{entry.status === "CONFIRMED" ? (nb ? "Bekreftet" : "Confirmed") : (nb ? "Ubekreftet" : "Unverified")} · {entry.revision}</Badge></div>
              <h3>{entry.content.title}</h3><p>{entry.content.organization}</p>
              {entry.content.client && <p>{nb ? "Kunde" : "Client"}: {entry.content.client}</p>}
              {entry.content.deliveryRole && <p>{nb ? "Leveranserolle" : "Delivery role"}: {entry.content.deliveryRole}</p>}
              <p className="career-comparison-period">{entryPeriod(entry.content, locale)}</p>
              <Button size="sm" variant="outline" onClick={() => { setSelection(null); onEdit(entry); }}>{nb ? "Rett dette punktet" : "Correct this entry"}</Button>
              {entry.content.description && <p className="career-entry-description" tabIndex={0}>{entry.content.description}</p>}
              <ComparisonSource key={entry.id} entry={entry} locale={locale} onAuthRequired={onAuthRequired}/>
            </> : <p>{nb ? "Punktet er ikke lenger tilgjengelig. Velg et annet." : "Entry no longer available. Choose another."}</p>}
          </article>;
        })}</div>
      </DialogContent>
    </Dialog>
  </section>;
}
