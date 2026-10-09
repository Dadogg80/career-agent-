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

// Source-neutral literal fields. No inferred names, dates or person/contact associations.
export function localPracticalFacts(source: string): JobFact[] {
  const fields: { kind: JobFact["kind"]; pattern: RegExp }[] = [
    { kind: "CONTACT", pattern: /^(kontaktperson(?:er)?|kontakt|spørsmål om stillingen|contact(?: person| details)?|enquiries)/i },
    { kind: "CONTACT", pattern: /^(e-?post|e-?mail|telefon|tlf\.?|phone|telephone|mobile)/i },
    { kind: "LOCATION", pattern: /^(arbeidssted|sted|lokasjon|location|work location)/i },
    { kind: "DEADLINE", pattern: /^(søknadsfrist|application deadline|closing date|deadline)/i },
    { kind: "OTHER", pattern: /^(ansettelsesform|stillingstype|stillingsprosent|employment type|contract type|salary|lønn)/i },
  ];
  const lines = source.split(/\r?\n/);
  const facts: JobFact[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    const text = raw.replace(/^[-*]\s+/, "").replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "").trim();
    const field = fields.map(field => ({ ...field, match: field.pattern.exec(text) })).find(field => {
      if (!field.match) return false;
      const rest = text.slice(field.match[0].length);
      return !rest || /^\s*[:：]\s*/.test(rest);
    });
    if (!field?.match) continue;
    const title = field.match[0];
    const inline = text.slice(title.length).replace(/^\s*[:：]\s*/, "").trim();
    let value = inline; let quote = raw;
    if (!value) {
      // A standalone label can govern the next nonempty line, but never another label.
      let next = i + 1;
      while (next < lines.length && !lines[next].trim()) next++;
      const candidate = lines[next]?.trim();
      if (candidate && !fields.some(f => f.pattern.test(candidate)) && !isHeading(candidate)) {
        value = candidate; quote = lines.slice(i, next + 1).join("\n").trim();
      }
    }
    if (value && value.length <= 500 && quote.length <= 1000) facts.push({ kind: field.kind, label: title, value, quote });
  }
  // An explicit email address is useful even without a labelled contact block.
  for (const line of lines) {
    const phones = line.match(/(?:\+47[ -]?(?:\d[ -]?){7}\d|\+[1-9]\d{7,14})(?!\d)/g) ?? [];
    for (const phone of phones) {
      if (line.trim().length <= 1000 && !facts.some(f => f.kind === "CONTACT" && f.value.includes(phone))) {
        facts.push({ kind: "CONTACT", label: "Telefon / Phone", value: phone, quote: line.trim() });
      }
    }
    const addresses = line.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}/gi) ?? [];
    for (const address of addresses) {
      if (line.trim().length <= 1000 && !facts.some(f => f.kind === "CONTACT" && f.value.includes(address))) {
        facts.push({ kind: "CONTACT", label: "E-post / Email", value: address, quote: line.trim() });
      }
    }
  }
  return facts.filter((fact, i) => facts.findIndex(other => other.kind === fact.kind && other.value === fact.value) === i);
}

/** Keep all literal contact endpoints even when an AI fact only supplies a person's name. */
export function practicalOverviewFacts(source: string, facts: JobFact[]): JobFact[] {
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
  const merged = [...facts];
  for (const local of localPracticalFacts(source)) {
    const found = merged.findIndex(f => f.kind === local.kind && normalize(f.quote) === normalize(local.quote));
    if (found >= 0) {
      // Keep manual corrections; otherwise restore the complete literal labelled value.
      if (!/^(Manuelt fra annonsen|Manually added from advertisement)(?::|$)/.test(merged[found].label)) merged[found] = local;
    } else if (!merged.some(f => f.kind === local.kind && normalize(f.value).includes(normalize(local.value)))) merged.push(local);
  }
  // Do not silently drop reviewed/manual facts to meet the saved snapshot limit.
  return merged;
}
