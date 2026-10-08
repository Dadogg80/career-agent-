"use client";

import { ScanText, Check, Search } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import type { DocumentRun } from "../lib/document-workflow";

export function DocumentCoverage({ run, nb }: {run:DocumentRun;nb:boolean}) {
  const report=run.coverage;
  if(!report)return null;
  const labels:Record<string,string>=nb?{TECHNOLOGY:"Teknologier",DELIVERY:"Ansvar og leveranser",EDUCATION:"Utdanning og kurs",EXPERIENCE:"Erfaring",INTERESTS:"Interesser"}:{TECHNOLOGY:"Technologies",DELIVERY:"Responsibilities and delivery",EDUCATION:"Education and courses",EXPERIENCE:"Experience",INTERESTS:"Interests"};
  return <Card className="document-coverage"><CardContent>
    <div className="document-results-heading"><h3><ScanText size={18}/>{nb?"Kontroll av dokumentinnhold":"Document content check"}</h3><Badge variant="outline">{run.phase==="REPAIR"?(nb?"Ekstra gjennomgang":"Targeted follow-up"):(nb?"Kildekontroll":"Source check")}</Badge></div>
    <div className="coverage-summary"><span><Check size={16}/><strong>{report.represented}</strong> {nb?"passasjer med kilde i resultatet":"passages linked to results"}</span><span><Search size={16}/><strong>{report.remaining}</strong> {nb?"kan trenge gjennomgang":"may need review"}</span></div>
    <p className="hint">{nb?"Vi sammenligner relevante kildepassasjer med det som ble hentet ut. Dette er en kontroll av kildebruk, ikke en garanti for at all kompetanse er funnet.":"We compare relevant source passages with extracted evidence. This checks source usage; it does not guarantee every competency was found."}</p>
    {report.repairCalls>0 && <p className="hint">{report.repairCalls} {nb?"avgrensede oppfølgingstrinn i denne analysen":"bounded follow-up steps in this analysis"}. {nb?"Fremdrift og funn lagres underveis.":"Progress and findings are saved along the way."}</p>}
    {report.limited && <p className="hint">{nb?"Kontrollen nådde grensen for passasjer. Ytterligere innhold kan kreve gjennomgang.":"The passage-check limit was reached. Further content may need review."}</p>}
    {!!report.passages.length && <details><summary>{nb?"Se passasjer som kan være oversett":"Inspect potentially missed passages"} ({report.remaining})</summary>
      <div className="coverage-passages" role="region" aria-label={nb?"Passasjer til gjennomgang":"Passages to review"} tabIndex={0}>{report.passages.map((p,i)=><article key={`${p.documentId}:${p.sourceStart}:${i}`}><div><Badge variant="outline">{labels[p.kind]??p.kind}</Badge><span className="hint">{run.analysis.documents.find(d=>d.documentId===p.documentId)?.originalName}</span></div><blockquote>{p.quote}</blockquote></article>)}</div>
      {report.remaining>report.passages.length && <p className="hint">{nb?`Viser de første ${report.passages.length} passasjene. Hele dokumentgrunnlaget er tilgjengelig over.`:`Showing the first ${report.passages.length} passages. The full document sources are available above.`}</p>}
    </details>}
  </CardContent></Card>;
}
