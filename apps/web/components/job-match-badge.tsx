"use client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, LoaderCircle } from "lucide-react";
import { isPersonalMatch, type PersonalMatch } from "../lib/personal-match";
import { matchCoverage } from "../lib/match-planning";
import type { SavedJob } from "../lib/saved-jobs";
import type { Locale } from "../lib/translations";
import { Badge } from "./ui/badge";

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
 return <div className="saved-job-match" aria-live="polite">
  {match.isPending?<span className="hint flex items-center gap-2"><LoaderCircle size={13} className="animate-spin"/>{nb?"Henter vurdering …":"Loading assessment …"}</span>:
   match.isError?<span className="hint">{nb?"Vurdering kunne ikke hentes":"Assessment unavailable"}</span>:
   coverage?<><Badge className="gap-1" variant={match.data?.stale?"outline":"secondary"}><Sparkles size={13}/>{coverage.percent}% {nb?"kravmatch":"requirement match"}</Badge><span className="hint">{match.data?.stale?(nb?"Profilen er endret · vurder på nytt":"Profile changed · reassess"):`${coverage.assessed}/${coverage.total} ${nb?"krav med grunnlag":"requirements with evidence"}`}</span></>:
   <span className="hint">{nb?"Klar for personlig match":"Ready for personal matching"}</span>}
 </div>;
}
