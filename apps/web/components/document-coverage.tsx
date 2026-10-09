"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, Check, CheckCircle2, FileText, GraduationCap, Heart, Lightbulb, Plus, ScanText, Search, Sparkles } from "lucide-react";
import { HelpTip } from "./ui/help-tip";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { isClaim } from "../lib/claims";
import { emptyEntry, entryKinds, isEntry, type EntryContent, type EntryKind } from "../lib/career-entries";
import { isDocumentRun, type DocumentRun } from "../lib/document-workflow";

type Passage = NonNullable<DocumentRun["coverage"]>["passages"][number];
type Destination = "claim" | "entry";

const categoryLabels = {
  nb: { TECHNOLOGY: "Kompetanse", DELIVERY: "Ansvar og leveranser", EDUCATION: "Utdanning", EXPERIENCE: "Erfaring", INTERESTS: "Interesser" },
  en: { TECHNOLOGY: "Competency", DELIVERY: "Responsibilities and delivery", EDUCATION: "Education", EXPERIENCE: "Experience", INTERESTS: "Interests" },
};

function passageIcon(kind: string) {
  if (kind === "INTERESTS") return Heart;
  if (kind === "EDUCATION") return GraduationCap;
  if (kind === "EXPERIENCE") return BriefcaseBusiness;
  if (kind === "TECHNOLOGY") return Lightbulb;
  return FileText;
}

function defaultDestination(kind: string): Destination {
  return kind === "EXPERIENCE" || kind === "EDUCATION" ? "entry" : "claim";
}

function defaultEntryKind(kind: string): EntryKind {
  return kind === "EDUCATION" ? "EDUCATION" : "EMPLOYMENT";
}

function isCoverageResult(value: unknown): value is { run: DocumentRun; claim?: unknown; entry?: unknown } {
  if (!value || typeof value !== "object") return false;
  const result = value as { run?: unknown; claim?: unknown; entry?: unknown };
  return isDocumentRun(result.run) && (result.claim === undefined || isClaim(result.claim)) && (result.entry === undefined || isEntry(result.entry));
}

