import { Building2, ChevronDown, MapPin, UserRound, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { narrativeText, localPracticalFacts } from "../lib/advertisement-text";
import type { JobFact } from "../lib/job-requirements";
import type { Locale } from "../lib/translations";

const copy = {
  nb: {
    title: "Forstå stillingen", company: "Arbeidsgiveren", role: "Om stillingen", applicant: "Hvem de søker", offer: "Dette tilbyr de",
    source: "Arbeidsgiverens egne ord fra mottatt kildeutdrag", metadata: "Praktisk informasjon", location: "Arbeidssted", contact: "Kontaktperson", deadline: "Søknadsfrist",
    missing: "Ikke identifisert i analysen. Se originalannonsen.", missingContact: "Kontaktperson ble ikke identifisert i analysen. Se annonseteksten eller originalannonsen for kontaktopplysninger.",
    quote: "Sitat fra kilden", partial: "Teksten viser kildeutdrag, og kan være ufullstendig. Åpne originalannonsen for hele teksten.",
  },
  en: {
    title: "Understand the role", company: "The employer", role: "About the role", applicant: "Who they are looking for", offer: "What they offer",
    source: "The employer's own words from the received source excerpt", metadata: "Practical information", location: "Location", contact: "Contact person", deadline: "Application deadline",
    missing: "Not identified in the analysis. Check the original advertisement.", missingContact: "A contact person was not identified in the analysis. Check the advertisement text or original page for contact details.",
    quote: "Source quote", partial: "These are source excerpts and may be incomplete. Open the original advertisement for the full text.",
  },
};

export function JobOverview({ facts, locale, sourceLocale, fallbackText, sourceText = "", locallyOrganized = false }: { facts: JobFact[]; locale: Locale; sourceLocale: Locale; fallbackText?: string; sourceText?: string; locallyOrganized?: boolean }) {
  const t = copy[locale];
  const shownFacts = facts.length ? facts : localPracticalFacts(sourceText);
  const group = (kind: JobFact["kind"]) => shownFacts.filter(fact => fact.kind === kind);
  const narrative = (kind: "COMPANY" | "ROLE" | "APPLICANT" | "OFFER") => narrativeText(sourceText, facts, kind);
  const paragraphs = (items: string[]) => items.map((text, index) => <p key={index} className="employer-excerpt" lang={sourceLocale}>{text}</p>);
  const sections = [{ kind: "ROLE", label: t.role }, { kind: "APPLICANT", label: t.applicant }, { kind: "OFFER", label: t.offer }] as const;
  const metadata = [
    { kind: "LOCATION", label: t.location, icon: MapPin },
    { kind: "CONTACT", label: t.contact, icon: UserRound },
    { kind: "DEADLINE", label: t.deadline, icon: CalendarDays },
  ] as const;
  return <section aria-labelledby="overview-title" className="job-overview">
    <h4 id="overview-title">{t.title}</h4>
    {locallyOrganized && <p className="notice">{locale === "nb" ? "Teksten er sortert lokalt etter tydelige overskrifter og felt. Dette er ingen AI-vurdering; uklare detaljer finnes i hele annonseteksten." : "Text is organized locally using explicit headings and fields. This is not an AI assessment; uncertain details remain in the full advertisement text."}</p>}
    <div className="employer-overview-grid">
      <Card className="employer-card">
        <CardHeader><div className="overview-card-heading"><Building2 size={18} aria-hidden="true"/><h5>{t.company}</h5></div><p className="hint">{t.source}</p></CardHeader>
        <CardContent>{narrative("COMPANY").length ? paragraphs(narrative("COMPANY")) : <p className="hint">{t.missing}</p>}</CardContent>
      </Card>
      <div className="employer-sections">
        {sections.filter(section => section.kind === "ROLE" || narrative(section.kind).length).map(section => <Card key={section.kind} className="employer-section">
          <details open={section.kind === "ROLE"}>
            <summary><span>{section.label}</span><ChevronDown size={18} aria-hidden="true"/></summary>
            <CardContent>{narrative(section.kind).length ? paragraphs(narrative(section.kind)) : section.kind === "ROLE" && fallbackText ? <p className="employer-excerpt fallback-advertisement" lang={sourceLocale}>{fallbackText}</p> : <p className="hint">{t.missing}</p>}</CardContent>
          </details>
        </Card>)}
      </div>
    </div>
    <p className="hint overview-source-note">{t.partial}</p>
    {sourceText && <Card className="advertisement-reader"><details><summary><span>{locale === "nb" ? "Les hele teksten vi har mottatt" : "Read all the text we received"}</span><span className="hint">{sourceText.length.toLocaleString(locale === "nb" ? "nb-NO" : "en-US")} {locale === "nb" ? "tegn" : "characters"}</span><ChevronDown size={18} aria-hidden="true"/></summary><CardContent><p className="hint">{locale === "nb" ? "Her finner du også detaljer AI-analysen kan ha utelatt. Dette er all mottatt tekst; kilden kan fortsatt være et delvis utdrag." : "This also includes details the AI analysis may have omitted. This is all received text; the source may still be a partial excerpt."}</p><div className="received-advertisement" lang={sourceLocale}>{sourceText.split(/\r?\n/).map((line, index) => /^\s*#{1,6}\s+/.test(line) ? <h6 key={index}>{line.replace(/^\s*#{1,6}\s+/, "")}</h6> : <div key={index}>{line || "\u00a0"}</div>)}</div></CardContent></details></Card>}
    <section aria-label={t.metadata} className="job-facts">
      {metadata.map(({ kind, label, icon: Icon }) => <Card key={kind}><CardContent>
        <div className="overview-card-heading"><Icon size={16} aria-hidden="true"/><h5>{label}</h5></div>
        {group(kind).length ? group(kind).map((fact, index) => <div key={index} className="metadata-entry">
          {kind === "CONTACT" ? <p className="fact-value" lang={sourceLocale}>{fact.quote}</p> : <><p className="fact-value">{fact.value}</p><details><summary>{t.quote}</summary><blockquote lang={sourceLocale}>{fact.quote}</blockquote></details></>}
        </div>) : <p className="hint metadata-entry">{kind === "CONTACT" ? t.missingContact : t.missing}</p>}
      </CardContent></Card>)}
      {group("OTHER").map((fact, index) => <Card key={`other-${index}`}><CardContent>
        <h5 className="fact-label">{fact.label}</h5><p className="fact-value">{fact.value}</p><details><summary>{t.quote}</summary><blockquote lang={sourceLocale}>{fact.quote}</blockquote></details>
      </CardContent></Card>)}
    </section>
  </section>;
}
