import { Bug } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Badge } from "./ui/badge";
import type { DiagnosticEvent, AnalysisStage } from "../lib/analysis-workflow";
import type { ImportedJob } from "../lib/job-import";
import type { Locale } from "../lib/translations";

const translations = {
  nb: {
    title: "Utviklerdiagnostikk", tab: "DEV", close: "Lukk diagnostikk", empty: "Ingen analyse startet ennå.", source: "Innhenting", wait: "Pause", analysis: "Analyse",
    states: { running: "Pågår", success: "OK", error: "Feil", skipped: "Ikke nødvendig", cancelled: "Stoppet", idle: "Venter" },
    notice: "Hendelsene finnes også i Console med prefikset [Career Agent]. Loggene inneholder status og antall, ikke annonsetekst eller API-nøkler.",
    preview: "Se teksten som faktisk ble hentet", sourceNotice: "Dette er det mottatte kildegrunnlaget, som kan være ufullstendig. Det er ikke en ny AI-oppsummering.",
    delay: "Pause mellom FINN-kall", unit: "sekunder", characters: "tegn", counts: "Antall krav / opplysninger / utelatt", reason: "Avvisningsårsak", code: "Feilkode", run: "Kjøring", reused: "gjenbrukt",
  },
  en: {
    title: "Developer diagnostics", tab: "DEV", close: "Close diagnostics", empty: "No analysis has started yet.", source: "Retrieval", wait: "Pause", analysis: "Analysis",
    states: { running: "Running", success: "OK", error: "Error", skipped: "Not needed", cancelled: "Stopped", idle: "Waiting" },
    notice: "Events also appear in Console with the [Career Agent] prefix. Logs contain status and counts, not advertisement text or API keys.",
    preview: "See the text actually retrieved", sourceNotice: "This is the received source context, which may be incomplete. It is not another AI summary.",
    delay: "Pause between FINN calls", unit: "seconds", characters: "characters", counts: "Requirements / facts / omitted", reason: "Rejection reason", code: "Error code", run: "Run", reused: "reused",
  },
};

export function AnalysisDiagnostics({ events, imported, delay, locale }: {
  events: DiagnosticEvent[]; imported: ImportedJob | null; delay: number; locale: Locale;
}) {
  const t = translations[locale];
  const stages: AnalysisStage[] = ["source", "wait", "analysis"];
  return <Sheet modal={false}>
    <SheetTrigger asChild><Button type="button" variant="outline" className="diagnostic-tab" aria-label={t.title}><Bug size={16} /><span>{t.tab}</span></Button></SheetTrigger>
    <SheetContent side="right" className="analysis-diagnostics diagnostic-sheet" closeLabel={t.close} onInteractOutside={event => event.preventDefault()}>
      <SheetHeader><SheetTitle className="flex items-center gap-2"><Bug size={18} />{t.title}<Badge variant="outline">DEV</Badge></SheetTitle><SheetDescription>{t.notice}</SheetDescription></SheetHeader>
      <div className="diagnostic-body">
        <p className="hint">{t.delay}: {delay} {t.unit}</p>
        <div className="diagnostic-lights">{stages.map(stage => {
          const latest = events.findLast(event => event.stage === stage);
          const state = latest?.state ?? "idle";
          return <div key={stage} data-stage={stage} data-state={state}><span className="diagnostic-led" aria-hidden="true" /><span>{t[stage]} · {t.states[state]}</span></div>;
        })}</div>
        {events.length === 0 ? <p className="hint">{t.empty}</p> : <>
          <p className="hint">{t.run}: <code>{events[0].runId}</code></p>
          <ol className="diagnostic-events">{events.map((event, index) => <li key={index} data-state={event.state}>
            <span className="diagnostic-led" aria-hidden="true" /><div>
              <strong>{t[event.stage]} · {t.states[event.state]}</strong><span className="diagnostic-time">+{(event.elapsedMs / 1000).toFixed(1)}s</span>
              <p>{event.details.endpoint}{event.details.httpStatus !== undefined && ` · HTTP ${event.details.httpStatus}`}{event.details.durationMs !== undefined && ` · ${event.details.durationMs}ms`}</p>
              {event.details.characters !== undefined && <p>{event.details.characters} {t.characters} · {event.details.sourceType}{event.details.reused && ` · ${t.reused}`}</p>}
              {event.details.seconds !== undefined && <p>{event.details.seconds} {t.unit}</p>}
              {event.details.requirements !== undefined && <p>{t.counts}: {event.details.requirements} / {event.details.facts} / {event.details.omittedItems}</p>}
              {event.details.provider && <p>{event.details.provider} · {event.details.model}</p>}
              {event.details.reason && <p>{t.reason}: <code>{event.details.reason}</code></p>}
              {event.details.code && <p>{t.code}: <code>{event.details.code}</code></p>}
            </div>
          </li>)}</ol>
        </>}
        {imported && <details className="diagnostic-source"><summary>{t.preview}</summary><p className="hint">{t.sourceNotice}</p><pre>{imported.text}</pre></details>}
      </div>
    </SheetContent>
  </Sheet>;
}
