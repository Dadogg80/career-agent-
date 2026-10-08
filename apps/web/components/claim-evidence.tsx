"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isClaimEvidence } from "../lib/claims";
import { Button } from "./ui/button";
import type { Locale } from "../lib/translations";
export function ClaimEvidence({id,locale}:{id:string;locale:Locale}) {
 const [open,setOpen]=useState(false);const nb=locale==="nb";
 const evidence=useQuery({queryKey:["private-claim-evidence",id],enabled:open,gcTime:0,retry:false,queryFn:async()=>{const r=await fetch(`/api/profile/me/claims/${id}/evidence`,{cache:"no-store"});const v=await r.json();if(!r.ok||!isClaimEvidence(v))throw new Error("Unavailable");return v;}});
 return <div className="claim-evidence-list"><Button variant="ghost" size="sm" onClick={()=>setOpen(!open)}>{open?(nb?"Skjul dokumentkilder":"Hide document sources"):(nb?"Se alle dokumentkilder":"View all document sources")}</Button>{open&&<>{evidence.isPending&&<p role="status">{nb?"Henter kilder …":"Loading sources …"}</p>}{evidence.isError&&<p className="hint">{nb?"Kildelisten kunne ikke hentes. Det opprinnelige sitatet ovenfor er beholdt.":"Could not load the source list. The original quote above is retained."}<Button variant="outline" onClick={()=>void evidence.refetch()}>{nb?"Prøv igjen":"Try again"}</Button></p>}{evidence.data?.length===0&&<p className="hint">{nb?"Ingen dokumentkilder knyttet til dette punktet. Se kildenotatet.":"No document sources linked to this item. See its source note."}</p>}{evidence.data?.map(source=><div key={source.id}><p className="hint">{source.originalName}{!source.documentId?(nb?" · originalen er slettet":" · original deleted"):""}</p><p className="hint">{source.context}</p><p>{source.statement}</p><blockquote>{source.quote}</blockquote></div>)}</>}</div>;
}
