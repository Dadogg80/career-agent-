import { expect, test } from "@playwright/test";
import { isAiConfiguration, isAiProviderLabel, isAiSelection } from "../lib/ai-configuration";
import { isImportedJob } from "../lib/job-import";
import { isPersonalMatch } from "../lib/personal-match";
import { isDocumentAnalysis } from "../lib/document-analysis";

const id="11111111-1111-4111-8111-111111111111";
const selection={provider:"OpenAI",model:"gpt-5.4-mini"};
const approval={token:"a".repeat(64),selections:[selection]};

test("OpenAI configuration is recognized without weakening provider or retrieval validation",()=>{
 expect(isAiSelection(selection)).toBe(true);
 expect(isAiSelection({...selection,provider:"Unknown"})).toBe(false);
 const option={approval,available:true};
 const config={tasks:Object.fromEntries(["JOB_ANALYSIS","DOCUMENT_EXTRACTION","PROFILE_SUMMARY","PERSONAL_MATCH","CV_TAILORING"].map(k=>[k,selection])),documents:approval,documentExcerpt:approval,matching:approval,job:approval,options:Object.fromEntries(["documents","documentExcerpt","matching","job"].map(k=>[k,[option]]))};
 expect(isAiConfiguration(config)).toBe(true);
 expect(isAiConfiguration({...config,job:{...approval,token:"invalid"}})).toBe(false);
 expect(isImportedJob({sourceUrl:"https://www.finn.no/job/ad/478077416",title:"Engineer",text:"A fictional role requiring documented engineering experience.",retrievedAt:"2026-10-07T00:00:00Z",sourceType:"GROQ_BROWSER_EXCERPT",aiSelection:selection})).toBe(false);
});

test("stored OpenAI matching and mixed document history preserve the existing data guards",()=>{
 const match={id,locale:"nb",createdAt:"2026-10-15T08:00:00Z",assessments:[],claims:[],omittedItems:0,inputCharacters:100,stale:false,...selection};
 expect(isPersonalMatch(match)).toBe(true);
 expect(isPersonalMatch({...match,provider:"Unknown"})).toBe(false);
 expect(isPersonalMatch({...match,omittedItems:-1})).toBe(false);
 const document={id,locale:"nb",provider:"Groq + OpenAI + Gemini",summary:[],suggestions:[],inputCharacters:100,sourceCharacters:100,partial:false,omittedItems:0,createdAt:match.createdAt,documents:[],aiSelections:[selection]};
 expect(isDocumentAnalysis(document)).toBe(true);
 expect(isDocumentAnalysis({...document,provider:"Groq + Unknown"})).toBe(false);
 expect(isAiProviderLabel("Groq + OpenAI + Gemini")).toBe(true);
 expect(isAiProviderLabel("OpenAI + OpenAI")).toBe(false);
 expect(isAiProviderLabel("Groq + Gemini")).toBe(true);
});


test("the expanded twelve-model catalog remains valid and still rejects unbounded choices",()=>{
 const selections=[
  ...["openai/gpt-oss-20b","openai/gpt-oss-120b"].map(model=>({provider:"Groq",model})),
  ...["gemini-3.8-flash","gemini-3.7-flash","gemini-3.6-flash","gemini-3.5-flash","gemini-3.5-flash-lite","gemini-3.1-flash-lite"].map(model=>({provider:"Gemini",model})),
  ...["gpt-5.4-mini","gpt-5.4","gpt-6.1-sol","gpt-6-luna"].map(model=>({provider:"OpenAI",model})),
 ];
 const options=selections.map((s,i)=>({approval:{token:i.toString(16).padStart(64,"0"),selections:[s]},available:true}));
 const config={tasks:Object.fromEntries(["JOB_ANALYSIS","DOCUMENT_EXTRACTION","PROFILE_SUMMARY","PERSONAL_MATCH","CV_TAILORING"].map(k=>[k,selection])),documents:approval,documentExcerpt:approval,matching:approval,tailoring:approval,job:approval,options:Object.fromEntries(["documents","documentExcerpt","matching","job","tailoring"].map(k=>[k,options]))};
 expect(options).toHaveLength(12);
 expect(isAiConfiguration(config)).toBe(true);
 for(const area of ["documents","documentExcerpt","matching","job","tailoring"]) {
  expect(isAiConfiguration({...config,options:{...config.options,[area]:Array(17).fill(options[0])}})).toBe(false);
 }
});
