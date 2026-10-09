import { BriefcaseBusiness, Building2, CalendarDays, ChevronDown, Gift, MapPin, UserRound, UsersRound } from "lucide-react";
import type { Ref } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { narrativeText, localPracticalFacts } from "../lib/advertisement-text";
import type { JobFact } from "../lib/job-requirements";
import type { Locale } from "../lib/translations";

const copy = {
  nb: {
    title: "Forstå stillingen",
    introduction: "Start med arbeidsgiveren, rollen og det praktiske før du vurderer kravene.",
    company: "Arbeidsgiveren",
    role: "Om stillingen",
    applicant: "Hvem de søker",
    offer: "Dette tilbyr de",
    source: "Fra arbeidsgiverens egne ord",
    practical: "Praktisk informasjon",
    location: "Arbeidssted",
    contact: "Kontaktperson",
    deadline: "Søknadsfrist",
    missing: "Ikke identifisert i analysen. Se originalannonsen.",
    missingContact: "Ikke identifisert i analysen. Se annonseteksten eller originalannonsen.",
    quote: "Sitat fra kilden",
    manualOrigin: "Manuelt fra annonsen",
    manualAdded: "Manuelt lagt til",
    readMore: "Se hele kildeutdraget",
    partial: "Kildeutdrag kan være ufullstendige. Åpne originalannonsen for hele teksten.",
    sourceText: "Les hele teksten vi har mottatt",
    sourceTextHelp: "Her finner du også detaljer analysen kan ha utelatt. Kilden kan fortsatt være et delvis utdrag.",
    locallyOrganized: "Teksten er sortert lokalt etter tydelige overskrifter og felt. Dette er ingen AI-vurdering; uklare detaljer finnes i hele annonseteksten.",
  },
  en: {
    title: "Understand the role",
    introduction: "Start with the employer, role and practical details before reviewing requirements.",
    company: "The employer",
    role: "About the role",
    applicant: "Who they are looking for",
    offer: "What they offer",
    source: "From the employer's own words",
    practical: "Practical information",
    location: "Location",
    contact: "Contact person",
    deadline: "Application deadline",
    missing: "Not identified in the analysis. Check the original advertisement.",
    missingContact: "Not identified in the analysis. Check the advertisement text or original page.",
    quote: "Source quote",
    manualOrigin: "Manually added from advertisement",
    manualAdded: "Added manually",
    readMore: "Read the full source excerpt",
    partial: "Source excerpts may be incomplete. Open the original advertisement for the full text.",
    sourceText: "Read all the text we received",
    sourceTextHelp: "This also includes details the analysis may have omitted. The source may still be a partial excerpt.",
    locallyOrganized: "Text is organized locally using explicit headings and fields. This is not an AI assessment; uncertain details remain in the full advertisement text.",
  },
};

type NarrativeKind = "COMPANY" | "ROLE" | "APPLICANT" | "OFFER";

