export type Locale = "nb" | "en";

export const translations = {
  nb: {
    language: "Språk",
    stage: "Første utviklingsversjon",
    title: "Forstå din neste mulighet.",
    introduction: "Få en ryddig oversikt over stillingen før du bestemmer deg for å søke. Ett krav om gangen, med kilden synlig.",
    nextTitle: "Vi bygger grunnlaget",
    nextDescription: "Du kan prøve annonseanalysen nå. Kandidatprofil, matching og søknadsmateriale kommer i senere steg.",
    connection: "Tilkobling til tjenesten",
    loading: "Kontrollerer tilkoblingen …",
    online: "Tjenesten er tilgjengelig",
    offline: "Tjenesten er ikke tilgjengelig akkurat nå",
    retry: "Prøv igjen",
    principle: "Erfaring skal aldri oppdiktes. Du skal kunne se grunnlaget og godkjenne innholdet.",
  },
  en: {
    language: "Language",
    stage: "First development version",
    title: "Understand your next opportunity.",
    introduction: "Get a clear view of the role before deciding to apply. One requirement at a time, with the source in view.",
    nextTitle: "Building the foundation",
    nextDescription: "You can try advertisement analysis now. Candidate profiles, matching and application material are coming next.",
    connection: "Service connection",
    loading: "Checking the connection …",
    online: "The service is available",
    offline: "The service is currently unavailable",
    retry: "Try again",
    principle: "Experience must never be invented. You should be able to inspect the evidence and approve the content.",
  },
} satisfies Record<Locale, Record<string, string>>;
