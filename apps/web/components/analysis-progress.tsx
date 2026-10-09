import { AiIdentity } from "./ai-identity";
import type { AiSelection } from "../lib/ai-configuration";
import { ArrowRight, CalendarDays, Check, FileSearch, Hourglass, ListChecks, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import type { AnalysisPhase } from "../lib/analysis-workflow";
import type { Locale } from "../lib/translations";

export const progressTranslations = {
  nb: {
    title: "Fra annonse til oversikt", source: "Hent annonse", pasted: "Tekst klar", wait: "Kort pause", skipWait: "Ingen pause", analysis: "Analyser", done: "Klar",
    fetching: "Henter annonsetekst fra lenken …", waiting: "Annonsen er hentet. Analysen starter om", seconds: "sekunder.",
    analyzing: "Analyserer krav og nyttige opplysninger …", pauseReason: "Vi venter mellom Groq-kallene for å redusere presset på kvoten.",
    cancel: "Stopp før analyse", chips: ["Kompetanse", "Arbeidssted", "Søknadsfrist"], step: "Trinn", sourceCard: "Stillingsannonse",
  },
  en: {
    title: "From advertisement to overview", source: "Fetch advertisement", pasted: "Text ready", wait: "Short pause", skipWait: "No pause", analysis: "Analyze", done: "Ready",
    fetching: "Fetching advertisement text from the link …", waiting: "Advertisement fetched. Analysis starts in", seconds: "seconds.",
    analyzing: "Analyzing requirements and useful information …", pauseReason: "We pause between Groq calls to reduce pressure on the quota.",
    cancel: "Stop before analysis", chips: ["Skills", "Location", "Deadline"], step: "Step", sourceCard: "Job advertisement",
  },
};

export function AnalysisProgress({ phase, seconds, locale, pasted, paused, onCancel,selection,sourceSelection }: {
  sourceSelection?:AiSelection;selection?:AiSelection;phase: AnalysisPhase; seconds: number; locale: Locale; pasted: boolean; paused: boolean; onCancel: () => void;
}) {
  const t = progressTranslations[locale];
  const active = phase === "source" ? 0 : phase === "wait" ? 1 : 2;
  const steps = [pasted ? t.pasted : t.source, paused ? t.wait : t.skipWait, t.analysis, t.done];
  const description = phase === "source" ? t.fetching : phase === "wait" ? `${t.waiting} ${seconds} ${t.seconds}` : t.analyzing;
  const ActiveIcon = phase === "source" ? FileSearch : phase === "wait" ? Hourglass : Sparkles;
  const contentIcons = [ListChecks, MapPin, CalendarDays];
  return <Card className="analysis-progress" aria-labelledby="progress-title" aria-busy="true">
    <CardContent>
      <div className="analysis-progress-heading">
        <span className={`analysis-progress-mark analysis-progress-mark-${phase}`}><ActiveIcon aria-hidden="true"/></span>
        <div className="analysis-progress-heading-copy">
          <p className="analysis-progress-eyebrow">{locale === "nb" ? "ANNONSE → INNSIKT" : "ADVERTISEMENT → INSIGHT"}</p>
          <h3 id="progress-title">{t.title}</h3>
        </div>
        <span className="analysis-progress-stage">{t.step} {Math.min(active + 1, steps.length)} / {steps.length}</span>
      </div>
      <div className="analysis-progress-identities">
        {phase==="source" && sourceSelection && <AiIdentity selections={[sourceSelection]} locale={locale} label={locale==="nb"?"Henter med":"Fetching with"}/>}
        {phase!=="source" && <AiIdentity selections={selection?[selection]:undefined} locale={locale} label={locale==="nb"?"Analyse":"Analysis"}/>}
      </div>
      <ol className="progress-steps" aria-label={t.title}>
        {steps.map((label, index) => <li key={label} data-state={index < active ? "complete" : index === active ? "active" : "queued"} aria-current={index === active ? "step" : undefined}>
          <span>{index < active ? <Check size={14} /> : index + 1}</span>{label}
        </li>)}
      </ol>
      <div className={`sorting-animation progress-flow progress-flow-${phase}`} aria-hidden="true">
        <div className="progress-flow-source">
          <span className="sorting-document"><ActiveIcon/></span>
          <span className="progress-flow-source-label">{t.sourceCard}</span>
          <span className="progress-source-lines"><i/><i/><i/></span>
        </div>
        <span className="progress-flow-connector"><ArrowRight/></span>
        <div className="sorting-chips">{t.chips.map((label, index) => {
          const Icon = contentIcons[index];
          return <div className="progress-flow-chip" key={label}><span><Icon/></span><strong>{label}</strong><i/></div>;
        })}</div>
      </div>
      <div className={`analysis-progress-activity analysis-progress-activity-${phase}`} aria-hidden="true"><span/></div>
      <p role="status" className="progress-description">{description}</p>
      {phase === "wait" && <><p className="hint">{t.pauseReason}</p><Button variant="outline" type="button" onClick={onCancel}>{t.cancel}</Button></>}
    </CardContent>
  </Card>;
}
