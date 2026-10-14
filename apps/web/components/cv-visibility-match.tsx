import type { PersonalMatch } from "../lib/personal-match";
import type { Locale } from "../lib/translations";
import { Badge } from "./ui/badge";

/** The latest assessment may only accompany wording generated from that exact match. */
export function CvVisibilityMatch({ match, matchId, requirementIndex, locale }: {
  match?: PersonalMatch | null; matchId: string; requirementIndex: number; locale: Locale;
}) {
  const nb = locale === "nb";
  const assessment = match?.id === matchId
    ? match.assessments.find(item => item.requirementIndex === requirementIndex)
    : undefined;
  if (!assessment) return <p className="cv-visibility-match text-xs text-muted-foreground">
    {nb ? "Den tilhørende matchvurderingen er ikke tilgjengelig her. En nyere match er ikke koblet til denne CV-gjennomgangen."
      : "The associated match assessment is unavailable here. A newer match is not attached to this CV review."}
  </p>;
  const label = assessment.evaluated === false ? (nb ? "Ikke vurdert" : "Not assessed")
    : { STRONG: nb ? "Dokumentert relevant" : "Documented relevance",
      PARTIAL: nb ? "Delvis relevant" : "Partial relevance",
      CLARIFY: nb ? "Må avklares" : "Needs clarification" }[assessment.classification];
  return <div className="cv-visibility-match mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3 text-sm"
    role="group" aria-label={nb ? "Matchgrunnlag for dette kravet" : "Match evidence for this criterion"}>
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium">{nb ? "Relevans for kravet" : "Relevance to the criterion"}</span>
      <Badge variant="outline">{label}</Badge>
      {assessment.evidenceRelation === "TRANSFERABLE" && <Badge variant="secondary">{nb ? "Overførbar erfaring" : "Transferable experience"}</Badge>}
      {match?.stale && <Badge variant="outline">{nb ? "Tidligere match" : "Earlier match"}</Badge>}
    </div>
    <p>{assessment.reason}</p>
    {assessment.classification !== "STRONG" && <p className="text-xs text-muted-foreground">
      {nb ? "Erfaringen kan være tydelig i CV-en selv om den bare dekker deler av kravet. Behold begrensningene i teksten."
        : "Experience can be clear in the CV while covering only part of the criterion. Keep its limitations in the wording."}
    </p>}
  </div>;
}
