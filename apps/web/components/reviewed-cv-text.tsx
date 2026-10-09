"use client";
import { useMutation } from "@tanstack/react-query";
import { Copy, CircleCheck, FileText } from "lucide-react";
import { reviewedCvText,type TextProposal } from "../lib/cv-tailoring";
import type { Locale } from "../lib/translations";
import { Card,CardHeader,CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";

export function ReviewedCvText({source,proposals,decisions,edits,locale,current}:{source:string;proposals:TextProposal[];decisions:Record<number,"ACCEPTED"|"REJECTED">;edits:Record<number,string>;locale:Locale;current:boolean}) {
 const nb=locale==="nb",accepted=proposals.filter(p=>decisions[p.paragraphIndex]==="ACCEPTED");
 const text=reviewedCvText(source,accepted.map(p=>({paragraphIndex:p.paragraphIndex,oldText:p.oldText,text:edits[p.paragraphIndex]??p.newText})));
 const copy=useMutation({retry:false,gcTime:0,mutationFn:async(value:string)=>{if(!navigator.clipboard?.writeText)throw new Error("CLIPBOARD_UNAVAILABLE");await navigator.clipboard.writeText(value);return value;}});
 const copied=current && copy.data===text;
 return <Card className="reviewed-cv-text"><CardHeader><div className="workspace-heading"><h3><FileText size={18}/>{nb?"Samle de godkjente endringene":"Combine your approved changes"}</h3><Badge variant="outline">{accepted.length} {nb?"godkjent":"approved"}</Badge></div><p className="hint">{nb?"Bare godkjente forslag erstatter tekst. Resten beholdes fra grunnlags-CV-en. Dette er ren tekst; originalens layout og fil endres ikke.":"Only approved proposals replace text. Everything else stays from your base CV. This is plain text; your original layout and file are unchanged."}</p></CardHeader><CardContent>
 {!current && <p role="status" className="notice">{nb?"Grunnlaget eller valgene er endret. Tidligere tekst kan leses; lag nye forslag før du kopierer som gjeldende CV-tekst.":"Evidence or selections changed. Earlier text remains readable; regenerate proposals before copying as current CV wording."}</p>}
 {text===null?<p role="status" className="notice">{nb?"Endringene kunne ikke knyttes til den opprinnelige teksten. Forslagene beholdes; gjennomgå grunnlaget på nytt.":"Changes could not be linked to the original text. Proposals are retained; review the source again."}</p>:<details className="reviewed-cv-preview"><summary>{nb?"Forhåndsvis hele CV-teksten":"Preview the full CV text"}</summary><p className="hint">{nb?"Kan inneholde kontaktopplysninger. Ingenting kopieres før du velger det. Teksten og valgene finnes bare mens siden er åpen.":"May contain contact details. Nothing is copied until you choose it. Text and decisions last only while this page is open."}</p><Textarea aria-label={nb?"CV-tekst med godkjente endringer":"CV text with approved changes"} readOnly rows={12} value={text}/></details>}
 <Button size="sm" disabled={!current || text===null || !accepted.length || copy.isPending} onClick={()=>{if(current && text!==null && accepted.length)copy.mutate(text);}}>{copied?<CircleCheck size={16}/>:<Copy size={16}/>} {copy.isPending?nb?"Kopierer …":"Copying …":copied?nb?"Kopiert":"Copied":nb?"Kopier CV-teksten":"Copy CV text"}</Button>
 {!accepted.length && <p className="hint">{nb?"Godkjenn minst én endring for å kopiere den tilpassede teksten.":"Approve at least one change to copy the tailored wording."}</p>}
 {copied && <p role="status" className="hint">{nb?"CV-teksten er kopiert. Lim den inn i CV-verktøyet ditt og kontroller formatering og innhold før bruk.":"CV text copied. Paste it into your CV editor and check formatting and content before use."}</p>}
 {copy.isError && copy.variables===text && <p role="status" className="notice">{nb?"Nettleseren tillot ikke kopiering. Åpne forhåndsvisningen og kopier teksten manuelt med ⌘C eller Ctrl+C.":"Your browser did not allow copying. Open the preview and copy the text manually with ⌘C or Ctrl+C."}</p>}
 </CardContent></Card>;
}