export function JobOverview({ facts, locale, sourceLocale, fallbackText, sourceText = "", locallyOrganized = false, sourceReaderRef }: { facts: JobFact[]; locale: Locale; sourceLocale: Locale; fallbackText?: string; sourceText?: string; locallyOrganized?: boolean; sourceReaderRef?: Ref<HTMLDetailsElement> }) {
  const t = copy[locale];
  const localFacts = localPracticalFacts(sourceText);
  const group = (kind: JobFact["kind"]) => {
    const extracted = facts.filter(fact => fact.kind === kind);
    return extracted.length ? extracted : localFacts.filter(fact => fact.kind === kind);
  };
  const narratives = {
    COMPANY: narrativeText(sourceText, facts, "COMPANY"),
    ROLE: narrativeText(sourceText, facts, "ROLE"),
    APPLICANT: narrativeText(sourceText, facts, "APPLICANT"),
    OFFER: narrativeText(sourceText, facts, "OFFER"),
  };
  const paragraphs = (items: string[]) => items.map((text, index) => <p key={index} className="employer-excerpt" lang={sourceLocale}>{text}</p>);
  const narrativeCards = [
    { kind: "COMPANY", label: t.company, icon: Building2 },
    { kind: "ROLE", label: t.role, icon: BriefcaseBusiness },
    { kind: "APPLICANT", label: t.applicant, icon: UsersRound },
    { kind: "OFFER", label: t.offer, icon: Gift },
  ] as const;
  const metadata = [
    { kind: "LOCATION", label: t.location, icon: MapPin },
    { kind: "CONTACT", label: t.contact, icon: UserRound },
    { kind: "DEADLINE", label: t.deadline, icon: CalendarDays },
  ] as const;

  return <section aria-labelledby="overview-title" className="job-overview">
    <header className="job-overview-heading">
      <span className="job-overview-heading-icon"><BriefcaseBusiness aria-hidden="true"/></span>
      <div><p>{locale === "nb" ? "FØR DU VURDERER KRAVENE" : "BEFORE REVIEWING REQUIREMENTS"}</p><h4 id="overview-title">{t.title}</h4><span>{t.introduction}</span></div>
    </header>
    {locallyOrganized && <p className="notice">{t.locallyOrganized}</p>}
    <div className="job-overview-narratives">
      {narrativeCards.map(({ kind, label, icon: Icon }) => {
        const items = narratives[kind].length ? narratives[kind] : kind === "ROLE" && fallbackText ? [fallbackText] : [];
        return <Card key={kind} className={`job-overview-card job-overview-${kind.toLowerCase()} ${kind === "COMPANY" ? "employer-card" : ""}`}>
          <CardHeader>
            <div className="job-overview-card-heading">
              <span className="job-overview-card-icon"><Icon aria-hidden="true"/></span>
              <h5>{label}</h5>
            </div>
            {kind === "ROLE" && fallbackText ? <div className="fallback-advertisement" lang={sourceLocale}>{fallbackText}</div> : items.length ? <p className="job-overview-preview" lang={sourceLocale}>{items[0]}</p> : <p className="job-overview-preview job-overview-missing">{t.missing}</p>}
            {items.length > 0 && !(kind === "ROLE" && fallbackText) && <details className="job-overview-source-detail">
              <summary>{t.readMore}<ChevronDown aria-hidden="true"/></summary>
              <CardContent><div className="advertisement-section-reader" role="region" aria-label={`${label} — ${t.source}`} tabIndex={0}>{paragraphs(items)}</div></CardContent>
            </details>}
          </CardHeader>
        </Card>;
      })}
    </div>
    <section aria-label={t.practical} className="job-overview-practical">
      <header><span className="job-overview-practical-icon"><MapPin aria-hidden="true"/></span><div><h5>{t.practical}</h5><p>{locale === "nb" ? "Fakta og kontaktpunkter fra annonsen" : "Facts and contact details from the advertisement"}</p></div></header>
      <div className="job-facts">
        {metadata.map(({ kind, label, icon: Icon }) => <Card key={kind} className={`job-fact-card job-fact-${kind.toLowerCase()}`}><CardContent>
          <div className="overview-card-heading"><Icon size={16} aria-hidden="true"/><h5>{label}</h5></div>
          {group(kind).length ? group(kind).map((fact, index) => <div key={index} className="metadata-entry">
            {fact.label.startsWith(t.manualOrigin) && <span className="job-fact-manual-badge">{t.manualAdded}</span>}
            <p className="fact-value" lang={sourceLocale}>{fact.value}</p>
            <details><summary>{t.quote}</summary><blockquote lang={sourceLocale}>{fact.quote}</blockquote></details>
          </div>) : <p className="hint metadata-entry">{kind === "CONTACT" ? t.missingContact : t.missing}</p>}
        </CardContent></Card>)}
        {group("OTHER").map((fact, index) => <Card key={`other-${index}`} className="job-fact-card"><CardContent>
          <h5 className="fact-label">{fact.label.replace(`${t.manualOrigin}: `, "")}</h5>{fact.label.startsWith(t.manualOrigin) && <span className="job-fact-manual-badge">{t.manualAdded}</span>}<p className="fact-value">{fact.value}</p><details><summary>{t.quote}</summary><blockquote lang={sourceLocale}>{fact.quote}</blockquote></details>
        </CardContent></Card>)}
      </div>
    </section>
    <p className="hint overview-source-note">{t.partial}</p>
    {sourceText && <Card className="advertisement-reader"><details id="received-advertisement" ref={sourceReaderRef}><summary><span>{t.sourceText}</span><span className="hint">{sourceText.length.toLocaleString(locale === "nb" ? "nb-NO" : "en-US")} {locale === "nb" ? "tegn" : "characters"}</span><ChevronDown size={18} aria-hidden="true"/></summary><CardContent><p className="hint">{t.sourceTextHelp}</p><div className="received-advertisement" lang={sourceLocale}>{sourceText.split(/\r?\n/).map((line, index) => /^\s*#{1,6}\s+/.test(line) ? <h6 key={index}>{line.replace(/^\s*#{1,6}\s+/, "")}</h6> : <div key={index}>{line || "\u00a0"}</div>)}</div></CardContent></details></Card>}
  </section>;
}
