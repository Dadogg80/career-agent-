import {expect,test,type Page} from "@playwright/test";
const jobId="52345678-1234-1234-1234-123456789abc",claimId="62345678-1234-1234-1234-123456789abc",documentId="72345678-1234-1234-1234-123456789abc",matchId="82345678-1234-1234-1234-123456789abc",time="2026-10-07T00:00:00Z";
const cv="Fictional engineer\n\nBuilt Kotlin APIs for a fictional employer and improved service reliability.";
const claim={id:claimId,skill:"Kotlin",statement:cv.split("\n\n")[1],context:"Fictional employer",sourceNote:"Own statement",status:"CONFIRMED",revision:2,createdAt:time,updatedAt:time};
const job={id:jobId,content:{title:"Fictional Kotlin developer",sourceUrl:null,sourceType:"PASTED_TEXT",text:"Kotlin experience is required for this fictional backend role.",locale:"nb",requirements:[{label:"Kotlin",kind:"REQUIRED",quote:"Kotlin experience is required"}],facts:[],omittedItems:0,retrievedAt:null},createdAt:time};
const match={id:matchId,locale:"nb",createdAt:time,assessments:[{requirementIndex:0,classification:"STRONG",reason:"The confirmed API contribution is relevant.",evidence:[{claimId,quote:claim.statement}],question:""}],claims:[{id:claimId,revision:2,skill:claim.skill,statement:claim.statement,context:claim.context}],omittedItems:0,inputCharacters:180,stale:false,automaticEvidence:true,provider:"Gemini",model:"gemini-3.5-flash-lite"};
const doc={id:documentId,originalName:"fictional-master.txt",mediaType:"text/plain",byteSize:cv.length,sha256:"a".repeat(64),language:"nb",isMaster:true,createdAt:time,textCharacters:cv.length};
const gemini={provider:"Gemini",model:"gemini-3.5-flash-lite"},groq={provider:"Groq",model:"openai/gpt-oss-20b"};
const approval={token:"a".repeat(64),selections:[gemini]},other={token:"b".repeat(64),selections:[groq]},options=[{approval,available:true},{approval:other,available:true}];
const result={documentId,matchId,...gemini,proposals:[{paragraphIndex:1,oldText:claim.statement,newText:"Developed Kotlin APIs with responsibility for service reliability.",reason:"Makes the supported API contribution visible for the role.",claimIds:[claimId],requirementIndexes:[0]}],omittedItems:0};
async function fixtures(page:Page,{missing=false,stale=false}={}) {
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/ai/config",r=>r.fulfill({json:{tasks:{JOB_ANALYSIS:gemini,DOCUMENT_EXTRACTION:gemini,PROFILE_SUMMARY:gemini,PERSONAL_MATCH:gemini},documents:approval,documentExcerpt:approval,matching:approval,job:approval,tailoring:approval,options:{documents:options,documentExcerpt:options,matching:options,job:options,tailoring:options}}}));
 await page.route("**/api/profile/me/documents",r=>r.fulfill({json:missing?[]:[doc]}));
 await page.route(`**/api/profile/me/documents/${documentId}`,r=>r.fulfill({json:{document:doc,text:cv}}));
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:missing?[]:[claim]}));
 await page.route(`**/api/profile/me/jobs/${jobId}/match`,r=>r.fulfill({json:missing?null:{...match,stale}}));
 await page.route(`**/api/profile/me/jobs/${jobId}`,r=>r.fulfill({json:job}));
 await page.route("**/api/profile/me/jobs",r=>r.fulfill({json:[job]}));
}
test("saved job opens contextual preparation with whole source consent and editable pending review",async({page})=>{
 await fixtures(page);let calls=0;const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{calls++;expect(r.request().postDataJSON()).toEqual({documentId,text:cv,matchId,locale:"nb",consent:true,aiApproval:approval.token});expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");return r.fulfill({json:result});});
 await page.goto("/jobs/saved");await page.locator(".saved-job-card").getByRole("link",{name:"Søk på stillingen",exact:true}).click();
 await expect(page).toHaveURL(new RegExp(`/jobs/${jobId}/apply$`));await expect(page.locator(".preparation-readiness")).toContainText("100%");
 await expect(page.getByLabel("Velg CV som utgangspunkt")).toHaveValue(documentId);
 await page.getByRole("button",{name:"Slik fungerer det",exact:true}).click();await expect(page.locator(".preparation-guide")).toContainText("perioder");
 const submit=page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true});await expect(submit).toBeDisabled();expect(calls).toBe(0);
 await page.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for CV-forslag",exact:true}).check();await submit.click();
 const article=page.locator(".tailoring-proposal");await expect(article).toContainText(claim.statement);
 await article.getByText("Se krav og kompetansegrunnlag",{exact:true}).click();await expect(article).toContainText("Fictional employer");
 await article.getByLabel("Forslag – kan redigeres",{exact:true}).fill("Utviklet Kotlin-API-er for en fiktiv arbeidsgiver.");
 await article.getByRole("button",{name:"Godkjenn teksten",exact:true}).click();await expect(article).toHaveCount(0);
 await page.getByRole("button",{name:"Behandlet · 1",exact:true}).click();await expect(article).toContainText("Godkjent tekst");
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"/tmp/career-preparation-mobile.png",fullPage:true});
 expect(calls).toBe(1);expect(errors).toEqual([]);
 await page.reload();await expect(page.locator(".tailoring-proposal")).toHaveCount(0);expect(calls).toBe(1);
});
test("missing evidence and stale matching guide the user without calling tailoring",async({page})=>{
 await fixtures(page,{missing:true});let calls=0;await page.route("**/tailoring",r=>{calls++;return r.fulfill({status:503});});
 await page.goto(`/jobs/${jobId}/apply`);await expect(page.getByRole("heading",{name:"Start med dokumentene dine",exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true})).toBeDisabled();expect(calls).toBe(0);
 await fixtures(page,{stale:true});await page.reload();await expect(page.locator(".preparation-readiness")).toContainText("oppdater vurderingen");await expect(page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true})).toBeDisabled();expect(calls).toBe(0);
});
test("quota retains proposals and changing recipient requires renewed consent without carrying cooldown",async({page})=>{
 await fixtures(page);let calls=0;await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{calls++;return calls===2?r.fulfill({status:429,headers:{"Retry-After":"968"},json:{code:"AI_RATE_LIMITED"}}):r.fulfill({json:result});});
 await page.goto(`/jobs/${jobId}/apply`);const submit=page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true});const consent=page.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for CV-forslag",exact:true});
 await consent.check();await submit.click();await expect(page.locator(".tailoring-proposal")).toHaveCount(1);
 await consent.check();await submit.click();await expect(page.locator(".ai-activity")).toContainText("16 min");await expect(page.locator(".tailoring-proposal")).toHaveCount(1);await expect(submit).toBeDisabled();
 await page.locator(".ai-choice summary").last().click();await page.getByRole("button",{name:/Groq · openai\/gpt-oss-20b/}).last().click();
 const nextConsent=page.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Groq for CV-forslag",exact:true});await expect(nextConsent).not.toBeChecked();await expect(submit).toBeDisabled();await nextConsent.check();await expect(submit).toBeEnabled();expect(calls).toBe(2);
 await expect(page.locator(".tailoring-proposal").getByRole("button",{name:"Godkjenn teksten"})).toBeDisabled();
});
test("literal segmentation handles a whole long CV and rejects malformed metadata",async()=>{
 const {tailoringPassages,isTailoringResult}=await import("../lib/cv-tailoring");const source="start "+"Full literal source. ".repeat(2800)+" end";
 expect(tailoringPassages(source).join("")).toBe(source);const unicode="a".repeat(3999)+"😀"+"b".repeat(100);expect(tailoringPassages(unicode).join("")).toBe(unicode);expect(tailoringPassages(unicode)[0]).toHaveLength(3999);expect(tailoringPassages(source).every(s=>s.length<=4000)).toBe(true);expect(isTailoringResult(result)).toBe(true);expect(isTailoringResult({...result,documentId:undefined})).toBe(false);
});
test("tailoring proxy rejects anonymous spoofed consent owner injection and foreign origins",async({request})=>{
 const input={documentId,text:cv,matchId,locale:"nb",consent:true,aiApproval:approval.token},path=`/api/profile/me/jobs/${jobId}/tailoring`;
 expect((await request.post(path,{data:input})).status()).toBe(403);
 expect((await request.post(path,{data:{...input,consent:false}})).status()).toBe(400);
 expect((await request.post(path,{data:{...input,ownerId:claimId}})).status()).toBe(400);
 expect((await request.post(path,{data:input,headers:{Origin:"https://unrelated.example"}})).status()).toBe(403);
});

