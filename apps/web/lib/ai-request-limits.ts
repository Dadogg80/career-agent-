export function aiRequestLimitMessage(locale: "nb" | "en"): string {
  return locale === "nb"
    ? "AI-leverandøren avviste størrelsen på dette kallet. Grunnlaget og tidligere resultater er beholdt. Velg en annen tilgjengelig modell og godkjenn en ny analyse."
    : "The AI provider rejected the size of this request. Your evidence and previous results are retained. Select another available model and approve a new analysis.";
}
