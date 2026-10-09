"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  Circle,
  CircleAlert,
  CircleCheck,
  Clock3,
  FileCheck2,
  FileText,
  Layers3,
  LoaderCircle,
  RefreshCw,
  ScanText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { checkCodes, isDocumentCheckReport } from "../lib/document-checks";
import type { DocumentCheckReport } from "../lib/document-checks";
import type { CareerDocument } from "../lib/documents";
import type { Locale } from "../lib/translations";

const messages: Record<(typeof checkCodes)[number], [string, string]> = {
  ORIGINAL_MISSING: ["Originalfilen kunne ikke åpnes.", "Original file could not be opened."],
  ORIGINAL_CHANGED: ["Originalfilen avviker fra lagret kontrollsum.", "Original differs from its saved checksum."],
  ORIGINAL_UNCHANGED: ["Originalfilen er intakt.", "Original file is intact."],
  TEXT_EMPTY: ["Ingen lesbar tekst. Prøv OCR eller en tekstbasert kopi.", "No readable text. Try OCR or a text-based copy."],
  OCR_REQUIRES_REVIEW: ["OCR-tekst finnes. Kontroller den visuelt mot originalen.", "OCR text exists. Check it visually against the original."],
  TEXT_LIMIT_REACHED: ["Tekstgrensen er nådd. Deler av dokumentet kan være utelatt.", "Text limit reached. Parts of this document may be omitted."],
  READER_UNAVAILABLE: ["Originalen kunne ikke leses på nytt. Lagret tekst er beholdt.", "Original could not be reread. Stored text is retained."],
  READER_DIFFERENT: ["Ny lesing ga annen tekst. Åpne dokumentet og vurder å lese det på nytt.", "New reading differs. Open the document and consider rereading."],
  TEXT_READABLE: ["Lagret tekst stemmer med en ny lokal lesing.", "Stored text matches a fresh local reading."],
  NOT_ANALYZED: ["Ingen lagret AI-analyse ennå.", "No stored AI analysis yet."],
  NOT_INCLUDED: ["Dokumentet var ikke med i den samlede analysen.", "The document was not included in the combined analysis."],
  EVIDENCE_CHANGED: ["Ett eller flere kildesitater finnes ikke i dagens tekst. Kontroller analysen.", "Some source quotes are absent from the current text. Review the analysis."],
  NO_SUGGESTIONS: ["Ingen kildebelagte forslag fra dette dokumentet. Kontroller teksten og prøv et annet utdrag.", "No sourced suggestions from this document. Check the text and try another excerpt."],
  PARTIAL_ANALYSIS: ["Kildesitatene finnes i teksten. Analysen dekker bare et utvalg.", "Source quotes exist in the text. Analysis covers only a selection."],
  EVIDENCE_SUPPORTED: ["Kildesitatene finnes i den lagrede teksten. Vurder fortsatt om tolkningen stemmer.", "Source quotes exist in stored text. Still review whether the interpretation is correct."],
};

type DocumentCheck = DocumentCheckReport["documents"][number]["checks"][number];
type CheckState = DocumentCheck["state"];

const checkLabels: Record<DocumentCheck["kind"], { title: [string, string]; icon: typeof FileCheck2 }> = {
  ORIGINAL: { title: ["Original", "Original"], icon: FileCheck2 },
  TEXT: { title: ["Tekstlesing", "Text reading"], icon: ScanText },
  INDIVIDUAL_AI: { title: ["Dokumentanalyse", "Document analysis"], icon: Sparkles },
  COMBINED_AI: { title: ["Samlet analyse", "Combined analysis"], icon: Layers3 },
};

function stateLabel(state: CheckState, nb: boolean) {
  return {
    PASS: nb ? "OK" : "Passed",
    REVIEW: nb ? "Se over" : "Review",
    MISSING: nb ? "Ikke utført" : "Not run",
    FAIL: nb ? "Avvik" : "Issue",
  }[state];
}

function getCheckIcon(state: CheckState) {
  if (state === "PASS") return CircleCheck;
  if (state === "FAIL" || state === "REVIEW") return CircleAlert;
  return Circle;
}

