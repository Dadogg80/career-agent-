import type { JobFact } from "./job-requirements";

type NarrativeKind = "COMPANY" | "ROLE" | "APPLICANT" | "OFFER";
const headings: Record<NarrativeKind, RegExp> = {
  COMPANY: /^(om oss|om (arbeidsgiveren|bedriften|selskapet)|arbeidsgiveren|about us|about (the company|the employer)|who we are)$/i,
  ROLE: /^(om stillingen|om rollen|arbeidsoppgaver|dine (arbeidsoppgaver|ansvarsområder)|ansvarsområder|hva du skal gjøre|about (the role|the position)|responsibilities|your responsibilities|what you.ll do)$/i,
  APPLICANT: /^(hvem (vi|de) søker|hvem er du|vi søker deg som|kvalifikasjoner|ønskede kvalifikasjoner|personlige egenskaper|requirements|qualifications|who (you are|we.re looking for)|about you)$/i,
  OFFER: /^(vi tilbyr|dette tilbyr (vi|de)|hva (vi|de) tilbyr|hva kan vi tilby|what we offer|we offer|benefits|what.s in it for you)$/i,
};
const label = (line: string) => line.trim().replace(/^#{1,6}\s+/, "").replace(/^\*\*(.*?)\*\*$/, "$1").replace(/:$/, "").trim();
const kind = (line: string) => (Object.keys(headings) as NarrativeKind[]).find(key => headings[key].test(label(line)));
const isHeading = (line: string) => Boolean(kind(line)) || /^\s*#{1,6}\s+/.test(line) || /^\s*\*\*[^*\n]{1,100}\*\*\s*$/.test(line);

// Expand only literal received text. Explicit source headings take precedence over AI excerpts.
export function narrativeText(source: string, facts: JobFact[], target: NarrativeKind): string[] {
  const sections: string[] = []; let active: NarrativeKind | undefined; let buffer: string[] = [];
  const flush = () => { const text = buffer.join("\n").trim(); if (active === target && text) sections.push(text); buffer = []; };
  for (const line of source.split(/\r?\n/)) {
    if (isHeading(line)) { flush(); active = kind(line); }
    else buffer.push(line);
  }
  flush();
  if (sections.length) return sections;
  const paragraphs = source.split(/\r?\n\s*\r?\n/).map(value => value.trim()).filter(Boolean);
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
  const anchors = facts.filter(fact => ["COMPANY", "ROLE", "APPLICANT", "OFFER"].includes(fact.kind));
  return [...new Set(facts.filter(fact => fact.kind === target).map(fact => {
    const quote = normalize(fact.quote);
    const paragraph = paragraphs.find(value => normalize(value).includes(quote));
    // Do not expand one mixed paragraph into every box.
    if (!paragraph || anchors.some(other => other.kind !== target && normalize(paragraph).includes(normalize(other.quote)))) return fact.quote;
    return paragraph;
  }))];
}

// Literal labelled fields only; no guessed dates, names, locations or requirement categories.
export function localPracticalFacts(source: string): JobFact[] {
  const fields: {kind: JobFact["kind"]; pattern: RegExp}[] = [
    {kind:"CONTACT",pattern:/^(?:kontaktperson(?:er)?|kontakt|contact(?: person)?|contact details)\s*:\s*(.+)$/i},
    {kind:"LOCATION",pattern:/^(?:arbeidssted|sted|lokasjon|location|work location)\s*:\s*(.+)$/i},
    {kind:"DEADLINE",pattern:/^(?:søknadsfrist|frist|application deadline|deadline)\s*:\s*(.+)$/i},
  ];
  return source.split(/\r?\n/).flatMap(line=>{
    const text=line.replace(/^\s*[-*]\s+/,"").trim();
    const match=fields.map(field=>({kind:field.kind,match:field.pattern.exec(text)})).find(field=>field.match);
    return match && text.length<=1000 && match.match![1].length<=500 ? [{kind:match.kind,label:text.slice(0,text.indexOf(":")),value:match.match![1],quote:text}] : [];
  }).slice(0,10);
}
