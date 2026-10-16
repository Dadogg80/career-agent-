import { expect, test } from "@playwright/test";
import { syntheticStructuredConfiguration } from "./helpers/mock-ai-configuration";

// UI transport fixture only. Provider-quality experiments run manually outside this suite.
for (const model of ["gpt-5.4-mini","gpt-5.4","gpt-6.1-sol","gpt-6-luna"]) {
test(`${model} selection binds approval and actual identity with the complete catalog`,async({page})=>{
 const configuration=syntheticStructuredConfiguration();
 const alternative=configuration.options!.job!.find(option=>option.approval.selections[0].model===model)!.approval;
 const openai=alternative.selections[0];
 await page.route("**/api/ai/config",r=>r.fulfill({json:configuration}));
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
 await choice.getByRole("button",{name:new RegExp(`^OpenAI · ${model} `)}).click();
 expect(calls).toBe(0);
 await page.getByRole("textbox",{name:"Stillingsannonse"}).fill(source);
 await page.getByRole("button",{name:"Analyser",exact:true}).click();
 await expect(page.locator(".ai-identity").filter({hasText:"Brukt i analysen"})).toContainText(`OpenAI · ${model}`);
 await expect(page.getByRole("heading",{name:"Kotlin",exact:true})).toBeVisible();
 expect(calls).toBe(1);
});

}
