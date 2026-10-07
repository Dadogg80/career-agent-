"use client";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { jobTranslations } from "../lib/job-translations";
import { sourceContext } from "../lib/requirement-details";
import type { Requirement, RequirementKind } from "../lib/job-requirements";
import type { Locale } from "../lib/translations";

const kinds: RequirementKind[] = ["REQUIRED", "PREFERRED", "UNCLEAR"];
export function RequirementResults({ requirements, source, locale, resultLocale, browserExcerpt, outdated }: {
  requirements: Requirement[]; source: string; locale: Locale; resultLocale: Locale; browserExcerpt: boolean; outdated: boolean;
}) {
  const t = jobTranslations[locale];
  const [filter, setFilter] = useState<RequirementKind | "ALL">("ALL");
  const groups = kinds.filter(kind => filter === "ALL" || filter === kind);
  return <>
    <div className="requirement-filters" role="group" aria-label={t.results}>
      <Button variant={filter === "ALL" ? "default" : "outline"} aria-pressed={filter === "ALL"} onClick={() => setFilter("ALL")}>{t.allRequirements}<span>{requirements.length}</span></Button>
      {kinds.map(kind => <Button key={kind} variant={filter === kind ? "default" : "outline"} aria-pressed={filter === kind} onClick={() => setFilter(kind)}>{t.kinds[kind]}<span>{requirements.filter(r => r.kind === kind).length}</span></Button>)}
    </div>
    <p className="hint">{t.detailHint}</p>
    {requirements.length === 0 && <p className="empty-filter">{t.empty}</p>}
    {groups.map(kind => {
      const items = requirements.filter(r => r.kind === kind);
      if (!items.length) return filter === kind ? <p key={kind} className="empty-filter">{t.noFilteredRequirements}</p> : null;
      return <section key={kind} className="requirement-group" aria-labelledby={`group-${kind}`}>
        <div className="requirement-group-heading"><h4 id={`group-${kind}`}>{t.kinds[kind]}</h4><span>{items.length}</span></div>
        <ul className="compact-requirements">{items.map((r, i) => <li key={i}><Dialog>
          <DialogTrigger asChild><Button variant="outline" className="requirement-tile" aria-label={`${t.openDetails}: ${r.label}`}>
            <Badge className={`kind-${kind.toLowerCase()}`} variant="secondary">{t.kinds[kind]}</Badge>
            <h5 lang={resultLocale}>{r.label}</h5><span className="tile-action">{t.openDetails}<ArrowUpRight size={14}/></span>
          </Button></DialogTrigger>
          <DialogContent closeLabel={t.closeDetails} className="requirement-dialog">
            <DialogHeader><Badge className={`kind-${kind.toLowerCase()}`} variant="secondary">{t.kinds[kind]}</Badge><DialogTitle lang={resultLocale}>{r.label}</DialogTitle><DialogDescription>{t.review}</DialogDescription></DialogHeader>
            {outdated && <p className="notice">{t.outdated}</p>}
            {browserExcerpt && <p className="notice">{t.browserSource}</p>}
            <div className="detail-section"><h3>{t.originalQuote}</h3><blockquote>{r.quote}</blockquote></div>
            <div className="detail-section"><h3>{t.categoryMeaning}</h3><p>{kind === "REQUIRED" ? t.requiredMeaning : kind === "PREFERRED" ? t.preferredMeaning : t.unclearMeaning}</p></div>
            <div className="detail-section"><h3>{t.context}</h3><p className="quote-context">{sourceContext(source, r)}</p></div>
          </DialogContent>
        </Dialog></li>)}</ul>
      </section>;
    })}
  </>;
}
