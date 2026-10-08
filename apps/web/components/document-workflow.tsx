"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileText, Pause, Play, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { isDocumentRun, categoryLabels, profileLabels, type DocumentRun } from "../lib/document-workflow";
import { isClaim } from "../lib/claims";
import { isEntry, entryKinds, type EntryContent } from "../lib/career-entries";
import { retryAfterSeconds, retryWaitLabel } from "../lib/retry-after";
import type { DocumentDetail } from "../lib/documents";
import type { CompetencySuggestion, CareerDraft } from "../lib/document-analysis";
import type { Locale } from "../lib/translations";

const base = "/api/profile/me/documents/workflow";
export function DocumentWorkflow({ scope, documents, locale, csrfToken, onAuthRequired }: {
  scope: string; documents: DocumentDetail[]; locale: Locale; csrfToken: string; onAuthRequired: () => void;
}) {
  const nb = locale === "nb"; const cache = useQueryClient();
  const [previews, setPreviews] = useState(() => documents.map(d => ({documentId:d.document.id, text:d.text, included:!!d.text.trim()})));
  const [consent, setConsent] = useState(false); const [run, setRun] = useState<DocumentRun | null>(null);
  const [active, setActive] = useState(false); const control = useRef<{stop:boolean; abort:AbortController} | null>(null);
  const [retryUntil,setRetryUntil]=useState(0);
  const [now, setNow] = useState(Date.now()); const [filter, setFilter] = useState("ALL"); const [search,setSearch]=useState("");
  const [review, setReview] = useState<{index:number; draft:CompetencySuggestion} | null>(null);
  const [history, setHistory] = useState<CareerDraft | null>(null); const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null); const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => { const timer=setInterval(()=>setNow(Date.now()),1000); return ()=> { clearInterval(timer); if(control.current){control.current.stop=true;control.current.abort.abort();} }; }, []);
  async function request(path:string, method="GET", body?:unknown, signal?:AbortSignal):Promise<unknown> {
    const response=await fetch(path,{method,cache:"no-store",headers:{"Content-Type":"application/json","X-CSRF-TOKEN":csrfToken},body:body===undefined?undefined:JSON.stringify(body),signal});
    if(response.status===401)onAuthRequired();const value=await response.json();
    if(!response.ok){const error=new Error(typeof value?.code==="string"?value.code:"DOCUMENT_UNAVAILABLE") as Error & {seconds?:number};error.seconds=retryAfterSeconds(response.headers.get("retry-after"));throw error;} return value;
  }
  const latest=useQuery({queryKey:["private-document-workflow",scope],gcTime:0,retry:false,refetchOnReconnect:false,refetchOnWindowFocus:false,queryFn:async()=>{
    const value=await request(`${base}?scope=${encodeURIComponent(scope)}`);if(value!==null && !isDocumentRun(value))throw new Error("DOCUMENT_UNAVAILABLE");return value;
  }});
  const current=run ?? latest.data ?? null;
  const analysis=current?.analysis;
  const wait=Math.max(0,Math.ceil((Math.max(current?.nextAt?Date.parse(current.nextAt):0,retryUntil)-now)/1000));
  const selected=previews.filter(p=>p.included && p.text.trim()).map(({documentId,text})=>({documentId,text}));
  const size=selected.reduce((sum,p)=>sum+p.text.length,0);
  function remember(value:unknown):DocumentRun { if(!isDocumentRun(value))throw new Error("DOCUMENT_UNAVAILABLE");setRun(value);cache.setQueryData(["private-document-workflow",scope],value);return value; }
  const process=useMutation({retry:false,mutationFn:async(fresh:boolean)=>{
    if(control.current)throw new Error("AI_BUSY");
    const session={stop:false,abort:new AbortController()};control.current=session;setActive(true);setNotice(null);
    try {
      let next:DocumentRun;
      if(fresh){setSaved([]);next=remember(await request(base,"POST",{scope,documents:selected,locale,consent},session.abort.signal));}
      else {if(!current)throw new Error("DOCUMENT_UNAVAILABLE");next=remember(await request(`${base}/${current.id}`,"GET",undefined,session.abort.signal));}
      while(!session.stop && next.status!=="COMPLETED") {
        // Waiting is genuine quota pacing. Never retry a rejected provider call automatically.
        while(!session.stop && next.nextAt && Date.parse(next.nextAt)>Date.now())await new Promise(resolve=>setTimeout(resolve,250));
        if(session.stop)break;
        next=remember(await request(`${base}/${next.id}/next`,"POST",{revision:next.revision},session.abort.signal));
        if(next.status==="PAUSED")break;
      }
      return next;
    } finally {if(control.current===session){control.current=null;setActive(false);}}
  },onError:error=>{const seconds=(error as Error & {seconds?:number}).seconds;if(seconds)setRetryUntil(Date.now()+seconds*1000);}});
  const save=useMutation({retry:false,mutationFn:async(command:{kind:"claim"|"entry"|"summary";body:unknown})=>{
    if(!current)throw new Error("DOCUMENT_UNAVAILABLE");const value=await request(`${base}/${current.id}/${command.kind==="claim"?"claims":command.kind==="entry"?"entries":"summary"}`,command.kind==="summary"?"PUT":"POST",command.body);if(!(command.kind==="claim"?isClaim(value):command.kind==="entry"?isEntry(value):isDocumentRun(value)))throw new Error("DOCUMENT_UNAVAILABLE");return {command,value};
  },onSuccess:async({command,value})=>{
    if(command.kind==="summary")remember(value);
    else if(command.kind==="claim" && isClaim(value)){setSaved(previous=>[...previous,`claim:${review?.index}`]);setReview(null);await cache.invalidateQueries({queryKey:["private-claims"]});}
    else if(command.kind==="entry" && isEntry(value)){setSaved(previous=>[...previous,`entry:${history?.key}`]);setHistory(null);await cache.invalidateQueries({queryKey:["private-entries"]});}
    else throw new Error("DOCUMENT_UNAVAILABLE");
    setNotice(nb?"Lagret. Bekreftede opplysninger er klare for videre bruk; andre er utkast.":"Saved. Confirmed information is ready for use; other information remains a draft.");
  }});
  function stop(){if(control.current)control.current.stop=true;}
  function failure(code:string){
    if(code==="AI_RATE_LIMITED")return nb?"Groq-kvoten er midlertidig brukt opp. Fremdrift og forslag er bevart. Fortsett når ventetiden er over.":"Groq's quota is temporarily exhausted. Progress and drafts are preserved. Continue when the wait ends.";
    if(code==="AI_INVALID_RESULT")return nb?"Denne delen ga ikke brukbare AI-forslag. Dokumentene og tidligere forslag er bevart; du kan prøve å fortsette.":"This step produced no usable AI drafts. Documents and previous drafts are preserved; you can try continuing.";
    if(code==="AI_BUDGET_REACHED")return nb?"Pilotens grense for dokumentkall er nådd. Forslagene er bevart; grensen gjelder frem til backend starter på nytt.":"The pilot document-call budget was reached. Drafts are preserved; the budget lasts until backend restart.";
    if(code==="DOCUMENT_AI_OUTPUT_TOO_LARGE")return nb?"Dette grunnlaget eller resultatet er større enn pilotens lagringsgrense. Tidligere fremdrift er bevart. Velg færre dokumenter for en ny analyse.":"These sources or results exceed the pilot storage limit. Previous progress is retained. Select fewer documents for a new analysis.";
    if(code==="DOCUMENT_ANALYSIS_CONFLICT" || code==="DOCUMENT_NOT_FOUND")return nb?"Dokumentgrunnlaget er endret. Lukk oversikten og åpne dokumentene på nytt før en ny analyse.":"Document sources changed. Close this review and reopen the documents before a new analysis.";
    if(code==="AUTH_REQUIRED")return nb?"Logg inn igjen. Lagret fremdrift beholdes.":"Sign in again. Saved progress is retained.";
    return nb?"Vi kunne ikke fullføre dette nå. Dokumentene og lagrede forslag er beholdt. Prøv igjen senere.":"We could not complete this now. Documents and saved drafts are retained. Try again later.";
  }
  const error=save.error ?? process.error ?? latest.error;
  const issue=error?.name==="AbortError"?null:error?.message ?? current?.issue;
  const names=new Map(documents.map(d=>[d.document.id,d.document.originalName]));
  const languages=new Map(documents.map(d=>[d.document.id,d.document.language]));
  const groups=Object.entries(Object.groupBy((analysis?.suggestions??[]).map((draft,index)=>({draft,index})).filter(({draft})=>(filter==="ALL" || (draft.category??"OTHER")===filter) && `${draft.skill} ${draft.context} ${draft.statement}`.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale))),({draft})=>draft.context));
  return <div className="full-document-workflow">
    <div className="document-flow-heading"><div><Badge>{nb?"Dokumenter → din profil":"Documents → your profile"}</Badge><h3>{nb?"La dokumentene gjøre grunnarbeidet":"Let your documents do the groundwork"}</h3><p className="hint">{nb?"Vi leser hele grunnlaget og lager redigerbare forslag. Du kontrollerer hva som faktisk beskriver deg.":"We read the entire source selection and draft editable proposals. You decide what accurately describes you."}</p></div></div>
    <Card><CardHeader><h3 className="flex items-center gap-2"><FileText size={18}/>{nb?"Dokumentgrunnlag":"Document sources"}</h3><p className="hint">{nb?"Åpne for å kontrollere teksten eller fjerne private opplysninger. Innholdet behandles automatisk i mindre deler; du trenger ikke dele det selv.":"Open to review text or remove private details. Processing uses smaller portions automatically; you do not need to split documents."}</p></CardHeader><CardContent>
      <div className="document-source-grid">{previews.map((p,index)=><details key={p.documentId} className="source-review-tile"><summary><span>{names.get(p.documentId)}</span><Badge variant="outline">{p.text.length.toLocaleString(locale)} {nb?"tegn":"characters"}</Badge></summary>
        <label className="consent-row"><input type="checkbox" checked={p.included} disabled={active} onChange={e=>{setConsent(false);setPreviews(previews.map((v,i)=>i===index?{...v,included:e.target.checked}:v));}}/>{nb?"Ta med dokumentet":"Include document"}</label>
        {!p.text.trim() && <p>{nb?"Ingen lesbar tekst. Les originalen med OCR, eller last opp en lesbar kopi.":"No readable text. Reread using OCR or upload a readable copy."}</p>}
        <Textarea lang={languages.get(p.documentId)} aria-label={`${nb?"Tekst som sendes fra":"Text sent from"} ${names.get(p.documentId)}`} rows={8} maxLength={60000} value={p.text} disabled={active} onChange={e=>{setConsent(false);setPreviews(previews.map((v,i)=>i===index?{...v,text:e.target.value}:v));}}/>
      </details>)}</div>
      <p className="hint mt-3">{selected.length} {nb?"dokumenter valgt":"documents selected"} · {size.toLocaleString(locale)} {nb?"tegn. Originalene beholdes. Forslagene lagres privat og er ubekreftet.":"characters. Originals are retained. Drafts are stored privately and remain unverified."}</p>
      <label className="consent-row"><input type="checkbox" checked={consent} disabled={active} onChange={e=>setConsent(e.target.checked)}/>{nb?"Jeg godkjenner at valgt tekst sendes til Groq for denne analysen":"I approve sending the selected text to Groq for this analysis"}</label>
      <div className="claim-actions"><Button disabled={!consent || size<40 || wait>0 || active || save.isPending || latest.isPending} onClick={()=>process.mutate(true)}><Sparkles size={16}/>{current?nb?"Start ny analyse":"Start new analysis":nb?"Bygg profil fra dokumentene":"Build profile from documents"}</Button>
        {current && current.status!=="COMPLETED" && !active && <Button variant="outline" disabled={!consent || wait>0 || save.isPending} onClick={()=>process.mutate(false)}><Play size={16}/>{nb?"Fortsett lagret analyse":"Continue saved analysis"}</Button>}
        {active && <Button variant="outline" onClick={stop}><Pause size={16}/>{nb?"Stopp etter dette kallet":"Stop after this call"}</Button>}</div>
    </CardContent></Card>
    {current && <div className="document-run-status" role="status"><div><strong>{current.status==="COMPLETED"?(nb?"Gjennomgangen er klar":"Review ready"):active?(wait?nb?"Venter på neste kall":"Waiting for next call":nb?"Leser dokumentgrunnlaget":"Reading document sources"):nb?"Fremdriften er lagret":"Progress saved"}</strong><span>{current.completedBatches} / {current.totalBatches} {nb?"behandlingstrinn":"processing steps"}{wait>0?` · ${retryWaitLabel(wait)}`:""}</span></div><progress aria-label={nb?"Dokumentanalyse":"Document analysis"} max={current.totalBatches} value={current.completedBatches}/><p className="hint">{analysis?.inputCharacters.toLocaleString(locale)} / {analysis?.sourceCharacters.toLocaleString(locale)} {nb?"kildetegn behandlet. Tekstdekning betyr ikke at AI har funnet all kompetanse.":"source characters processed. Text coverage does not mean AI found every competency."}</p></div>}
    {issue && <Alert><AlertDescription>{failure(issue)}</AlertDescription></Alert>}
    {notice && <p role="status">{notice}</p>}
    {analysis && <>
      <div className="document-results-heading"><h3>{nb?"Din dokumentbaserte profil":"Your document-based profile"}</h3><Badge variant="outline">{nb?"AI-utkast · kontroller før bruk":"AI draft · review before use"}</Badge></div>
      {analysis.partial && <p className="hint">{nb?"Grunnlaget er delvis behandlet eller redigert. Det som mangler, er ikke et kompetansegap.":"Sources are partly processed or edited. Missing information is not a skill gap."}</p>}
      <div className="profile-summary-grid">{(analysis.profile??[]).map((item,index)=><SummaryDraft key={`${current!.id}-${index}-${item.kind}`} label={profileLabels[locale][item.kind as keyof typeof profileLabels.nb]} text={item.text} quote={item.quote} source={names.get(item.documentId)??""} language={analysis.locale} sourceLanguage={languages.get(item.documentId)??locale} additionalSources={(item.additionalSources??[]).map(source=>({quote:source.quote,source:names.get(source.documentId)??"",language:languages.get(source.documentId)??locale}))} locale={locale} disabled={active || save.isPending || current!.status!=="COMPLETED"} onSave={text=>save.mutate({kind:"summary",body:{revision:current!.revision,index,text}})}/>)}</div>
      {!analysis.profile?.length && <p className="hint">{nb?"Sammendraget fylles ut når vi har kildegrunnlag. Utdanning og interesser legges bare til når dokumentene beskriver dem.":"A summary appears when source evidence is available. Education and interests require explicit document evidence."}</p>}
      <div className="document-results-heading"><h3>{nb?"Arbeid, prosjekter og utdanning":"Employment, projects and education"}</h3><Badge variant="outline">{analysis.careerEntries?.length??0}</Badge></div>
      <div className="career-draft-grid">{(analysis.careerEntries??[]).map(draft=><Card key={draft.key}><CardContent className="pt-5"><Badge variant="outline">{entryKinds[locale][draft.content.kind]}</Badge><h4>{draft.content.title}</h4><p>{draft.content.organization}{draft.content.client?` · ${draft.content.client}`:""}</p><p className="hint">{draft.periodText || (nb?"Periode ikke oppgitt":"Period not stated")}</p><p lang={analysis.locale}>{draft.content.description}</p><Button variant="outline" size="sm" disabled={active || save.isPending} onClick={()=>{setHistory(draft);setConfirmed(false);save.reset();}}>{saved.includes(`entry:${draft.key}`)?nb?"Se igjen":"Review again":nb?"Kontroller og legg til historikk":"Review and add history"}</Button></CardContent></Card>)}</div>
      <div className="document-results-heading"><h3>{nb?"Kompetanseforslag":"Competency proposals"}</h3><Badge variant="outline">{analysis.suggestions.length}</Badge></div>
      <Input aria-label={nb?"Søk i AI-forslag":"Search AI proposals"} placeholder={nb?"Søk etter kompetanse, firma eller prosjekt …":"Search skills, company or project …"} value={search} onChange={e=>setSearch(e.target.value)}/>
      <div className="competency-filter-row" aria-label={nb?"Kompetansekategorier":"Competency categories"}>{["ALL",...Object.keys(categoryLabels[locale])].map(category=><Button key={category} size="sm" variant={filter===category?"default":"outline"} aria-pressed={filter===category} onClick={()=>setFilter(category)}>{category==="ALL"?nb?"Alle":"All":categoryLabels[locale][category as keyof typeof categoryLabels.nb]}</Button>)}</div>
      {groups.map(([context,items])=><section key={context} className="competency-context-group"><h4>{context}</h4><div className="competency-proposal-grid">{items?.map(({draft,index})=><Card key={`${index}-${draft.skill}`}><CardContent className="pt-5"><div className="claim-heading"><h4>{draft.skill}</h4>{saved.includes(`claim:${index}`)?<Check size={16}/>:<Badge variant="outline">{nb?"Ubekreftet":"Unverified"}</Badge>}</div><p lang={analysis.locale}>{draft.statement}</p><p className="hint">{names.get(draft.documentId??"")}{draft.additionalSources?.length?` + ${draft.additionalSources.length}`:""}</p><Button variant="outline" size="sm" disabled={active || save.isPending} onClick={()=>{setReview({index,draft:{...draft}});setConfirmed(false);save.reset();}}>{nb?"Se gjennom":"Review"}</Button></CardContent></Card>)}</div></section>)}
      {!!analysis.omittedItems && <p className="hint">{analysis.omittedItems} {nb?"forslag manglet kontrollerbart grunnlag eller overskred grensene. Kildeteksten er bevart.":"proposals lacked verifiable evidence or exceeded limits. Source text is retained."}</p>}
    </>}
    <Sheet open={!!review || !!history} onOpenChange={open=>{if(!open && !save.isPending){setReview(null);setHistory(null);save.reset();}}}><SheetContent className="document-draft-sheet" closeLabel={nb?"Lukk":"Close"}><SheetHeader><SheetTitle>{nb?"Kontroller opplysningen":"Review this information"}</SheetTitle><SheetDescription>{nb?"AI har fylt ut et utkast. Rett teksten slik at den beskriver din egen erfaring. Kilden beholdes.":"AI has filled a draft. Edit it to describe your own experience accurately. Evidence is retained."}</SheetDescription></SheetHeader>
      {review && <><label htmlFor="draft-skill">{nb?"Kompetanse":"Competency"}</label><Input id="draft-skill" value={review.draft.skill} maxLength={120} onChange={e=>setReview({...review,draft:{...review.draft,skill:e.target.value}})}/><label htmlFor="draft-statement">{nb?"Hva gjorde du selv?":"What did you personally do?"}</label><Textarea id="draft-statement" value={review.draft.statement} maxLength={1000} rows={5} onChange={e=>setReview({...review,draft:{...review.draft,statement:e.target.value}})}/><label htmlFor="draft-context">{nb?"Firma / prosjekt":"Company / project"}</label><Input id="draft-context" value={review.draft.context} maxLength={500} onChange={e=>setReview({...review,draft:{...review.draft,context:e.target.value}})}/></>}
      {history && <HistoryFields content={history.content} locale={locale} onChange={content=>setHistory({...history,content})}/>}
      <details open className="draft-evidence"><summary>{nb?"Dokumentert grunnlag":"Source evidence"}</summary><p className="hint">{names.get(review?.draft.documentId??history?.documentId??"")}</p><blockquote>{review?.draft.quote??history?.quote}</blockquote>{(review?.draft.additionalSources??history?.additionalSources)?.map((source,index)=><div key={index}><p className="hint">{names.get(source.documentId)}</p><blockquote>{source.quote}</blockquote></div>)}</details>
      <label className="consent-row"><input type="checkbox" checked={confirmed} disabled={save.isPending} onChange={e=>setConfirmed(e.target.checked)}/>{nb?"Jeg har kontrollert teksten og bekrefter at dette er min erfaring":"I reviewed the text and confirm this is my experience"}</label>
      {save.error && <Alert><AlertDescription>{failure(save.error.message)}</AlertDescription></Alert>}
      <Button disabled={save.isPending || active || (review?!review.draft.skill.trim() || !review.draft.statement.trim() || !review.draft.context.trim():!history?.content.title.trim() || !history?.content.organization.trim())} onClick={()=>{if(review)save.mutate({kind:"claim",body:{revision:current!.revision,index:review.index,skill:review.draft.skill,statement:review.draft.statement,context:review.draft.context,confirm:confirmed}});else if(history)save.mutate({kind:"entry",body:{key:history.key,content:history.content,confirm:confirmed}});}}>{save.isPending?nb?"Lagrer …":"Saving …":confirmed?nb?"Lagre og bekreft":"Save and confirm":nb?"Lagre som utkast":"Save as draft"}</Button>
    </SheetContent></Sheet>
  </div>;
}
function SummaryDraft({label,text,quote,source,language,sourceLanguage,additionalSources,locale,disabled,onSave}:{label:string;text:string;quote:string;source:string;language:Locale;sourceLanguage:Locale;additionalSources:{source:string;quote:string;language:Locale}[];locale:Locale;disabled:boolean;onSave:(text:string)=>void}) {
  const [editing,setEditing]=useState(false);const [draft,setDraft]=useState(text);useEffect(()=>setDraft(text),[text]);
  return <Card><CardContent className="pt-5"><h4>{label}</h4>{editing?<Textarea aria-label={label} lang={language} value={draft} maxLength={1000} rows={6} onChange={e=>setDraft(e.target.value)}/>:<p lang={language}>{text}</p>}<details><summary>{locale==="nb"?"Se kilde":"View source"}</summary><p className="hint">{source}</p><blockquote lang={sourceLanguage}>{quote}</blockquote>{additionalSources.map((evidence,index)=><div key={index}><p className="hint">{evidence.source}</p><blockquote lang={evidence.language}>{evidence.quote}</blockquote></div>)}</details><div className="claim-actions"><Button variant="ghost" size="sm" disabled={disabled} onClick={()=>{if(editing){setDraft(text);}setEditing(!editing);}}>{editing?locale==="nb"?"Avbryt":"Cancel":locale==="nb"?"Rediger sammendrag":"Edit summary"}</Button>{editing && <Button size="sm" disabled={disabled || !draft.trim()} onClick={()=>{onSave(draft);setEditing(false);}}>{locale==="nb"?"Lagre utkast":"Save draft"}</Button>}</div></CardContent></Card>;
}
function HistoryFields({content,locale,onChange}:{content:EntryContent;locale:Locale;onChange:(content:EntryContent)=>void}) {
  const nb=locale==="nb";const fields={title:nb?"Tittel / rolle":"Title / role",organization:nb?"Arbeidsgiver / organisasjon":"Employer / organization",client:nb?"Kunde (hvis oppgitt)":"Client (if stated)",deliveryRole:nb?"Faktisk leveranserolle":"Delivery role",description:nb?"Beskrivelse av erfaring":"Experience description"};
  return <div className="claim-form"><label htmlFor="history-kind">{nb?"Type historikk":"History type"}</label><select id="history-kind" value={content.kind} onChange={e=>onChange({...content,kind:e.target.value as EntryContent["kind"]})}>{Object.entries(entryKinds[locale]).map(([kind,label])=><option key={kind} value={kind}>{label}</option>)}</select>{Object.entries(fields).map(([key,label])=><div key={key}><label htmlFor={`history-${key}`}>{label}</label>{key==="description"?<Textarea id={`history-${key}`} rows={5} maxLength={2000} value={content.description} onChange={e=>onChange({...content,description:e.target.value})}/>:<Input id={`history-${key}`} maxLength={200} value={content[key as keyof typeof fields]} onChange={e=>onChange({...content,[key]:e.target.value})}/>}</div>)}<div className="grid grid-cols-2 gap-3">{(["startMonth","endMonth"] as const).map(key=><div key={key}><label htmlFor={`history-${key}`}>{key==="startMonth"?nb?"Startmåned (valgfri)":"Start month (optional)":nb?"Sluttmåned (valgfri)":"End month (optional)"}</label><Input id={`history-${key}`} type="month" value={content[key]??""} disabled={key==="endMonth" && content.ongoing} onChange={e=>onChange({...content,[key]:e.target.value||null})}/></div>)}</div><label className="consent-row"><input type="checkbox" checked={content.ongoing} onChange={e=>onChange({...content,ongoing:e.target.checked,endMonth:e.target.checked?null:content.endMonth})}/>{nb?"Pågår fortsatt":"Ongoing"}</label><p className="hint">{nb?"Årstall uten måned beholdes i beskrivelsen; vi finner ikke på datoer.":"Year-only dates remain in the description; we do not invent months."}</p></div>;
}
