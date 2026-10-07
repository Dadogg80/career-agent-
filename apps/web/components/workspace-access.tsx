"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useWorkspaceSession } from "../lib/workspace-session";
import type { Locale } from "../lib/translations";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
export function WorkspaceAccess({ locale, children }: { locale: Locale; children: ReactNode }) {
 const session = useWorkspaceSession(); const nb = locale === "nb"; const router = useRouter();
 useEffect(() => { if (session.data && !session.data.authenticated && session.data.loginAvailable && session.data.profilesAvailable) router.replace("/login"); }, [session.data, router]);
 if (session.isPending) return <div className="workspace-loading" role="status">{nb ? "Åpner arbeidsområdet …" : "Opening your workspace …"}</div>;
 if (session.data?.authenticated && session.data.profilesAvailable) return children;
 return <Card className="access-card"><CardContent><LockKeyhole size={28}/><h2>{nb ? "Ditt arbeidsområde krever innlogging" : "Your workspace requires sign-in"}</h2><p>{session.isError ? (nb ? "Kunne ikke kontrollere innloggingen. Kontroller backend og prøv igjen." : "Could not check your session. Check the backend and try again.") : (nb ? "Logg inn for å åpne dine lagrede stillinger, kompetanse og dokumenter." : "Sign in to open your saved jobs, competencies and documents.")}</p><Button asChild><Link href="/login">{nb ? "Gå til innlogging" : "Go to sign-in"}</Link></Button>{session.isError && <Button variant="outline" onClick={() => void session.refetch()}>{nb ? "Prøv igjen" : "Try again"}</Button>}</CardContent></Card>;
}
