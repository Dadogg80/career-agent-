"use client";
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import Link from "next/link";
import {useWorkspaceSession} from "../lib/workspace-session";
import {isProfile} from "../lib/profile";
import type {Locale} from "../lib/translations";
import {DocumentPanel} from "./document-panel";
import {Button} from "./ui/button";
export function DocumentsWorkspace({locale}:{locale:Locale}){
 const session=useWorkspaceSession(),nb=locale==="nb",[expired,setExpired]=useState(false);
 const profile=useQuery({queryKey:["private-profile"],gcTime:0,retry:false,queryFn:async()=>{const r=await fetch("/api/profile/me",{cache:"no-store"});if(r.status===404)return null;if(r.status===401)throw new Error("AUTH_REQUIRED");const v:unknown=await r.json();if(!r.ok||!isProfile(v))throw new Error("PROFILE_UNAVAILABLE");return v;}});
 if(expired || profile.error?.message==="AUTH_REQUIRED")return <p role="alert">{nb?"Logg inn igjen for å åpne dokumentene.":"Sign in again to open your documents."}<Button asChild><Link href="/login">{nb?"Logg inn":"Sign in"}</Link></Button></p>;
 if(profile.isPending)return <p role="status">{nb?"Henter dokumentområdet …":"Loading your document workspace …"}</p>;
 if(profile.isError)return <p role="alert">{nb?"Kunne ikke hente profilen. Lagrede dokumenter er beholdt.":"Could not load your profile. Saved documents are retained."}<Button variant="outline" onClick={()=>void profile.refetch()}>{nb?"Prøv igjen":"Retry"}</Button></p>;
 if(!profile.data)return <p>{nb?"Lagre basisprofilen før du laster opp dokumenter.":"Save your basic profile before uploading documents."}<Button asChild><Link href="/career/profile">{nb?"Åpne min profil":"Open my profile"}</Link></Button></p>;
 return <><p className="hint">{nb?"Presentasjon, kompetanse, historikk og AI-gjennomgang ligger fortsatt i Min profil.":"Presentation, competencies, history and AI review remain in My profile."}{" "}<Link className="underline" href="/career/profile#profile-documents">{nb?"Åpne profil og gjennomgang":"Open profile and review"}</Link></p><DocumentPanel locale={locale} csrfToken={session.data?.csrfToken??""} onAuthRequired={()=>setExpired(true)}/></>;
}