test("English preparation remains usable on mobile and rejects unsupported response references",async({page})=>{
 await fixtures(page);let calls=0;await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{calls++;return r.fulfill({json:{...result,proposals:[{...result.proposals[0],claimIds:[documentId]}]}});});
 await page.setViewportSize({width:390,height:844});await page.goto(`/jobs/${jobId}/apply`);
 await page.getByRole("combobox",{name:"Språk",exact:true}).selectOption("en");
 await expect(page.getByRole("heading",{name:"Tailor your CV wording",exact:true})).toBeVisible();
 const consent=page.getByRole("checkbox",{name:"I approve sending this evidence to Gemini for CV suggestions",exact:true});await consent.check();await page.getByRole("button",{name:"Suggest targeted CV wording",exact:true}).click();
 await expect(page.getByText("AI suggestions could not complete now. Evidence and earlier proposals are retained. Retry or select another available model with renewed approval.",{exact:true})).toBeVisible();
 await expect(page.locator(".tailoring-proposal")).toHaveCount(0);expect(calls).toBe(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test("application priorities distinguish direct transferable and formal evidence with sources and no new AI call",async({page})=>{
 await fixtures(page);let calls=0;
 const criteria=[{label:"Kotlin APIs",kind:"REQUIRED",quote:"Kotlin API delivery is required."},{label:"React Native",kind:"REQUIRED",quote:"React Native mobile delivery is required."},{label:"Azure certification",kind:"REQUIRED",quote:"An Azure Solutions Architect certification is required."}];
 const assessed={...match,assessments:[{...match.assessments[0],evidenceRelation:"DIRECT",requirementNature:"PRACTICAL"},{requirementIndex:1,classification:"PARTIAL",reason:"Web UI experience is related; mobile delivery is not documented.",evidence:[{claimId,quote:claim.statement}],question:"Have you delivered mobile apps?",evidenceRelation:"TRANSFERABLE",requirementNature:"PRACTICAL"},{requirementIndex:2,classification:"CLARIFY",reason:"The required certification is not documented, not a proven gap.",evidence:[],question:"Do you hold this certification?",evidenceRelation:"UNKNOWN",requirementNature:"FORMAL"}]};
 await page.route(`**/api/profile/me/jobs/${jobId}`,r=>r.fulfill({json:{...job,content:{...job.content,requirements:criteria,text:criteria.map(c=>c.quote).join("\n")}}}));
 await page.route("**/api/profile/me/jobs",r=>r.fulfill({json:[{...job,content:{...job.content,requirements:criteria}}]}));
 await page.route(`**/api/profile/me/jobs/${jobId}/match`,r=>{if(r.request().method()==="POST")calls++;return r.fulfill({json:assessed});});
 await page.goto("/jobs/saved");await expect(page.locator(".saved-job-match")).toContainText("50%");await expect(page.locator(".saved-job-match")).toContainText("1 kvalifikasjonskrav til kontroll");
 await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();const sheet=page.getByRole("dialog");
 for(const label of ["Kotlin APIs","React Native","Azure certification"])await sheet.locator(".match-assessment summary").filter({hasText:label}).click();
 await expect(sheet.locator(".match-evidence-tags")).toContainText(["Direkte erfaring","Overførbar erfaring","AI: formelt kvalifikasjonskrav"]);
 await sheet.getByRole("button",{name:"Om relevans og kvalifikasjoner",exact:true}).first().click();await expect(page.getByRole("tooltip")).toContainText("ikke automatisk tilsvarende");await page.keyboard.press("Escape");await expect(sheet).toBeVisible();
 await sheet.getByRole("button",{name:"Lukk",exact:true}).click();
 await page.locator(".saved-job-card").getByRole("link",{name:"Søk på stillingen",exact:true}).click();
 const guide=page.getByRole("region",{name:"Prioriteringer fra stillingsmatchen",exact:true});await expect(guide).toBeVisible();
 for(const label of ["Fremhev dokumenterte eksempler","Forklar overførbar erfaring","Kontroller kvalifikasjonskrav"])await guide.locator("summary").filter({hasText:label}).click();
 await expect(guide).toContainText("Fictional employer");await expect(guide).toContainText("mobile delivery is not documented");await expect(guide).toContainText(criteria[2].quote);
 await guide.getByRole("button",{name:"Om søknadsprioriteringene",exact:true}).click();await expect(page.getByRole("tooltip")).toContainText("allerede er synlig i CV-en");await page.keyboard.press("Escape");
 await page.screenshot({path:"/tmp/career-relations-preparation-desktop.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"/tmp/career-relations-preparation-mobile.png",fullPage:true});
 await page.getByRole("combobox",{name:"Språk",exact:true}).selectOption("en");await expect(page.getByRole("region",{name:"Priorities from your job match",exact:true})).toContainText("Review qualification requirements");expect(calls).toBe(0);
 await page.route(`**/api/profile/me/jobs/${jobId}/match`,r=>r.fulfill({json:{...assessed,stale:true}}));await page.reload();await expect(page.locator(".match-application-focus")).toContainText("earlier assessment");expect(calls).toBe(0);
});

test("relation validation preserves legacy results and never gives full coverage to transferable or unknown claims",async()=>{
 const {isPersonalMatch}=await import("../lib/personal-match");const {matchInsights,relationLabel}=await import("../lib/match-insights");
 const direct={...match,assessments:[{...match.assessments[0],evidenceRelation:"DIRECT" as const,requirementNature:"FORMAL" as const}]};
 expect(isPersonalMatch(match)).toBe(true);expect(isPersonalMatch(direct)).toBe(true);expect(matchInsights(direct as import("../lib/personal-match").PersonalMatch,job.content as import("../lib/saved-jobs").SavedJobContent).formal).toHaveLength(0);
 for(const evidenceRelation of ["TRANSFERABLE","UNKNOWN","EQUIVALENT"])expect(isPersonalMatch({...direct,assessments:[{...direct.assessments[0],evidenceRelation}]})).toBe(false);
 expect(isPersonalMatch({...direct,assessments:[{...direct.assessments[0],evidenceRelation:"TRANSFERABLE",classification:"PARTIAL"}]})).toBe(false);
 expect(relationLabel({...direct.assessments[0],evaluated:false} as import("../lib/personal-match").MatchAssessment,true)).toBeNull();
});
