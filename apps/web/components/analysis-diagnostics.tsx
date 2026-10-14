"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, Bug, CloudDownload, Clock3, DatabaseZap } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Badge } from "./ui/badge";
import type { DiagnosticEvent, AnalysisStage } from "../lib/analysis-workflow";
import type { ImportedJob } from "../lib/job-import";
import type { Locale } from "../lib/translations";
import type { AiCallDiagnostic, AiCallDiagnosticsSnapshot } from "../lib/ai-call-diagnostics";
import { isAiCallDiagnosticsSnapshot } from "../lib/ai-call-diagnostics";

const translations = {
  nb: {
    title: "Utviklerdiagnostikk", tab: "DEV", close: "Lukk diagnostikk", empty: "Ingen analyse startet ennå.", source: "Innhenting", wait: "Pause", analysis: "Analyse",
    states: { running: "Pågår", success: "OK", error: "Feil", skipped: "Ikke nødvendig", cancelled: "Stoppet", idle: "Venter" },
    notice: "Stillingsflytens status vises nedenfor. Fullstendige AI-instruksjoner og svar vises bare når du slår på den midlertidige sporingen.",
    preview: "Se teksten som faktisk ble hentet", sourceNotice: "Dette er det mottatte kildegrunnlaget, som kan være ufullstendig. Det er ikke en ny AI-oppsummering.",
    delay: "Pause mellom FINN-kall", unit: "sekunder", characters: "tegn", counts: "Krav / opplysninger / utelatt", reason: "Avvisningsårsak", code: "Feilkode", run: "Kjøring", reused: "gjenbrukt",
    calls: "Detaljer per kall", endpoint: "Endepunkt", http: "HTTP", duration: "Varighet", payload: "Behandlet innhold", notStarted: "Ikke startet", sourceType: "Kildetype",
    capture: "Start innholdssporing", stop: "Stopp sporing", clear: "Slett innhold", off: "Sporing er av", on: "Midlertidig sporing er aktiv",
    privacy: "Instruksjoner, annonsetekst, dokumentutdrag og profilsvar kan inneholde private opplysninger. Kall fanges bare mens du har slått på sporing. De lagres kun i backend-minne i opptil 10 minutter (maks. 200 kall). Stopp sporing før du deler skjermen; slett innhold for å fjerne det umiddelbart.",
    scope: "Sporing stopper automatisk etter 30 minutter. Bare lokale kall fanges; totalt maks. 12 millioner tegn. Enkeltfelt forkortes ved 60 000 tegn.", unsupported: "Innholdssporing er slått av i backend-konfigurasjonen.",
    unavailable: "Diagnostikkserveren svarer ikke. Kontroller at den lokale backend-tjenesten kjører.", emptyCalls: "Ingen AI-kall er fanget ennå.",
    groups: "Kjøringer", noResponse: "Venter på svar", prompt: "Instruksjoner", input: "Inndata", schema: "Schema og verktøy", response: "Modellsvar",
    inspect: "Vis kallinnhold", status: { RUNNING: "Pågår", SUCCESS: "Fullført", ERROR: "Feil" }, truncated: "Forkortet", private: "Privat innhold",
    validation: { VALIDATED: "Dokumentkontroll: bestått", INVALID_RESULT: "Dokumentkontroll: ugyldig resultat", RECOVERED_INVALID_RESULT: "Dokumentkontroll: ugyldig AI-resultat, lokal gjenoppretting brukt" },
  },
  en: {
    title: "Developer diagnostics", tab: "DEV", close: "Close diagnostics", empty: "No analysis has started yet.", source: "Retrieval", wait: "Pause", analysis: "Analysis",
    states: { running: "Running", success: "OK", error: "Error", skipped: "Not needed", cancelled: "Stopped", idle: "Waiting" },
    notice: "Job workflow status appears below. Full AI instructions and responses are shown only after you enable temporary capture.",
    preview: "See the text actually retrieved", sourceNotice: "This is the received source context, which may be incomplete. It is not another AI summary.",
    delay: "Pause between FINN calls", unit: "seconds", characters: "characters", counts: "Requirements / facts / omitted", reason: "Rejection reason", code: "Error code", run: "Run", reused: "reused",
    calls: "Call details", endpoint: "Endpoint", http: "HTTP", duration: "Duration", payload: "Processed content", notStarted: "Not started", sourceType: "Source type",
    capture: "Start content capture", stop: "Stop capture", clear: "Clear content", off: "Capture is off", on: "Temporary capture is active",
    privacy: "Instructions, advertisement text, document excerpts and profile responses may contain private information. Calls are captured only while you enable capture. They stay in backend memory for up to 10 minutes (maximum 200 calls). Stop capture before sharing your screen; clear content to remove it immediately.",
    scope: "Capture stops automatically after 30 minutes. Only local calls are captured; 12 million characters maximum. Individual fields are truncated at 60,000 characters.", unsupported: "Content capture is disabled in backend configuration.",
    unavailable: "The diagnostics server is unavailable. Check that the local backend is running.", emptyCalls: "No AI calls captured yet.",
    groups: "Runs", noResponse: "Waiting for response", prompt: "Instructions", input: "Input", schema: "Schema and tools", response: "Model response",
    inspect: "Inspect call content", status: { RUNNING: "Running", SUCCESS: "Completed", ERROR: "Error" }, truncated: "Truncated", private: "Private content",
    validation: { VALIDATED: "Document validation: passed", INVALID_RESULT: "Document validation: invalid result", RECOVERED_INVALID_RESULT: "Document validation: invalid AI result; local recovery used" },
  },
};

