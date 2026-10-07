"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck, FileCheck2, ScanSearch, CircleAlert } from "lucide-react";
import { useLocale } from "../lib/use-locale";
import { useWorkspaceSession } from "../lib/workspace-session";
import { SiteHeader } from "./site-header";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
export function LoginPage() {
 const { locale, changeLocale } = useLocale(); const nb = locale === "nb"; const session = useWorkspaceSession(); const router = useRouter(); const [failed, setFailed] = useState(false);
 useEffect(() => { setFailed(new URLSearchParams(window.location.search).get("login") === "failed"); }, []);
 useEffect(() => { if (session.data?.authenticated && session.data.profilesAvailable) router.replace("/dashboard"); }, [session.data, router]);
 const ready = session.data?.loginAvailable && session.data.profilesAvailable;
 return <div className="public-site login-site"><SiteHeader locale={locale} onChange={changeLocale} login={false}/><main className="login-main"><section className="login-story"><p className="eyebrow">{nb ? "DITT PERSONLIGE ARBEIDSOMRÅDE" : "YOUR PERSONAL WORKSPACE"}</p><h1>{nb ? <>Velkommen til<br/>din neste mulighet.</> : <>Welcome to<br/>your next opportunity.</>}</h1><p>{nb ? "Samle erfaringen din, behold stillingene du liker og se hva du kan gjøre videre." : "Collect your experience, keep the jobs you like and see what to do next."}</p><ul>{[[ScanSearch, nb ? "Forstå stillingsannonsene" : "Understand job advertisements"], [FileCheck2, nb ? "Bygg en profil med bekreftet erfaring" : "Build a profile with confirmed experience"], [ShieldCheck, nb ? "Godkjenn hva AI får bruke" : "Approve what AI may use"]].map(([Icon, title]) => { const Glyph = Icon as typeof ScanSearch; return <li key={String(title)}><Glyph size={19}/>{String(title)}</li>; })}</ul></section>
 <Card className="login-card"><CardContent><span className="login-icon"><LockKeyhole size={27}/></span><h2>{nb ? "Logg inn i Career Agent" : "Sign in to Career Agent"}</h2><p className="login-description">{nb ? "Innloggingen åpnes i den lokale identitetstjenesten. Passordet ditt deles ikke med AI." : "Sign-in opens in the local identity service. Your password is never shared with AI."}</p>
 {failed && <Alert variant="destructive"><AlertDescription>{nb ? "Innloggingen ble ikke fullført. Prøv igjen." : "Sign-in did not complete. Please try again."}</AlertDescription></Alert>}
 {session.isPending && <p role="status">{nb ? "Kontrollerer innlogging …" : "Checking sign-in …"}</p>}
 {session.data?.authenticated && ready && <p role="status">{nb ? "Åpner arbeidsområdet …" : "Opening your workspace …"}</p>}
 {!session.data?.authenticated && ready && <Button asChild size="lg" className="login-primary"><a href="/api/auth/login">{nb ? "Fortsett til sikker innlogging" : "Continue to secure sign-in"}<ArrowRight size={18}/></a></Button>}
 {session.data && !ready && <div className="login-setup" role="status"><CircleAlert size={20}/><h3>{nb ? "Lokal innlogging må startes" : "Local sign-in needs to be started"}</h3><p>{nb ? "Profil og dokumentlagring krever PostgreSQL og den lokale identitetstjenesten. Følg oppsettet i docs/IDENTITY_SETUP.md i repositoriet. Stillingsanalyse kan brukes mens du setter opp innlogging." : "Profiles and document storage require PostgreSQL and the local identity service. Follow docs/IDENTITY_SETUP.md in the repository. Job analysis is available while you configure sign-in."}</p><Button variant="outline" onClick={() => void session.refetch()}>{nb ? "Kontroller oppsett på nytt" : "Check setup again"}</Button></div>}
 {session.isError && <Alert variant="destructive"><AlertDescription>{nb ? "Kunne ikke kontakte innloggingstjenesten. Kontroller at backend kjører." : "Could not reach the sign-in service. Check that the backend is running."}<Button variant="outline" onClick={() => void session.refetch()}>{nb ? "Prøv igjen" : "Try again"}</Button></AlertDescription></Alert>}
 <div className="login-divider"><span>{nb ? "eller utforsk først" : "or explore first"}</span></div><Button asChild variant="outline" className="login-primary"><Link href="/jobs/analyze">{nb ? "Prøv stillingsanalyse uten innlogging" : "Try job analysis without signing in"}</Link></Button><p className="login-footnote">{nb ? "Du trenger innlogging for å beholde annonser, kompetanse og dokumenter." : "Sign-in is required to retain jobs, competencies and documents."}</p></CardContent></Card></main><footer className="site-footer"><Link href="/">{nb ? "Tilbake til forsiden" : "Back to home"}</Link><span>{nb ? "Lokal pilot · Ingen betalt konto nødvendig" : "Local pilot · No paid account required"}</span></footer></div>;
}
