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
