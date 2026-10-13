import { ChevronDown, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { omissionLabels } from "../lib/document-omissions";
import type { DocumentAnalysis } from "../lib/document-analysis";
import type { Locale } from "../lib/translations";

export function DocumentOmissions({ analysis, locale }: { analysis: DocumentAnalysis; locale: Locale }) {
  if (!analysis.omittedItems) return null;
  const nb = locale === "nb", labels = omissionLabels[locale], reasons = analysis.omissionReasons ?? [];
  const count = (n: number) => n >= 200 ? "200+" : String(n);
  return <Card className="document-omission-card"><CardContent className="document-omission-content"><details>
    <summary><ShieldAlert size={20} aria-hidden="true"/><span><strong>{nb ? "Forslag utelatt etter kildekontroll" : "Proposals omitted after source checks"}</strong><small>{nb ? "Kildeteksten er bevart. Se hva som hindret registrering." : "Source text is retained. See what prevented registration."}</small></span><Badge variant="outline">{count(analysis.omittedItems)}</Badge><ChevronDown size={18} aria-hidden="true"/></summary>
    {reasons.length ? <table><caption className="sr-only">{nb ? "Registrerte årsaker til utelatte forslag" : "Recorded reasons for omitted proposals"}</caption><thead><tr><th scope="col">{nb ? "Område" : "Area"}</th><th scope="col">{nb ? "Årsak" : "Reason"}</th><th scope="col">{nb ? "Antall" : "Count"}</th></tr></thead><tbody>{reasons.map(item => <tr key={`${item.section}:${item.reason}`}><td>{labels.sections[item.section]}</td><td>{labels.reasons[item.reason]}</td><td>{count(item.count)}</td></tr>)}</tbody></table> : <p className="hint">{nb ? "Denne analysen har ingen lagrede forkastelsesårsaker. Nye analyser viser mer detaljer." : "This analysis has no saved omission reasons. New analyses provide more detail."}</p>}
    <p className="hint">{nb ? "Dette forklarer forslag som ble utelatt, ikke alt AI kan ha oversett. Manglende kildegrunnlag betyr ikke at du mangler kompetansen. Samme opplysning kan ha blitt foreslått flere ganger; antall er ikke antall unike kompetanser eller prosjekter." : "This explains omitted proposals, not everything AI may have missed. Missing source support does not mean missing competency. The same statement may have been proposed repeatedly; counts are not unique competencies or projects."}</p>
  </details></CardContent></Card>;
}