function summarizeDocument(checks: DocumentCheck[], nb: boolean) {
  if (checks.some(check => check.state === "FAIL")) {
    return { label: nb ? "Avvik funnet" : "Issue found", state: "FAIL" };
  }
  if (checks.some(check => check.state === "REVIEW")) {
    return { label: nb ? "Trenger gjennomgang" : "Needs review", state: "REVIEW" };
  }
  if (checks.some(check => check.state === "MISSING")) {
    return { label: nb ? "Ikke fullstendig" : "Not complete", state: "MISSING" };
  }
  return { label: nb ? "Teknisk kontrollert" : "Technically checked", state: "PASS" };
}

function CheckRow({ check, nb }: { check: DocumentCheck; nb: boolean }) {
  const meta = checkLabels[check.kind];
  const Icon = meta.icon;
  const StateIcon = getCheckIcon(check.state);

  return (
    <li className="document-check-item" data-state={check.state}>
      <span className="document-check-icon" aria-hidden="true"><Icon size={17} /></span>
      <div className="document-check-copy">
        <div className="document-check-title">
          <strong>{meta.title[nb ? 0 : 1]}</strong>
          <span className="document-check-state">
            <StateIcon size={14} aria-hidden="true" />
            {stateLabel(check.state, nb)}
          </span>
        </div>
        <p>{messages[check.code][nb ? 0 : 1]}</p>
        {check.items > 0 && (
          <span className="document-check-evidence">
            {check.items} {nb ? "kildepunkter" : "source items"}
          </span>
        )}
      </div>
    </li>
  );
}

