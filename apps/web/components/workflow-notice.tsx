import { Info, FileText } from "lucide-react";
import type { Locale } from "../lib/translations";
import { Button } from "./ui/button";

/** User recovery guidance; technical codes remain in the opt-in diagnostics. */
export function WorkflowNotice({ code, locale, area = "advertisement", retained = false, previous = false, onPaste }: {
 code: string; locale: Locale; area?: "advertisement" | "documents" | "matching"; retained?: boolean; previous?: boolean; onPaste?: () => void;
}) {
 const nb = locale === "nb"; const rate = ["AI_RATE_LIMITED", "SOURCE_RATE_LIMITED"].includes(code);
 const configuration = ["AI_NOT_CONFIGURED", "AI_ACCESS_DENIED", "SOURCE_NOT_CONFIGURED", "SOURCE_AI_NOT_CONFIGURED"].includes(code);
 const changed=code==="AI_APPROVAL_CHANGED";
 const limit = ["AI_BUDGET_REACHED", "SOURCE_BUDGET_REACHED"].includes(code);
 let title: string; let text: string;
 if (area === "advertisement" && retained) {
  title = previous ? (nb ? "Den tidligere analysen er beholdt" : "Your previous analysis is retained") : (nb ? "Annonsen er klar til å lese" : "The advertisement is ready to read");
  text = rate ? (nb ? "Automatisk sortering venter på tilgjengelig AI-kvote. Les teksten nedenfor mens vi venter; prøv sorteringen igjen når ventetiden er over." : "Automatic structuring is waiting for available AI quota. Read the text below while waiting; try structuring again after the pause.") : configuration ? (nb ? "Automatisk sortering er ikke tilgjengelig i dette oppsettet. Du kan lese og lagre annonseteksten nedenfor." : "Automatic structuring is not available in this setup. You can read and save the advertisement text below.") : limit ? (nb ? "Grensen for automatisk sortering i denne pilotøkten er nådd. Annonseteksten er fortsatt tilgjengelig nedenfor." : "This pilot session has reached its automatic structuring limit. The advertisement text remains available below.") : (nb ? "Noen opplysninger er ikke sortert automatisk. Vi viser teksten vi har, uten å gjette. Du kan lagre annonsen eller prøve sorteringen igjen." : "Some details have not been structured automatically. We show the text we have without guessing. Save the advertisement or try structuring again.");
 } else if (area === "advertisement") {
  title = rate ? (nb ? "Innhenting venter på tilgjengelig AI-kvote" : "Retrieval is waiting for available AI quota") : (nb ? "La oss bruke annonseteksten" : "Let’s use the advertisement text");
  text = rate ? (nb ? "Vi har ikke mottatt annonseteksten ennå. Prøv lenken etter ventetiden, eller lim inn teksten fra annonsen." : "We have not received the advertisement text yet. Try the link after the pause or paste the advertisement text.") : (nb ? "Vi har ikke fått et lesbart utdrag fra denne lenken. Åpne originalannonsen, kopier teksten og lim den inn her. Lenken er beholdt." : "We have not received a readable excerpt from this link. Open the original advertisement, copy its text and paste it here. Your link is retained.");
 } else {
  title = previous ? (nb ? "Den tidligere vurderingen er beholdt" : "Your previous assessment is retained") : (nb ? "Grunnlaget ditt er beholdt" : "Your source information is retained");
  const source = area === "documents" ? (nb ? "Dokumentene og teksten er tilgjengelige. " : "Your documents and text remain available. ") : (nb ? "Annonsen og kompetansen er tilgjengelige. " : "The advertisement and competencies remain available. ");
  text = source + (changed ? (nb?"AI-mottakeren eller modellen er endret. Hent oppsettet på nytt og godkjenn en ny analyse. Ingen data er sendt med den gamle godkjenningen.":"The AI recipient or model changed. Refresh the configuration and approve a new analysis. No data was sent using the old approval.") : rate ? (nb ? "AI-kvoten er nådd. Følg ventetiden nedenfor; et nytt forsøk kan fortsatt kreve mer kvote." : "The AI quota has been reached. Follow the waiting period below; another attempt may still need more quota.") : configuration ? (nb ? "AI er ikke tilgjengelig i dette oppsettet. Du kan fortsatt lese, redigere og bekrefte egne opplysninger." : "AI is not available in this setup. You can still read, edit and confirm your own information.") : limit ? (nb ? "Pilotøkten har nådd grensen for AI-analyser. Ingen opplysninger er endret." : "This pilot session has reached its AI analysis limit. Your information has not been changed.") : (nb ? "Vi fikk ikke en ny vurdering vi kan bruke. Ingen nye opplysninger er bekreftet. Du kan gjennomgå grunnlaget eller prøve igjen." : "We did not receive a new assessment we can use. No new information has been confirmed. Review the source information or try again."));
 }
 return <div className="workflow-notice" role="status"><Info size={19} aria-hidden="true"/><div><h4>{title}</h4><p>{text}</p>{onPaste && <Button variant="outline" size="sm" onClick={onPaste}><FileText size={15}/>{nb ? "Lim inn annonsetekst" : "Paste advertisement text"}</Button>}</div></div>;
}
