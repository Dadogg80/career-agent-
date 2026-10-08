import { AiIdentity } from "./ai-identity";
import type { AiSelection } from "../lib/ai-configuration";
import { Check, FileSearch, Hourglass, Sparkles } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import type { AnalysisPhase } from "../lib/analysis-workflow";
import type { Locale } from "../lib/translations";

export const progressTranslations = {
  nb: {
    title: "Fra annonse til oversikt", source: "Hent annonse", pasted: "Tekst klar", wait: "Kort pause", skipWait: "Ingen pause", analysis: "Analyser", done: "Klar",
    fetching: "Henter annonsetekst fra lenken …", waiting: "Annonsen er hentet. Analysen starter om", seconds: "sekunder.",
    analyzing: "Analyserer krav og nyttige opplysninger …", pauseReason: "Vi venter mellom Groq-kallene for å redusere presset på kvoten.",
    cancel: "Stopp før analyse", chips: ["Kompetanse", "Arbeidssted", "Søknadsfrist"],
  },
  en: {
    title: "From advertisement to overview", source: "Fetch advertisement", pasted: "Text ready", wait: "Short pause", skipWait: "No pause", analysis: "Analyze", done: "Ready",
    fetching: "Fetching advertisement text from the link …", waiting: "Advertisement fetched. Analysis starts in", seconds: "seconds.",
    analyzing: "Analyzing requirements and useful information …", pauseReason: "We pause between Groq calls to reduce pressure on the quota.",
    cancel: "Stop before analysis", chips: ["Skills", "Location", "Deadline"],
  },
};

export function AnalysisProgress({ phase, seconds, locale, pasted, paused, onCancel,selection,sourceSelection }: {
  sourceSelection?:AiSelection;selection?:AiSelection;phase: AnalysisPhase; seconds: number; locale: Locale; pasted: boolean; paused: boolean; onCancel: () => void;
}) {
  const t = progressTranslations[locale];
  const active = phase === "source" ? 0 : phase === "wait" ? 1 : 2;
  const steps = [pasted ? t.pasted : t.source, paused ? t.wait : t.skipWait, t.analysis, t.done];
  const description = phase === "source" ? t.fetching : phase === "wait" ? `${t.waiting} ${seconds} ${t.seconds}` : t.analyzing;
  return <Card className="analysis-progress" aria-labelledby="progress-title" aria-busy="true">
    <CardContent>
      {phase==="source" && sourceSelection && <AiIdentity selections={[sourceSelection]} locale={locale} label={locale==="nb"?"Henter med":"Fetching with"}/>}
      {phase!=="source" && <AiIdentity selections={selection?[selection]:undefined} locale={locale} label={locale==="nb"?"Analyse":"Analysis"}/>}<p className="step-label" id="progress-title">{t.title}</p>
      <ol className="progress-steps" aria-label={t.title}>
        {steps.map((label, index) => <li key={label} data-state={index < active ? "complete" : index === active ? "active" : "queued"} aria-current={index === active ? "step" : undefined}>
          <span>{index < active ? <Check size={14} /> : index + 1}</span>{label}
        </li>)}
      </ol>
      <div className="sorting-animation" aria-hidden="true">
        <div className="sorting-document">{phase === "source" ? <FileSearch size={34} /> : phase === "wait" ? <Hourglass size={34} /> : <Sparkles size={34} />}</div>
        <div className="sorting-chips">{t.chips.map(label => <span key={label}>{label}</span>)}</div>
      </div>
      <p role="status" className="progress-description">{description}</p>
      {phase === "wait" && <><p className="hint">{t.pauseReason}</p><Button variant="outline" type="button" onClick={onCancel}>{t.cancel}</Button></>}
    </CardContent>
  </Card>;
}