export function DocumentChecks({
  documents,
  csrfToken,
  locale,
  onOpen,
  onAuthRequired,
}: {
  documents: CareerDocument[];
  csrfToken: string;
  locale: Locale;
  onOpen: (doc: CareerDocument) => void;
  onAuthRequired: () => void;
}) {
  const nb = locale === "nb";
  const [open, setOpen] = useState(false);
  const check = useMutation({
    retry: false,
    mutationFn: async () => {
      const response = await fetch("/api/profile/me/documents/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
        body: "{}",
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.code ?? "DOCUMENT_UNAVAILABLE");
      if (!isDocumentCheckReport(value)) throw new Error("DOCUMENT_UNAVAILABLE");
      return value;
    },
    onError: error => {
      if (error.message === "AUTH_REQUIRED") onAuthRequired();
    },
  });

  const report = check.data;
  const checks = report?.documents.flatMap(document => document.checks) ?? [];
  const passed = checks.filter(item => item.state === "PASS").length;
  const needsReview = checks.filter(item => item.state === "REVIEW" || item.state === "FAIL").length;
  const notRun = checks.filter(item => item.state === "MISSING").length;

  return (
    <>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => {
          setOpen(true);
          check.mutate();
        }}
        disabled={check.isPending || !documents.length}
      >
        <ShieldCheck size={16} aria-hidden="true" />
        {nb ? "Kontroller dokumentene" : "Check documents"}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="document-workspace-sheet document-check-sheet" closeLabel={nb ? "Lukk" : "Close"}>
          <SheetHeader className="document-check-header">
            <div className="document-check-heading-icon"><ShieldCheck size={21} aria-hidden="true" /></div>
            <div>
              <span className="document-check-eyebrow">{nb ? "KVALITETSKONTROLL" : "QUALITY CHECK"}</span>
              <SheetTitle>{nb ? "Dokumentkontroll" : "Document check"}</SheetTitle>
              <SheetDescription>
                {nb
                  ? "En lokal kontroll av originaler, lesbar tekst og lagrede kildesitater."
                  : "A local check of originals, readable text and stored source quotes."}
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="document-check-assurance">
            <ShieldCheck size={19} aria-hidden="true" />
            <p>
              <strong>{nb ? "Privat og uten nye AI-kall" : "Private and no new AI calls"}</strong>
              <span>
                {nb
                  ? "Ingenting endres. Grønne resultater bekrefter tekniske kontroller – ikke at all kompetanse er funnet eller tolket riktig."
                  : "Nothing changes. Green results confirm technical checks—not that every competency was found or interpreted correctly."}
              </span>
            </p>
          </div>

          {check.isPending && (
            <div className="document-check-feedback" role="status">
              <LoaderCircle size={20} className="document-check-spinner" aria-hidden="true" />
              <div>
                <strong>{nb ? "Kontrollerer dokumentene" : "Checking your documents"}</strong>
                <p>{nb ? "Dette skjer lokalt og tar vanligvis bare et øyeblikk." : "This runs locally and should only take a moment."}</p>
              </div>
            </div>
          )}
          {check.isError && (
            <div className="document-check-feedback document-check-error" role="alert">
              <CircleAlert size={20} aria-hidden="true" />
              <div>
                <strong>{nb ? "Kontrollen kunne ikke fullføres" : "The check could not be completed"}</strong>
                <p>{nb ? "Dokumentene er beholdt. Prøv kontrollen på nytt." : "Your documents are retained. Please try again."}</p>
              </div>
            </div>
          )}

          {report && (
            <>
              <section className="document-check-summary" aria-label={nb ? "Sammendrag av kontroll" : "Check summary"}>
                <div className="document-check-summary-heading">
                  <div>
                    <h3>{nb ? "Kontrollresultat" : "Check results"}</h3>
                    <p>
                      <Clock3 size={14} aria-hidden="true" />
                      <span>{nb ? "Sist kontrollert " : "Last checked "}</span>
                      <time dateTime={report.checkedAt}>{new Date(report.checkedAt).toLocaleString(locale)}</time>
                    </p>
                  </div>
                  <span className="document-check-document-count">
                    <FileText size={15} aria-hidden="true" />
                    {report.documents.length} {nb ? "dokumenter" : "documents"}
                  </span>
                </div>
                <div className="document-check-metrics">
                  <div data-tone="good"><strong>{passed}</strong><span>{nb ? "Bestått" : "Passed"}</span></div>
                  <div data-tone="review"><strong>{needsReview}</strong><span>{nb ? "Se over" : "Review"}</span></div>
                  <div data-tone="quiet"><strong>{notRun}</strong><span>{nb ? "Ikke utført" : "Not run"}</span></div>
                </div>
              </section>

              {report.documents.length ? (
                <section className="document-check-results" aria-label={nb ? "Kontrollerte dokumenter" : "Checked documents"}>
                  <div className="document-check-results-heading">
                    <h3>{nb ? "Dokumenter" : "Documents"}</h3>
                    <span>{report.documents.length} {nb ? "kontrollert" : "checked"}</span>
                  </div>
                  {report.documents.map(result => {
                    const document = documents.find(item => item.id === result.documentId);
                    const status = summarizeDocument(result.checks, nb);
                    return (
                      <Card className="document-check-card" key={result.documentId}>
                        <CardContent>
                          <div className="document-check-card-heading">
                            <span className="document-check-file-icon"><FileText size={20} aria-hidden="true" /></span>
                            <div className="document-check-file-meta">
                              <h4>{document?.originalName ?? (nb ? "Dokument" : "Document")}</h4>
                              <span>{result.characters.toLocaleString(locale)} {nb ? "tegn med lesbar tekst" : "readable characters"}</span>
                            </div>
                            <span className="document-check-overall" data-state={status.state}>
                              {status.state === "PASS" ? <CircleCheck size={15} aria-hidden="true" /> : <CircleAlert size={15} aria-hidden="true" />}
                              {status.label}
                            </span>
                          </div>
                          <ul className="document-check-list">
                            {result.checks.map(item => <CheckRow key={item.kind} check={item} nb={nb} />)}
                          </ul>
                          {document && (
                            <div className="document-check-card-actions">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setOpen(false);
                                  onOpen(document);
                                }}
                              >
                                {nb ? "Åpne dokument" : "Open document"}
                                <ArrowRight size={16} aria-hidden="true" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </section>
              ) : (
                <div className="document-check-feedback" role="status">
                  <FileText size={20} aria-hidden="true" />
                  <p>{nb ? "Ingen dokumenter ble funnet å kontrollere." : "No documents were found to check."}</p>
                </div>
              )}
            </>
          )}

          <div className="document-check-footer">
            <Button className="document-check-rerun" variant="outline" disabled={check.isPending} onClick={() => check.mutate()}>
              {check.isPending
                ? <LoaderCircle size={16} className="document-check-spinner" aria-hidden="true" />
                : <RefreshCw size={16} aria-hidden="true" />}
              {nb ? "Kontroller på nytt" : "Run check again"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
