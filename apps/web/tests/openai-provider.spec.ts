import { expect, test } from "@playwright/test";

// UI transport fixture only. Provider-quality experiments run manually outside this suite.
test("OpenAI selection binds the request approval and renders the actual model without automatic calls",async({page})=>{
 const groq={provider:"Groq",model:"openai/gpt-oss-20b"},openai={provider:"OpenAI",model:"gpt-5.4-mini"};
 const original={token:"a".repeat(64),selections:[groq]},alternative={token:"b".repeat(64),selections:[openai]};
 const options=[{approval:original,available:true},{approval:alternative,available:true}];
 await page.route("**/api/ai/config",r=>r.fulfill({json:{tasks:Object.fromEntries(["JOB_ANALYSIS","DOCUMENT_EXTRACTION","PROFILE_SUMMARY","PERSONAL_MATCH","CV_TAILORING"].map(k=>[k,groq])),documents:original,documentExcerpt:original,matching:original,job:original,options:{documents:options,documentExcerpt:options,matching:options,job:options}}}));
 let calls=0;
 const source="Vi søker en utvikler. Du må ha erfaring med Kotlin og databaser.";
 await page.route("**/api/jobs/requirements",r=>{
  calls++;expect(r.request().postDataJSON()).toEqual({text:source,locale:"nb",aiApproval:alternative.token});
  return r.fulfill({json:{facts:[],requirements:[{label:"Kotlin",kind:"REQUIRED",quote:"Du må ha erfaring med Kotlin og databaser."}],aiSelection:openai}});
 });
 await page.goto("/jobs/analyze");
 await page.getByRole("button",{name:"Lim inn tekst",exact:true}).click();
 const choice=page.locator('.ai-choice[data-choice-area="job"]');
 await choice.locator("summary").click();
 await choice.getByRole("button",{name:/OpenAI · gpt-5.4-mini/}).click();
 expect(calls).toBe(0);
 await page.getByRole("textbox",{name:"Stillingsannonse"}).fill(source);
 await page.getByRole("button",{name:"Analyser",exact:true}).click();
 await expect(page.locator(".ai-identity").filter({hasText:"Brukt i analysen"})).toContainText("OpenAI · gpt-5.4-mini");
 await expect(page.getByRole("heading",{name:"Kotlin",exact:true})).toBeVisible();
 expect(calls).toBe(1);
});