export function AnalysisDiagnostics({ events = [], imported = null, delay = 0, locale, placement = "edge", jobId, workflowId }: {
  events?: DiagnosticEvent[]; imported?: ImportedJob | null; delay?: number; locale: Locale; placement?: "edge" | "inline"; jobId?: string; workflowId?: string;
}) {
  const t = translations[locale];
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const query = useQuery<AiCallDiagnosticsSnapshot>({
    queryKey: ["private-ai-call-diagnostics"],
    enabled: open,
    retry: false,
    refetchInterval: current => current.state.data?.capturing ? 1200 : false,
    queryFn: async ({ signal }): Promise<AiCallDiagnosticsSnapshot> => {
      const response = await fetch("/api/dev/ai-calls", { cache: "no-store", signal });
      const value: unknown = await response.json();
      if (!response.ok || !isAiCallDiagnosticsSnapshot(value)) throw new Error("AI_DIAGNOSTICS_UNAVAILABLE");
      return value;
    },
  });
  const capture = useMutation({
    retry: false,
    mutationFn: async (capturing: boolean): Promise<boolean> => {
      const response = await fetch("/api/dev/ai-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capturing }),
      });
      const value: unknown = await response.json();
      if (!response.ok || !isAiCallDiagnosticsSnapshot(value)) throw new Error("AI_DIAGNOSTICS_UPDATE_FAILED");
      return value.capturing;
    },
    onSuccess: capturing => queryClient.setQueryData<AiCallDiagnosticsSnapshot>(["private-ai-call-diagnostics"], current =>
      current ? { ...current, capturing } : current),
  });
  const clear = useMutation({
    retry: false,
    mutationFn: async (): Promise<boolean> => {
      const response = await fetch("/api/dev/ai-calls", { method: "DELETE" });
      const value: unknown = await response.json();
      if (!response.ok || !isAiCallDiagnosticsSnapshot(value)) throw new Error("AI_DIAGNOSTICS_CLEAR_FAILED");
      return true;
    },
    onSuccess: () => queryClient.setQueryData<AiCallDiagnosticsSnapshot>(["private-ai-call-diagnostics"], current =>
      current ? { ...current, calls: [] } : current),
  });
  const visibleCalls = useMemo(() => query.data?.calls.filter(call => {
    if (workflowId !== undefined) return call.groupId === `document-workflow:${workflowId}`;
    if (jobId !== undefined) return call.groupId === `job-match:${jobId}` || call.groupId === `job-tailoring:${jobId}`;
    return true;
  }) ?? [], [jobId, query.data?.calls, workflowId]);
  const groups = useMemo(() => {
    const grouped = new Map<string, AiCallDiagnostic[]>();
    for (const call of visibleCalls) grouped.set(call.groupId, [...(grouped.get(call.groupId) ?? []), call]);
    return [...grouped.values()].map(calls => [...calls].sort((a, b) => a.sequence - b.sequence));
  }, [visibleCalls]);
  const stages: AnalysisStage[] = ["source", "wait", "analysis"];
  const callStages: AnalysisStage[] = ["source", "analysis"];
  const active = events.at(-1)?.state === "running" || query.data?.capturing;
  return <Sheet modal={false} open={open} onOpenChange={value => {
    setOpen(value);
    if (!value) {
      void queryClient.cancelQueries({ queryKey: ["private-ai-call-diagnostics"], exact: true });
      queryClient.removeQueries({ queryKey: ["private-ai-call-diagnostics"] });
      capture.reset();
      clear.reset();
    }
  }}>
    <SheetTrigger asChild><Button type="button" variant="outline" className={placement === "inline" ? "diagnostic-inline-trigger" : "diagnostic-tab"} aria-label={t.title} data-active={active}><Bug size={16} /><span>{t.tab}</span><i className="diagnostic-tab-led" aria-hidden="true"/></Button></SheetTrigger>
    <SheetContent side="right" showOverlay={false} className="analysis-diagnostics diagnostic-sheet" closeLabel={t.close} onInteractOutside={event => event.preventDefault()}>
      <SheetHeader className="diagnostic-header">
        <span className="diagnostic-heading-icon"><Bug size={18} aria-hidden="true"/></span>
        <div><SheetTitle className="diagnostic-heading-title">{t.title}<Badge variant="outline">DEV</Badge></SheetTitle><SheetDescription>{t.notice}</SheetDescription></div>
      </SheetHeader>
      <div className="diagnostic-body">
        <section className="ai-capture-panel" aria-label={t.private}>
          <header><div><strong>{t.private}</strong><span data-active={query.data?.capturing}>{query.data?.capturing ? t.on : t.off}</span></div>
            {query.data?.supported && <Button type="button" size="sm" variant={query.data.capturing ? "outline" : "default"} disabled={capture.isPending} onClick={() => capture.mutate(!query.data?.capturing)}>{query.data.capturing ? t.stop : t.capture}</Button>}
          </header>
          <p>{t.privacy}</p><small>{t.scope}</small>
          {!query.data?.supported && !query.isLoading && <p role="status">{t.unsupported}</p>}
          {query.isError && open && <p role="alert">{t.unavailable}</p>}
          {capture.isError && <p role="alert">{locale === "nb" ? "Sporingen kunne ikke endres." : "Capture could not be updated."}</p>}
          {clear.isError && <p role="alert">{locale === "nb" ? "Innholdet kunne ikke slettes." : "Content could not be cleared."}</p>}
        </section>
        {query.data?.supported && <section className="ai-capture-calls" aria-label={t.groups}>
          <header><h3><DatabaseZap size={15} aria-hidden="true"/>{t.groups}<Badge variant="outline">{jobId ? visibleCalls.length : query.data.calls.length}/{query.data.maxCalls}</Badge></h3>
            <Button type="button" size="sm" variant="ghost" disabled={!query.data.calls.length || clear.isPending} onClick={() => clear.mutate()}>{t.clear}</Button>
          </header>
          {!visibleCalls.length && <p className="hint">{t.emptyCalls}</p>}
          {groups.map(group => <details className="ai-call-group" key={group[0].groupId}>
            <summary><span>{group[0].groupLabel}</span><Badge variant="outline">{group.length}</Badge></summary>
            <div className="ai-call-group-items">{group.map(call => <AiCallCard key={call.id} call={call} locale={locale} labels={t}/>)}</div>
          </details>)}
        </section>}
        {events.length > 0 && <p className="diagnostic-delay"><Clock3 size={14} aria-hidden="true"/><span>{t.delay}</span><strong>{delay} {t.unit}</strong></p>}
        {events.length > 0 && <div className="diagnostic-lights">{stages.map(stage => {
          const latest = events.findLast(event => event.stage === stage);
          const state = latest?.state ?? "idle";
          return <div key={stage} data-stage={stage} data-state={state}><span className="diagnostic-led" aria-hidden="true" /><span>{t[stage]} · {t.states[state]}</span></div>;
        })}</div>}
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
        {events.length > 0 && <>
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

function AiCallCard({ call, locale, labels }: {
  call: AiCallDiagnostic;
  locale: Locale;
  labels: typeof translations.nb;
}) {
  const [payloadOpen, setPayloadOpen] = useState(false);
  const sections = [
    ["instructions", labels.prompt, call.instructions],
    ["input", labels.input, call.input],
    ["schema", labels.schema, call.schema],
    ["response", labels.response, call.response ?? labels.noResponse],
  ] as const;
  return <article className="ai-call-entry" data-state={call.status.toLowerCase()}>
    <header><span><strong>#{call.sequence} · {call.task.replaceAll("_", " ")}</strong><small>{call.provider} · {call.model}</small></span>
      <Badge variant="outline">{labels.status[call.status]}</Badge>
    </header>
    {call.downstreamOutcome && <p className="ai-call-meta" role="status">{labels.validation[call.downstreamOutcome]}</p>}
    <details className="ai-call-payload" onToggle={event => setPayloadOpen(event.currentTarget.open)}>
      <summary>{labels.inspect}</summary>
      {payloadOpen && <>
        <code className="diagnostic-endpoint">{call.endpoint}</code>
        <p className="ai-call-meta">{call.durationMs === null ? labels.noResponse : `${call.durationMs} ms`} · {new Date(call.startedAt).toLocaleTimeString(locale === "nb" ? "nb-NO" : "en-US")}{call.errorCode ? ` · ${call.errorCode}` : ""}</p>
        <div className="ai-call-sections">{sections.map(([key, title, text]) => <details key={key}>
          <summary>{title}{call.truncatedFields.includes(key) && <Badge variant="outline">{labels.truncated}</Badge>}</summary>
          <pre>{text}</pre>
        </details>)}</div>
      </>}
    </details>
  </article>;
}
