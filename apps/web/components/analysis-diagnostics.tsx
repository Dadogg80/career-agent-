import { BrainCircuit, Bug, CloudDownload, Clock3, DatabaseZap } from "lucide-react";
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
    delay: "Pause mellom FINN-kall", unit: "sekunder", characters: "tegn", counts: "Krav / opplysninger / utelatt", reason: "Avvisningsårsak", code: "Feilkode", run: "Kjøring", reused: "gjenbrukt",
    calls: "Detaljer per kall", endpoint: "Endepunkt", http: "HTTP", duration: "Varighet", payload: "Behandlet innhold", notStarted: "Ikke startet", sourceType: "Kildetype",
  },
  en: {
    title: "Developer diagnostics", tab: "DEV", close: "Close diagnostics", empty: "No analysis has started yet.", source: "Retrieval", wait: "Pause", analysis: "Analysis",
    states: { running: "Running", success: "OK", error: "Error", skipped: "Not needed", cancelled: "Stopped", idle: "Waiting" },
    notice: "Events also appear in Console with the [Career Agent] prefix. Logs contain status and counts, not advertisement text or API keys.",
    preview: "See the text actually retrieved", sourceNotice: "This is the received source context, which may be incomplete. It is not another AI summary.",
    delay: "Pause between FINN calls", unit: "seconds", characters: "characters", counts: "Requirements / facts / omitted", reason: "Rejection reason", code: "Error code", run: "Run", reused: "reused",
    calls: "Call details", endpoint: "Endpoint", http: "HTTP", duration: "Duration", payload: "Processed content", notStarted: "Not started", sourceType: "Source type",
  },
};

export function AnalysisDiagnostics({ events, imported, delay, locale }: {
  events: DiagnosticEvent[]; imported: ImportedJob | null; delay: number; locale: Locale;
}) {
  const t = translations[locale];
  const stages: AnalysisStage[] = ["source", "wait", "analysis"];
  const callStages: AnalysisStage[] = ["source", "analysis"];
  const active = events.at(-1)?.state === "running";
  return <Sheet modal={false}>
    <SheetTrigger asChild><Button type="button" variant="outline" className="diagnostic-tab" aria-label={t.title} data-active={active}><Bug size={16} /><span>{t.tab}</span><i className="diagnostic-tab-led" aria-hidden="true"/></Button></SheetTrigger>
    <SheetContent side="right" showOverlay={false} className="analysis-diagnostics diagnostic-sheet" closeLabel={t.close} onInteractOutside={event => event.preventDefault()}>
      <SheetHeader className="diagnostic-header">
        <span className="diagnostic-heading-icon"><Bug size={18} aria-hidden="true"/></span>
        <div><SheetTitle className="diagnostic-heading-title">{t.title}<Badge variant="outline">DEV</Badge></SheetTitle><SheetDescription>{t.notice}</SheetDescription></div>
      </SheetHeader>
      <div className="diagnostic-body">
        <p className="diagnostic-delay"><Clock3 size={14} aria-hidden="true"/><span>{t.delay}</span><strong>{delay} {t.unit}</strong></p>
        <div className="diagnostic-lights">{stages.map(stage => {
          const latest = events.findLast(event => event.stage === stage);
          const state = latest?.state ?? "idle";
          return <div key={stage} data-stage={stage} data-state={state}><span className="diagnostic-led" aria-hidden="true" /><span>{t[stage]} · {t.states[state]}</span></div>;
        })}</div>
        {events.length > 0 && <section className="diagnostic-call-section" aria-label={t.calls}>
          <h3><DatabaseZap size={15} aria-hidden="true"/>{t.calls}</h3>
          <div className="diagnostic-calls">{callStages.map(stage => {
            const event = events.findLast(item => item.stage === stage && item.details.endpoint);
            const Icon = stage === "source" ? CloudDownload : BrainCircuit;
            const details = event?.details;
            return <article className="diagnostic-call-card" key={stage} data-state={event?.state ?? "idle"}>
              <header><span className="diagnostic-call-icon"><Icon size={16} aria-hidden="true"/></span><div><strong>{stage === "source" ? t.source : t.analysis}</strong><span>{event ? t.states[event.state] : t.notStarted}</span></div><span className="diagnostic-led" aria-hidden="true"/></header>
              {details?.endpoint && <code className="diagnostic-endpoint">{details.endpoint}</code>}
              {event && details && <dl>
                {details.httpStatus !== undefined && <div><dt>{t.http}</dt><dd>{details.httpStatus}</dd></div>}
                {details.durationMs !== undefined && <div><dt><Clock3 size={12} aria-hidden="true"/>{t.duration}</dt><dd>{details.durationMs} ms</dd></div>}
                {details.characters !== undefined && <div><dt>{t.payload}</dt><dd>{details.characters.toLocaleString(locale === "nb" ? "nb-NO" : "en-US")} {t.characters}</dd></div>}
                {details.sourceType && <div><dt>{t.sourceType}</dt><dd>{details.sourceType}</dd></div>}
                {details.requirements !== undefined && <div><dt>{t.counts}</dt><dd>{details.requirements} / {details.facts ?? 0} / {details.omittedItems ?? 0}</dd></div>}
              </dl>}
              {details?.provider && <p className="diagnostic-call-model">{details.provider} · {details.model}</p>}
              {details?.reason && <p className="diagnostic-call-error">{t.reason}: <code>{details.reason}</code></p>}
              {details?.code && <p className="diagnostic-call-error">{t.code}: <code>{details.code}</code></p>}
              {details?.seconds !== undefined && <p className="diagnostic-call-error">{details.seconds} {t.unit}</p>}
            </article>;
          })}</div>
        </section>}
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
