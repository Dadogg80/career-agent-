"use client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, LoaderCircle, Clock3, CircleCheck, Info } from "lucide-react";
import { isPersonalMatch, type PersonalMatch } from "../lib/personal-match";
import { matchInsights } from "../lib/match-insights";
import { matchCoverage } from "../lib/match-planning";
import type { SavedJob } from "../lib/saved-jobs";
import type { Locale } from "../lib/translations";
import { AiIdentity } from "./ai-identity";
import { HelpTip } from "./ui/help-tip";

/** Reads a saved assessment only; showing a card never initiates an AI request. */
export function JobMatchBadge({job,locale}:{job:SavedJob;locale:Locale}) {
 const nb=locale==="nb";
 const match=useQuery({queryKey:["private-job-match",job.id],gcTime:0,retry:false,staleTime:10000,queryFn:async()=>{
  const response=await fetch(`/api/profile/me/jobs/${job.id}/match`,{cache:"no-store"});
  const value:unknown=await response.json();
  if(!response.ok || value!==null && !isPersonalMatch(value))throw new Error("MATCH_UNAVAILABLE");
  return value as PersonalMatch|null;
 }});
 const coverage=match.data?matchCoverage(match.data,job.content):null;
 const stale=!!match.data?.stale, provisional=!!coverage && coverage.pending>0;
 return <div className="saved-job-match" data-match-state={match.isPending?"loading":match.isError?"unavailable":stale?"stale":coverage?provisional?"partial":"assessed":"none"} aria-live="polite">
  <div className="saved-job-match-heading"><span><Sparkles size={14}/>{nb?"Personlig match":"Personal match"}</span><HelpTip label={nb?"Om matchprosenten":"About the match score"}>{nb?"Prosenten viser vektet dekning av lagrede stillingskrav, basert på dokumentert erfaring. Den er ikke en sannsynlighet for ansettelse. Profilendringer krever ny vurdering.":"The score shows weighted coverage of saved requirements using documented experience. It is not a probability of employment. Profile changes require reassessment."}</HelpTip></div>
  {match.isPending?<span className="saved-job-match-detail"><LoaderCircle size={14} className="animate-spin"/>{nb?"Henter vurdering …":"Loading assessment …"}</span>:
   match.isError?<span className="saved-job-match-detail"><Info size={15}/>{nb?"Vurdering kunne ikke hentes":"Assessment unavailable"}</span>:
   coverage?<><div className="saved-job-match-score"><strong>{coverage.percent}% {nb?"kravmatch":"requirement match"}</strong><span>{stale?<Clock3 size={17}/>:<CircleCheck size={17}/>}</span></div><div className="saved-job-match-meter" aria-hidden="true"><span style={{width:`${coverage.percent}%`}}/></div><p className="saved-job-match-detail">{match.isFetching?(nb?"Kontrollerer om vurderingen er oppdatert …":"Checking assessment freshness …"):stale?(nb?"Profilen er endret · vurder på nytt":"Profile changed · reassess"):provisional?`${nb?"Foreløpig":"Provisional"} · ${coverage.evaluated}/${coverage.total} ${nb?"krav vurdert":"requirements assessed"}`:`${coverage.assessed}/${coverage.total} ${nb?"krav med grunnlag":"requirements with evidence"}`}</p>{match.data && <><AiIdentity selections={match.data.provider && match.data.model?[{provider:match.data.provider,model:match.data.model}]:undefined} provider={match.data.provider} locale={locale}/>{matchInsights(match.data,job.content).formal.length>0 && <span className="match-formal-note">{matchInsights(match.data,job.content).formal.length} {nb?"kvalifikasjonskrav til kontroll":"qualification requirements to review"}</span>}</>}</>:
   <><strong className="saved-job-match-empty">{match.data?(nb?"Vurdering lagret":"Assessment saved"):(nb?"Ikke matchet ennå":"Not matched yet")}</strong><p className="saved-job-match-detail">{match.data?(nb?"Ingen sorterte krav å beregne prosent fra.":"No structured requirements available for a score."):(nb?"Åpne stillingen og vurder den mot din lagrede kompetanse.":"Open the job and assess it against your saved experience.")}</p></>}
 </div>;
}
