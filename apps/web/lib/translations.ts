export type Locale = "nb" | "en";

export const translations = {
  nb: {
    language: "Språk",
    stage: "Første utviklingsversjon",
    title: "Din erfaring. Dine muligheter.",
    introduction: "Career Agent skal hjelpe deg å forstå stillinger, synliggjøre faktisk erfaring og holde oversikt over søknadene dine.",
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
    title: "Your experience. Your opportunities.",
    introduction: "Career Agent will help you understand jobs, highlight real experience and keep track of your applications.",
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
