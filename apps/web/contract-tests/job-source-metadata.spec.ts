import { expect, test } from "@playwright/test";
import { isImportedJob } from "../lib/job-import";

const text = "Fictional backend role requiring Kotlin and PostgreSQL.";

// Browser retrieval and advertisement analysis have independent provider identities.
test("source metadata rejects an analysis provider pretending to be the FINN browser", async()=>{
 const source={sourceUrl:"https://www.finn.no/job/ad/478077416",title:"Engineer",text,retrievedAt:"2026-10-07T00:00:00Z",sourceType:"GROQ_BROWSER_EXCERPT"};
 expect(isImportedJob({...source,aiSelection:{provider:"Groq",model:"openai/gpt-oss-20b"}})).toBe(true);
 expect(isImportedJob({...source,aiSelection:{provider:"Gemini",model:"gemini-3.5-flash"}})).toBe(false);
 expect(isImportedJob({...source,aiSelection:{provider:"Groq",model:"https://invalid.example/model?secret"}})).toBe(false);
});

test("Gemini source metadata preserves retrieval models and rejects provider or source mismatches",()=>{
 const source={sourceUrl:"https://www.finn.no/job/ad/478077416",title:"Engineer",text,retrievedAt:"2026-10-07T00:00:00Z",sourceType:"GEMINI_URL_CONTEXT_EXCERPT"};
 for(const model of ["gemini-3.5-flash-lite","gemini-3.5-flash","gemini-3.6-flash","gemini-3.7-flash","gemini-3.8-flash","gemini-3.1-flash-lite"])expect(isImportedJob({...source,aiSelection:{provider:"Gemini",model}})).toBe(true);
 const selection={provider:"Gemini",model:"gemini-3.5-flash-lite"};
 expect(isImportedJob({...source,aiSelection:selection,sourceType:"GROQ_BROWSER_EXCERPT"})).toBe(false);
 expect(isImportedJob({...source,aiSelection:{provider:"Groq",model:"openai/gpt-oss-20b"}})).toBe(false);
 expect(isImportedJob({...source,aiSelection:{provider:"Gemini",model:"https://invalid.example/model?secret"}})).toBe(false);
 expect(isImportedJob({...source,aiSelection:selection,sourceUrl:"https://other.example/job/ad/478077416"})).toBe(false);
 expect(isImportedJob(source)).toBe(true);expect(isImportedJob({...source,aiSelection:null})).toBe(true);
});
