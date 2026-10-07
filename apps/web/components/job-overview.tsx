import { Building2, ChevronDown, MapPin, UserRound, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
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

export function JobOverview({ facts, locale, sourceLocale, fallbackText }: { facts: JobFact[]; locale: Locale; sourceLocale: Locale; fallbackText?: string }) {
  const t = copy[locale];
  const group = (kind: JobFact["kind"]) => facts.filter(fact => fact.kind === kind);
  const paragraphs = (items: JobFact[]) => items.map((fact, index) => <p key={index} className="employer-excerpt" lang={sourceLocale}>{fact.quote}</p>);
  const sections = [{ kind: "ROLE", label: t.role }, { kind: "APPLICANT", label: t.applicant }, { kind: "OFFER", label: t.offer }] as const;
  const metadata = [
    { kind: "LOCATION", label: t.location, icon: MapPin },
    { kind: "CONTACT", label: t.contact, icon: UserRound },
    { kind: "DEADLINE", label: t.deadline, icon: CalendarDays },
  ] as const;
  return <section aria-labelledby="overview-title" className="job-overview">
    <h4 id="overview-title">{t.title}</h4>
    <div className="employer-overview-grid">
      <Card className="employer-card">
        <CardHeader><div className="overview-card-heading"><Building2 size={18} aria-hidden="true"/><h5>{t.company}</h5></div><p className="hint">{t.source}</p></CardHeader>
        <CardContent>{group("COMPANY").length ? paragraphs(group("COMPANY")) : <p className="hint">{t.missing}</p>}</CardContent>
      </Card>
      <div className="employer-sections">
        {sections.filter(section => section.kind === "ROLE" || group(section.kind).length).map(section => <Card key={section.kind} className="employer-section">
          <details open={section.kind === "ROLE"}>
            <summary><span>{section.label}</span><ChevronDown size={18} aria-hidden="true"/></summary>
            <CardContent>{group(section.kind).length ? paragraphs(group(section.kind)) : section.kind === "ROLE" && fallbackText ? <p className="employer-excerpt fallback-advertisement" lang={sourceLocale}>{fallbackText}</p> : <p className="hint">{t.missing}</p>}</CardContent>
          </details>
        </Card>)}
      </div>
    </div>
    <p className="hint overview-source-note">{t.partial}</p>
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
