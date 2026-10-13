export const documentOmissionReasons = ["INVALID_STRUCTURE", "INVALID_FIELDS", "EVIDENCE_LIMIT", "INVALID_EVIDENCE_IDS", "UNSUPPORTED_QUOTE", "QUOTE_LIMIT", "UNSUPPORTED_SKILL", "UNSUPPORTED_TITLE", "UNSUPPORTED_ORGANIZATION", "UNSUPPORTED_CLIENT", "UNSUPPORTED_ROLE", "UNSUPPORTED_PERIOD", "INVALID_PERIOD", "SOURCE_MISMATCH", "RESULT_LIMIT"] as const;
export const documentResultSections = ["COMPETENCY", "PROFILE", "HISTORY", "RESULT"] as const;
export type DocumentOmission = { section: typeof documentResultSections[number]; reason: typeof documentOmissionReasons[number]; count: number };
export function isDocumentOmissions(value: unknown): value is DocumentOmission[] {
  if (!Array.isArray(value) || value.length > 60) return false;
  const seen = new Set<string>();
  return value.every(item => {
    if (!item || typeof item !== "object" || Object.keys(item).sort().join(",") !== "count,reason,section" || !documentResultSections.includes(item.section) || !documentOmissionReasons.includes(item.reason) || !Number.isSafeInteger(item.count) || item.count < 1 || item.count > 200) return false;
    const key = `${item.section}:${item.reason}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
export const omissionLabels = {
  nb: {
    sections: { COMPETENCY: "Kompetanse", PROFILE: "Profiltekst", HISTORY: "Historikk", RESULT: "Resultat" },
    reasons: {
      INVALID_STRUCTURE: "AI-svaret hadde feil format. Bare lokalt gjenkjente kompetanseopplysninger kunne beholdes.",
      INVALID_FIELDS: "Ett eller flere felt manglet, hadde feil format eller var for lange.",
      EVIDENCE_LIMIT: "Forslaget hadde for få eller for mange kildehenvisninger.",
      INVALID_EVIDENCE_IDS: "Kildehenvisningene var ugyldige eller gjentatt.",
      UNSUPPORTED_QUOTE: "Det valgte utdraget kunne ikke gjenfinnes i den godkjente teksten.",
      QUOTE_LIMIT: "Kildeutdraget var for langt til å registrere forslaget.",
      UNSUPPORTED_SKILL: "Kompetansenavnet fantes ikke ordrett i det valgte kildeutdraget.",
      UNSUPPORTED_TITLE: "Rolle- eller prosjektnavnet fantes ikke i det valgte kildeutdraget.",
      UNSUPPORTED_ORGANIZATION: "Virksomhetsnavnet fantes ikke i det valgte kildeutdraget.",
      UNSUPPORTED_CLIENT: "Kundenavnet fantes ikke i det valgte kildeutdraget.",
      UNSUPPORTED_ROLE: "Leveranserollen fantes ikke i det valgte kildeutdraget.",
      UNSUPPORTED_PERIOD: "Perioden fantes ikke i det valgte kildeutdraget.",
      INVALID_PERIOD: "Sluttperioden var før startperioden.",
      SOURCE_MISMATCH: "Utdraget fra analysen samsvarte ikke med den lagrede dokumentteksten.",
      RESULT_LIMIT: "Analysen nådde grensen for antall lagrede forslag."
    }
  },
  en: {
    sections: { COMPETENCY: "Competencies", PROFILE: "Profile summary", HISTORY: "Career history", RESULT: "Analysis result" },
    reasons: {
      INVALID_STRUCTURE: "The AI response had an invalid format. Only locally recognized competency statements could be retained.",
      INVALID_FIELDS: "One or more fields were missing, invalid or too long.",
      EVIDENCE_LIMIT: "The proposal had too few or too many source references.",
      INVALID_EVIDENCE_IDS: "Source references were invalid or repeated.",
      UNSUPPORTED_QUOTE: "The selected excerpt could not be found in the approved text.",
      QUOTE_LIMIT: "The source excerpt was too long to register the proposal.",
      UNSUPPORTED_SKILL: "The competency label did not appear literally in its selected source excerpt.",
      UNSUPPORTED_TITLE: "The role or project name did not appear in its selected source excerpt.",
      UNSUPPORTED_ORGANIZATION: "The organization name did not appear in its selected source excerpt.",
      UNSUPPORTED_CLIENT: "The client name did not appear in its selected source excerpt.",
      UNSUPPORTED_ROLE: "The delivery role did not appear in its selected source excerpt.",
      UNSUPPORTED_PERIOD: "The period did not appear in its selected source excerpt.",
      INVALID_PERIOD: "The end period preceded the start period.",
      SOURCE_MISMATCH: "The analysis excerpt did not match the saved document text.",
      RESULT_LIMIT: "The analysis reached the saved proposal limit."
    }
  }
};
