"use client";
import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import type { Locale } from "../lib/translations";
import { Button } from "./ui/button";
export function Brand({ href = "/" }: { href?: string }) {
  return <Link className="brand" href={href} aria-label="Career Agent"><span className="brand-mark"><BriefcaseBusiness size={20}/></span>Career Agent<span className="brand-dot">.</span></Link>;
}
export function LanguagePicker({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  return <label className="language-picker">{locale === "nb" ? "Språk" : "Language"}<select value={locale} onChange={event => onChange(event.target.value as Locale)}><option value="nb">Norsk</option><option value="en">English</option></select></label>;
}
export function SiteHeader({ locale, onChange, login = true }: { locale: Locale; onChange: (locale: Locale) => void; login?: boolean }) {
  return <header className="site-header"><Brand/><div className="site-header-actions"><LanguagePicker locale={locale} onChange={onChange}/>{login && <Button asChild variant="outline"><Link href="/login">{locale === "nb" ? "Logg inn" : "Sign in"}</Link></Button>}</div></header>;
}