export function DocumentCoverage({ run, nb, csrfToken, onAuthRequired, onRunUpdate }: {
  run: DocumentRun;
  nb: boolean;
  csrfToken: string;
  onAuthRequired: () => void;
  onRunUpdate: (run: DocumentRun) => void;
}) {
  const locale = nb ? "nb" : "en";
  const cache = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ index: number; passage: Passage } | null>(null);
  const [destination, setDestination] = useState<Destination>("claim");
  const [entryKind, setEntryKind] = useState<EntryKind>("EMPLOYMENT");
  const [claimDraft, setClaimDraft] = useState({ skill: "", statement: "", context: "" });
  const [entryDraft, setEntryDraft] = useState<EntryContent>({ ...emptyEntry });
  const [confirm, setConfirm] = useState(false);
  const report = run.coverage;

  const add = useMutation({
    retry: false,
    mutationFn: async () => {
      if (!selected) throw new Error("DOCUMENT_ANALYSIS_CONFLICT");
      const isEntryDestination = destination === "entry";
      const content = {
        ...entryDraft,
        kind: entryKind,
        sourceNote: undefined,
      };
      const response = await fetch(`/api/profile/me/documents/workflow/${run.id}/coverage/${destination}`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
        body: JSON.stringify(isEntryDestination
          ? { revision: run.revision, index: selected.index, content, confirm }
          : { revision: run.revision, index: selected.index, ...claimDraft, confirm }),
      });
      if (response.status === 401) onAuthRequired();
      const value: unknown = await response.json();
      if (!response.ok) {
        const code = value && typeof value === "object" && "code" in value && typeof value.code === "string" ? value.code : "DOCUMENT_UNAVAILABLE";
        throw new Error(code);
      }
      if (!isCoverageResult(value) || (isEntryDestination ? !isEntry(value.entry) : !isClaim(value.claim))) throw new Error("DOCUMENT_UNAVAILABLE");
      return value;
    },
    onSuccess: async result => {
      onRunUpdate(result.run);
      cache.setQueryData(["private-document-workflow", run.scope], result.run);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["private-claims"] }),
        cache.invalidateQueries({ queryKey: ["private-entries"] }),
        cache.invalidateQueries({ queryKey: ["private-claim-context"] }),
      ]);
      setSelected(null);
      setConfirm(false);
    },
  });

  if (!report) return null;
  const passages = report.passages
    .map((passage, index) => ({ passage, index }))
    .filter(({ passage }) => `${passage.quote} ${categoryLabels[locale][passage.kind as keyof typeof categoryLabels.nb] ?? passage.kind} ${run.analysis.documents.find(doc => doc.documentId === passage.documentId)?.originalName ?? ""}`
      .toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale)));

  function openPassage(index: number, passage: Passage) {
    const initialDestination = defaultDestination(passage.kind);
    setSelected({ index, passage });
    setDestination(initialDestination);
    setEntryKind(defaultEntryKind(passage.kind));
    setClaimDraft({
      skill: passage.kind === "INTERESTS" ? (nb ? "Interesser" : "Interests") : "",
      statement: passage.quote,
      context: nb ? "Kontekst ikke oppgitt" : "Context not stated",
    });
    setEntryDraft({ ...emptyEntry, kind: defaultEntryKind(passage.kind), description: passage.quote });
    setConfirm(false);
    add.reset();
  }

  return <>
    <Card className="document-coverage">
      <CardContent>
        <div className="document-results-heading">
          <h3><span className="coverage-heading-icon"><ScanText size={18}/></span>{nb ? "Kontroll av dokumentinnhold" : "Document content check"}</h3>
          <HelpTip label={nb ? "Om kildekontrollen" : "About the source check"}>{nb ? "Vi sammenligner relevante kildepassasjer med uttrekket. Dette kontrollerer kildebruk, ikke om all kompetanse er funnet." : "We compare relevant source passages with extraction. This checks source usage, not whether all competencies were found."}</HelpTip>
          <Badge variant="outline">{run.phase === "REPAIR" ? (nb ? "Ekstra gjennomgang" : "Targeted follow-up") : (nb ? "Kildekontroll" : "Source check")}</Badge>
        </div>
        <div className="coverage-summary">
          <span className="coverage-stat coverage-stat-supported"><Check size={16}/><strong>{report.represented}</strong> {nb ? "passasjer med kilde i resultatet" : "passages linked to results"}</span>
          <span className="coverage-stat coverage-stat-review"><Search size={16}/><strong>{report.remaining}</strong> {nb ? "kan trenge gjennomgang" : "may need review"}</span>
        </div>
        {report.repairCalls > 0 && <p className="hint">{report.repairCalls} {nb ? "avgrensede oppfølgingstrinn i denne analysen" : "bounded follow-up steps in this analysis"}. {nb ? "Fremdrift og funn lagres underveis." : "Progress and findings are saved as the analysis runs."}</p>}
        {report.limited && <p className="coverage-limit-note">{nb ? "Kontrollen nådde grensen for passasjer. Andre deler kan fortsatt kreve gjennomgang." : "The passage check reached its limit. Other source material may still need review."}</p>}
        {!!report.passages.length && <details className="coverage-review-details">
          <summary><span className="coverage-summary-icon"><Search size={16}/></span>{nb ? "Se passasjer som kan være oversett" : "Review passages that may have been missed"}<Badge variant="outline">{report.remaining}</Badge></summary>
          <p className="coverage-review-intro">{nb ? "Dette er kildeutdrag – ikke ferdig profilopplysninger. Velg hvordan et utdrag skal lagres, rediger det, og bekreft kun det som faktisk beskriver deg." : "These are source excerpts—not ready-made profile facts. Choose how to save an excerpt, edit it, and confirm only what accurately describes you."}</p>
          <Input aria-label={nb ? "Søk i kildepassasjer" : "Search source passages"} placeholder={nb ? "Søk etter tekst eller dokument …" : "Search text or document …"} value={search} onChange={event => setSearch(event.target.value)}/>
          <div className="coverage-passage-list" aria-label={nb ? "Passasjer til gjennomgang" : "Passages to review"}>
            {passages.map(({ passage, index }) => {
              const Icon = passageIcon(passage.kind);
              const sourceName = run.analysis.documents.find(doc => doc.documentId === passage.documentId)?.originalName ?? (nb ? "Dokument" : "Document");
              const saved = !!passage.profileClaimId || !!passage.profileEntryId;
              return <article key={`${passage.documentId}:${passage.sourceStart}`} className="coverage-passage-card" data-category={passage.kind.toLowerCase()}>
                <div className="coverage-passage-topline"><span className={`coverage-category-icon coverage-category-${passage.kind.toLowerCase()}`}><Icon size={16}/></span><Badge variant="outline">{categoryLabels[locale][passage.kind as keyof typeof categoryLabels.nb] ?? passage.kind}</Badge><span className="coverage-passage-source"><FileText size={13}/>{sourceName}</span></div>
                <blockquote>{passage.quote}</blockquote>
                <div className="coverage-passage-actions">
                  {saved ? <span className="coverage-added-status"><CheckCircle2 size={15}/>{nb ? "Lagt til i profilen" : "Added to profile"}</span> :
                    <Button size="sm" onClick={() => openPassage(index, passage)}><Plus size={15}/>{nb ? "Behandle som profilutkast" : "Review as a profile draft"}</Button>}
                  {passage.reviewState === "CONFIRMED" && <Badge className="coverage-confirmed-badge">{nb ? "Bekreftet av deg" : "Confirmed by you"}</Badge>}
                </div>
              </article>;
            })}
            {!passages.length && <div className="coverage-no-results"><Search size={19}/><p>{nb ? "Ingen passasjer passer søket." : "No passages match your search."}</p></div>}
          </div>
          {report.remaining > report.passages.length && <p className="hint">{nb ? `Viser de første ${report.passages.length} passasjene. Se dokumentgrunnlaget over for hele teksten.` : `Showing the first ${report.passages.length} passages. See the approved sources above for the full text.`}</p>}
        </details>}
      </CardContent>
    </Card>
    <Sheet open={selected !== null} onOpenChange={open => { if (!open && !add.isPending) { setSelected(null); add.reset(); } }}>
      <SheetContent className="coverage-review-sheet" closeLabel={nb ? "Lukk" : "Close"}>
        <SheetHeader>
          <SheetTitle>{nb ? "Legg kildeutdrag til profilen" : "Add a source excerpt to your profile"}</SheetTitle>
          <SheetDescription>{nb ? "Velg et profilområde og rediger opplysningene. Utdraget beholdes som kilde. Nye opplysninger lagres ubekreftet med mindre du bekrefter dem." : "Choose a profile section and edit the details. The excerpt remains attached as evidence. New information is saved unverified unless you confirm it."}</SheetDescription>
        </SheetHeader>
        {selected && <>
          <div className="coverage-editor-source"><span><FileText size={14}/>{run.analysis.documents.find(doc => doc.documentId === selected.passage.documentId)?.originalName}</span><blockquote>{selected.passage.quote}</blockquote></div>
          <label htmlFor="coverage-destination">{nb ? "Hvor skal det lagres?" : "Where should it go?"}</label>
          <select id="coverage-destination" value={destination} onChange={event => {setDestination(event.target.value as Destination); add.reset();}}>
            <option value="claim">{nb ? "Kompetanse eller interesse" : "Competency or interest"}</option>
            <option value="entry">{nb ? "Arbeid, prosjekt eller utdanning" : "Employment, project or education"}</option>
          </select>
          {destination === "claim" ? <div className="coverage-editor-fields">
            <label htmlFor="coverage-skill">{nb ? "Kompetanse / tema" : "Competency / topic"}</label>
            <Input id="coverage-skill" value={claimDraft.skill} maxLength={120} onChange={event => setClaimDraft({ ...claimDraft, skill: event.target.value })}/>
            <label htmlFor="coverage-statement">{nb ? "Hva vil du vise i profilen?" : "What do you want to show on your profile?"}</label>
            <Textarea id="coverage-statement" value={claimDraft.statement} maxLength={1000} rows={4} onChange={event => setClaimDraft({ ...claimDraft, statement: event.target.value })}/>
            <label htmlFor="coverage-context">{nb ? "Firma / prosjekt / kontekst" : "Company / project / context"}</label>
            <Input id="coverage-context" value={claimDraft.context} maxLength={500} onChange={event => setClaimDraft({ ...claimDraft, context: event.target.value })}/>
          </div> : <div className="coverage-editor-fields">
            <label htmlFor="coverage-entry-kind">{nb ? "Type" : "Type"}</label>
            <select id="coverage-entry-kind" value={entryKind} onChange={event => setEntryKind(event.target.value as EntryKind)}>{Object.entries(entryKinds[locale]).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select>
            <label htmlFor="coverage-entry-title">{nb ? "Formell tittel / navn" : "Formal title / name"}</label>
            <Input id="coverage-entry-title" value={entryDraft.title} maxLength={200} onChange={event => setEntryDraft({ ...entryDraft, title: event.target.value })}/>
            <label htmlFor="coverage-entry-organization">{nb ? "Arbeidsgiver / organisasjon" : "Employer / organization"}</label>
            <Input id="coverage-entry-organization" value={entryDraft.organization} maxLength={200} onChange={event => setEntryDraft({ ...entryDraft, organization: event.target.value })}/>
            <label htmlFor="coverage-entry-description">{nb ? "Eget bidrag / beskrivelse" : "Your contribution / description"}</label>
            <Textarea id="coverage-entry-description" value={entryDraft.description} maxLength={2000} rows={4} onChange={event => setEntryDraft({ ...entryDraft, description: event.target.value })}/>
          </div>}
          <label className="consent-row coverage-confirm-control"><input type="checkbox" checked={confirm} onChange={event => setConfirm(event.target.checked)}/>{nb ? "Jeg har kontrollert dette og bekrefter at det beskriver meg" : "I reviewed this and confirm that it describes me"}</label>
          {add.error && <p role="alert" className="coverage-error">{nb ? add.error.message === "DOCUMENT_ANALYSIS_CONFLICT" ? "Kilden eller analysen er endret. Lukk og åpne gjennomgangen på nytt." : "Opplysningen kunne ikke lagres. Kontroller feltene og prøv igjen." : add.error.message === "DOCUMENT_ANALYSIS_CONFLICT" ? "The source or analysis changed. Close and reopen the review." : "The information could not be saved. Check the fields and try again."}</p>}
          <Button className="coverage-save-button" disabled={add.isPending || (destination === "claim" ? !claimDraft.skill.trim() || !claimDraft.statement.trim() || !claimDraft.context.trim() : !entryDraft.title.trim() || !entryDraft.organization.trim())} onClick={() => add.mutate()}>
            {add.isPending ? nb ? "Lagrer …" : "Saving …" : <><Sparkles size={16}/>{confirm ? nb ? "Lagre og bekreft" : "Save and confirm" : nb ? "Lagre som ubekreftet" : "Save as unverified"}</>}
          </Button>
        </>}
      </SheetContent>
    </Sheet>
  </>;
}
