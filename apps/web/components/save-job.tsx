"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { BookmarkPlus, Check } from "lucide-react";
import { isSession } from "../lib/profile";
import { isSavedJob, savedError, type SavedJobContent } from "../lib/saved-jobs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
export function SaveJob({ content, disabled }: { content: SavedJobContent; disabled: boolean }) {
 const locale = content.locale; const nb = locale === "nb";
 const [open, setOpen] = useState(false); const [title, setTitle] = useState(content.title); const cache = useQueryClient();
 const session = useQuery({ queryKey: ["private-session"], gcTime: 0, queryFn: async () => { const r = await fetch("/api/auth/session", { cache: "no-store" }); const v = await r.json(); if (!r.ok || !isSession(v)) throw new Error("AUTH_REQUIRED"); return v; }, retry: false });
 const save = useMutation({ retry: false, mutationFn: async () => { const r = await fetch("/api/profile/me/jobs", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": session.data?.csrfToken ?? "" }, body: JSON.stringify({ ...content, title }) }); const v = await r.json(); if (!r.ok) throw new Error(v.code ?? "SAVED_JOB_UNAVAILABLE"); if (!isSavedJob(v)) throw new Error("SAVED_JOB_UNAVAILABLE"); return v; }, onSuccess: () => { void cache.invalidateQueries({ queryKey: ["private-saved-jobs"] }); setOpen(false); } });
 return <div className="save-job-action"><Button variant="outline" disabled={disabled || session.isPending} onClick={() => { save.reset(); setOpen(true); }}><BookmarkPlus size={16}/>{nb ? "Lagre stillingen" : "Save job"}</Button>{save.data && <Link href="/jobs/saved"><Check size={14} className="inline"/> {nb ? "Lagret · Se mine stillinger" : "Saved · View my jobs"}</Link>}
 <Dialog open={open} onOpenChange={value => { if (!save.isPending) setOpen(value); }}><DialogContent closeLabel={nb ? "Lukk" : "Close"}><DialogHeader><DialogTitle>{nb ? "Behold denne muligheten" : "Keep this opportunity"}</DialogTitle><DialogDescription>{nb ? "Annonseteksten, kildehenvisningen og denne analysen lagres som en egen versjon i profilen din. Ingen AI-kall utføres." : "Save the received text, source reference and this analysis as a private snapshot. No AI call is made."}</DialogDescription></DialogHeader>
 {!session.data?.authenticated ? <p>{nb ? "Logg inn og lagre profilen din først." : "Sign in and save your profile first."} <Link className="underline" href="/login">{nb ? "Gå til innlogging" : "Go to sign-in"}</Link></p> : <form className="text-form" onSubmit={e => { e.preventDefault(); save.mutate(); }}><label htmlFor="saved-job-title">{nb ? "Navn på stillingen" : "Job title"}</label><Input id="saved-job-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required disabled={save.isPending}/>{save.error && <p role="alert" className="notice">{savedError(save.error.message, locale)}</p>}<Button disabled={save.isPending || !title.trim()} type="submit">{save.isPending ? (nb ? "Lagrer …" : "Saving …") : (nb ? "Lagre versjonen" : "Save snapshot")}</Button></form>}
 </DialogContent></Dialog></div>;
}
