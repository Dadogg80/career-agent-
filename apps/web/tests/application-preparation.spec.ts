import {expect,test,type Page} from "@playwright/test";
import {tailoringPassages,isTailoringResult,reviewedCvText} from "../lib/cv-tailoring";
import {isPersonalMatch} from "../lib/personal-match";
import {matchInsights,relationLabel} from "../lib/match-insights";
const jobId="52345678-1234-1234-1234-123456789abc",claimId="62345678-1234-1234-1234-123456789abc",documentId="72345678-1234-1234-1234-123456789abc",matchId="82345678-1234-1234-1234-123456789abc",time="2026-10-07T00:00:00Z";
const cv="Fictional engineer\n\nBuilt Kotlin APIs for a fictional employer and improved service reliability.";
const claim={id:claimId,skill:"Kotlin",statement:cv.split("\n\n")[1],context:"Fictional employer",sourceNote:"Own statement",status:"CONFIRMED",revision:2,createdAt:time,updatedAt:time};
const job={id:jobId,content:{title:"Fictional Kotlin developer",sourceUrl:null,sourceType:"PASTED_TEXT",text:"Kotlin experience is required for this fictional backend role.",locale:"nb",requirements:[{label:"Kotlin",kind:"REQUIRED",quote:"Kotlin experience is required"}],facts:[],omittedItems:0,retrievedAt:null},createdAt:time};
const match={id:matchId,locale:"nb",createdAt:time,assessments:[{requirementIndex:0,classification:"STRONG",reason:"The confirmed API contribution is relevant.",evidence:[{claimId,quote:claim.statement}],question:""}],claims:[{id:claimId,revision:2,skill:claim.skill,statement:claim.statement,context:claim.context}],omittedItems:0,inputCharacters:180,stale:false,automaticEvidence:true,provider:"Gemini",model:"gemini-3.5-flash-lite"};
const doc={id:documentId,originalName:"fictional-master.txt",mediaType:"text/plain",byteSize:cv.length,sha256:"a".repeat(64),language:"nb",isMaster:true,createdAt:time,textCharacters:cv.length};
const gemini={provider:"Gemini",model:"gemini-3.5-flash-lite"},groq={provider:"Groq",model:"openai/gpt-oss-20b"};
const approval={token:"a".repeat(64),selections:[gemini]},other={token:"b".repeat(64),selections:[groq]},options=[{approval,available:true},{approval:other,available:true}];
const result={documentId,matchId,...gemini,proposals:[{paragraphIndex:1,oldText:claim.statement,newText:"Developed Kotlin APIs with responsibility for service reliability.",reason:"Makes the supported API contribution visible for the role.",claimIds:[claimId],requirementIndexes:[0]}],omittedItems:0};
const visibility=[{requirementIndex:0,status:"VISIBLE",reason:"The CV describes the confirmed Kotlin API contribution.",claimIds:[claimId],passages:[{paragraphIndex:1,quote:"Built Kotlin APIs"}]}];
async function fixtures(page:Page,{missing=false,stale=false}={}) {
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring/session`,r=>r.fulfill({json:null}));
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
 await fixtures(page,{stale:true});await page.reload();await expect(page.locator(".preparation-readiness")).toContainText("oppdater vurderingen");
 const consent=page.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for CV-forslag",exact:true});
 await expect(consent).toBeDisabled();await expect(consent).toHaveAttribute("aria-describedby","preparation-blockers");
 await expect(page.locator("#preparation-blockers")).toContainText("Stillingsmatchen er utdatert");
 await page.getByRole("button",{name:"Oppdater stillingsmatchen",exact:true}).click();await expect(page.locator("#preparation-match")).toHaveAttribute("open","");
 await expect(page.locator("#preparation-match summary").first()).toBeFocused();
 await expect(page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true})).toBeDisabled();expect(calls).toBe(0);
 await fixtures(page);await page.reload();await expect(consent).toBeEnabled();await expect(consent).not.toBeChecked();await expect(page.locator("#preparation-blockers")).toHaveCount(0);expect(calls).toBe(0);
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
 const source="start "+"Full literal source. ".repeat(2800)+" end";
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
 const direct={...match,assessments:[{...match.assessments[0],evidenceRelation:"DIRECT" as const,requirementNature:"FORMAL" as const}]};
 expect(isPersonalMatch(match)).toBe(true);expect(isPersonalMatch(direct)).toBe(true);expect(matchInsights(direct as import("../lib/personal-match").PersonalMatch,job.content as import("../lib/saved-jobs").SavedJobContent).formal).toHaveLength(0);
 for(const evidenceRelation of ["TRANSFERABLE","UNKNOWN","EQUIVALENT"])expect(isPersonalMatch({...direct,assessments:[{...direct.assessments[0],evidenceRelation}]})).toBe(false);
 expect(isPersonalMatch({...direct,assessments:[{...direct.assessments[0],evidenceRelation:"TRANSFERABLE",classification:"PARTIAL"}]})).toBe(false);
 expect(relationLabel({...direct.assessments[0],evaluated:false} as import("../lib/personal-match").MatchAssessment,true)).toBeNull();
});

test("CV visibility shares one approved call with wording and exposes literal sources on desktop and mobile",async({page})=>{
 await fixtures(page);let calls=0;await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{calls++;return r.fulfill({json:{...result,visibility}});});
 await page.goto(`/jobs/${jobId}/apply`);await page.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for CV-forslag",exact:true}).check();await page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true}).click();
 const review=page.locator(".cv-visibility-review");await expect(review.getByRole("heading",{name:"Hva viser CV-en din?"})).toBeVisible();await expect(review.locator(".cv-visibility-item")).toHaveCount(1);
 await review.locator("summary").click();await expect(review.locator("blockquote")).toHaveText("Built Kotlin APIs");await expect(review.locator(".cv-visibility-evidence")).toContainText("Fictional employer");
 await review.getByRole("button",{name:"Om synlighet i CV-en",exact:true}).click();await expect(page.getByRole("tooltip")).toContainText("ikke manglende kompetanse");await page.keyboard.press("Escape");
 await review.getByRole("button",{name:/Ikke vurdert/}).click();await expect(review.locator(".cv-visibility-item")).toHaveCount(0);await review.getByRole("button",{name:/Alle/}).click();
 await review.getByLabel("Søk i CV-vurderingen").fill("nonexistent criterion");await expect(review.locator(".cv-visibility-item")).toHaveCount(0);await review.getByLabel("Søk i CV-vurderingen").fill("Kotlin");await expect(review.locator(".cv-visibility-item")).toHaveCount(1);
 await page.screenshot({path:"/tmp/career-visibility-desktop.png",fullPage:true});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"/tmp/career-visibility-mobile.png",fullPage:true});
 await page.getByRole("combobox",{name:"Språk",exact:true}).selectOption("en");await expect(review).toContainText("earlier CV assessment");await expect(review).toContainText("What does your CV show?");expect(calls).toBe(1);
});

test("invalid CV visibility preserves prior proposals and legacy responses disclose missing review",async({page})=>{
 await fixtures(page);let calls=0;await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{calls++;return r.fulfill({json:calls===1?result:{...result,visibility:[{...visibility[0],passages:[{paragraphIndex:0,quote:"Built Kotlin APIs"}]}]}});});
 await page.goto(`/jobs/${jobId}/apply`);const consent=page.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for CV-forslag",exact:true}),submit=page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true});
 await consent.check();await submit.click();await expect(page.locator(".cv-visibility-review")).toContainText("ingen CV-sammenligning");await expect(page.locator(".tailoring-proposal")).toHaveCount(1);
 await consent.check();await submit.click();await expect(page.locator(".tailoring-proposal")).toHaveCount(1);await expect(page.locator(".cv-visibility-item")).toHaveCount(0);expect(calls).toBe(2);
});

test("CV visibility metadata rejects duplicate indexes and unsupported absence or evidence references",async()=>{
 expect(isTailoringResult({...result,visibility})).toBe(true);
 expect(isTailoringResult({...result,visibility:[...visibility,...visibility]})).toBe(false);
 expect(isTailoringResult({...result,visibility:[{...visibility[0],status:"NOT_VISIBLE"}]})).toBe(false);
 expect(isTailoringResult({...result,visibility:[{...visibility[0],claimIds:[]}]})).toBe(false);
 expect(isTailoringResult({...result,visibility:[{...visibility[0],requirementIndex:128}]})).toBe(false);
});

test("reviewed CV handoff copies only approved edits and blocks stale wording without new provider calls",async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async(text:string)=>{(window as unknown as {copiedCv:string}).copiedCv=text;}}}));
 await fixtures(page);let calls=0;await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{calls++;return r.fulfill({json:result});});
 await page.goto(`/jobs/${jobId}/apply`);await page.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for CV-forslag",exact:true}).check();await page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true}).click();
 const handoff=page.locator(".reviewed-cv-text"),article=page.locator(".tailoring-proposal");await expect(handoff.getByRole("button",{name:"Kopier CV-teksten",exact:true})).toBeDisabled();await handoff.locator("summary").click();await expect(handoff.getByLabel("CV-tekst med godkjente endringer")).toHaveValue(cv);
 const edited="Utviklet Kotlin-API-er for en fiktiv arbeidsgiver.";await article.getByLabel("Forslag – kan redigeres",{exact:true}).fill(edited);await article.getByRole("button",{name:"Godkjenn teksten",exact:true}).click();
 const expected=cv.replace(claim.statement,edited);await expect(handoff.getByLabel("CV-tekst med godkjente endringer")).toHaveValue(expected);await handoff.getByRole("button",{name:"Kopier CV-teksten",exact:true}).click();await expect(handoff.getByRole("status")).toContainText("CV-teksten er kopiert");expect(await page.evaluate(()=>(window as unknown as {copiedCv:string}).copiedCv)).toBe(expected);
 await page.getByRole("button",{name:"Behandlet · 1",exact:true}).click();await article.getByLabel("Forslag – kan redigeres",{exact:true}).fill("Et nytt, ubekreftet tekstvalg.");await expect(handoff.getByLabel("CV-tekst med godkjente endringer")).toHaveValue(cv);await expect(handoff.getByRole("button",{name:"Kopier CV-teksten",exact:true})).toBeDisabled();
 await page.getByRole("button",{name:"Til gjennomgang · 1",exact:true}).click();await article.getByRole("button",{name:"Godkjenn teksten",exact:true}).click();await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await handoff.screenshot({path:"/tmp/career-reviewed-cv-mobile.png"});
 await page.getByRole("combobox",{name:"Språk",exact:true}).selectOption("en");await expect(handoff).toContainText("Evidence or selections changed");await expect(handoff.getByRole("button",{name:"Copy CV text",exact:true})).toBeDisabled();expect(calls).toBe(1);
});

test("clipboard denial retains a selectable preview and rejection restores the original",async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,"clipboard",{value:{writeText:async()=>{throw new Error("Permission denied");}}}));await fixtures(page);await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>r.fulfill({json:result}));
 await page.goto(`/jobs/${jobId}/apply`);await page.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for CV-forslag",exact:true}).check();await page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true}).click();await page.locator(".tailoring-proposal").getByRole("button",{name:"Godkjenn teksten",exact:true}).click();
 const handoff=page.locator(".reviewed-cv-text");await handoff.getByRole("button",{name:"Kopier CV-teksten",exact:true}).click();await expect(handoff.getByRole("status")).toContainText("kopier teksten manuelt");await handoff.locator("summary").click();await expect(handoff.getByLabel("CV-tekst med godkjente endringer")).toHaveValue(cv.replace(claim.statement,result.proposals[0].newText));
 await page.getByRole("button",{name:"Behandlet · 1",exact:true}).click();await page.locator(".tailoring-proposal").getByRole("button",{name:"Avvis forslaget",exact:true}).click();await expect(handoff.getByLabel("CV-tekst med godkjente endringer")).toHaveValue(cv);await expect(handoff.getByRole("button",{name:"Kopier CV-teksten",exact:true})).toBeDisabled();
});

test("reviewed substitutions preserve repeated passages whitespace untouched history and long-source boundaries",async()=>{
 const source="Contact details\n \nRepeated contribution\n\nRepeated contribution\n\n2021–2023: Historical title\n\n";
 expect(reviewedCvText(source,[])).toBe(source);expect(reviewedCvText(source,[{paragraphIndex:2,oldText:"Repeated contribution",text:"Approved second contribution"}])).toBe(source.replace("Repeated contribution\n\n2021","Approved second contribution\n\n2021"));
 expect(reviewedCvText(source,[{paragraphIndex:1,oldText:"Wrong original",text:"Changed"}])).toBeNull();const change={paragraphIndex:1,oldText:"Repeated contribution",text:"Changed"};expect(reviewedCvText(source,[change,change])).toBeNull();
 const long="a".repeat(3999)+"😀"+"b".repeat(4100);const parts=tailoringPassages(long);expect(reviewedCvText(long,[{paragraphIndex:1,oldText:parts[1],text:"Reviewed section"}])).toBe(parts[0]+"Reviewed section"+parts[2]);
});

test("without a master CV preparation does not silently select a certificate and changing CV clears consent",async({page})=>{
 await fixtures(page);let sourceReads=0,calls=0;
 const certificate={...doc,id:"92345678-1234-1234-1234-123456789abc",originalName:"course-certificate.txt",isMaster:false};
 await page.route("**/api/profile/me/documents",r=>r.fulfill({json:[certificate,{...doc,isMaster:false}]}));
 await page.route(`**/api/profile/me/documents/${documentId}`,r=>{sourceReads++;return r.fulfill({json:{document:{...doc,isMaster:false},text:cv}});});
 await page.route(`**/api/profile/me/documents/${certificate.id}`,r=>{sourceReads++;return r.fulfill({json:{document:certificate,text:"Course certificate. This is not the user's CV."}});});
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{calls++;return r.fulfill({status:503,json:{code:"UNAVAILABLE"}});});
 await page.goto(`/jobs/${jobId}/apply`);
 const select=page.getByLabel("Velg CV som utgangspunkt"),submit=page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true});
 const consent=page.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for CV-forslag",exact:true});
 await expect(select).toHaveValue("");await expect(page.getByText("Velg en CV for å fortsette",{exact:false})).toBeVisible();
 await expect(consent).toBeDisabled();await expect(submit).toBeDisabled();expect(sourceReads).toBe(0);
 await page.screenshot({path:"/tmp/career-base-cv-choice.png",fullPage:true});
 await select.selectOption(documentId);await expect(consent).toBeEnabled();await consent.check();await expect(submit).toBeEnabled();
 await select.selectOption("");await expect(consent).not.toBeChecked();await expect(submit).toBeDisabled();
 expect(sourceReads).toBe(1);expect(calls).toBe(0);
});

test("short CV extraction explains rereading instead of leaving an unexplained disabled action",async({page})=>{
 await fixtures(page);let calls=0;
 await page.route(`**/api/profile/me/documents/${documentId}`,r=>r.fulfill({json:{document:{...doc,textCharacters:3},text:"CV "}}));
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{calls++;return r.fulfill({status:503});});
 await page.goto(`/jobs/${jobId}/apply`);
 await page.setViewportSize({width:390,height:844});
 await expect(page.getByText("Det ble hentet for lite tekst",{exact:false})).toBeVisible();
 await expect(page.getByRole("link",{name:"Åpne dokumentene mine",exact:true})).toHaveAttribute("href","/career/profile");
 await expect(page.getByRole("button",{name:"Foreslå tilspisset CV-tekst",exact:true})).toBeDisabled();
 expect(calls).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole("combobox",{name:"Språk"}).selectOption("en");
 await expect(page.getByText("Too little text was extracted",{exact:false})).toBeVisible();
 await expect(page.getByRole("link",{name:"Open my documents",exact:true})).toHaveAttribute("href","/career/profile");
 await page.screenshot({path:"/tmp/career-short-cv-mobile.png",fullPage:true});
});

test("saved wording review reopens without AI and retains edits after failed approval",async({page})=>{
 await fixtures(page);
 const sessionId="55555555-5555-4555-8555-555555555555";
 let stored={id:sessionId,jobId,revision:1,createdAt:time,stale:false,snapshot:{result:{...result,sessionId},text:cv,claims:match.claims,quotes:job.content.requirements.map(r=>r.quote),locale:"nb",promptVersion:"cv-wording-v1"},reviews:[] as {paragraphIndex:number;text:string;decision:string}[]};
 let fail=true,aiCalls=0,writes=0;
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{aiCalls++;return r.fulfill({json:result});});
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring/session`,r=>{
  if(r.request().method()==="GET")return r.fulfill({json:stored});
  writes++;if(fail)return r.fulfill({status:503,json:{code:"CV_UNAVAILABLE"}});
  const body=r.request().postDataJSON();expect(body.revision).toBe(stored.revision);expect(body.sessionId).toBe(sessionId);
  stored={...stored,revision:stored.revision+1,reviews:body.reviews};return r.fulfill({json:stored});
 });
 await page.goto(`/jobs/${jobId}/apply`);
 const proposal=page.locator(".tailoring-proposal"),editor=proposal.getByRole("textbox");
 await expect(proposal).toHaveCount(1);await page.setViewportSize({width:390,height:844});await expect(proposal.getByRole("button",{name:"Godkjenn teksten"})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await proposal.screenshot({path:"/tmp/career-cv-review-mobile.png"});await editor.fill("Built and maintained Kotlin APIs for Example AS.");
 await proposal.getByRole("button",{name:"Godkjenn teksten"}).click();
 await expect(page.getByText("Valget kunne ikke lagres. Teksten er beholdt; prøv lagringen igjen.")).toBeVisible();
 await expect(editor).toHaveValue("Built and maintained Kotlin APIs for Example AS.");
 await expect(page.getByRole("button",{name:"Til gjennomgang · 1",exact:true})).toBeVisible();
 fail=false;await proposal.getByRole("button",{name:"Godkjenn teksten"}).click();
 await expect(page.getByRole("button",{name:"Til gjennomgang · 0",exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole("button",{name:"Behandlet · 1",exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Behandlet · 1",exact:true}).click();await expect(editor).toHaveValue(stored.reviews[0].text);
 await editor.fill("Built Kotlin APIs for Example AS.");await page.getByRole("button",{name:"Lagre tekstutkast",exact:true}).click();
 await expect(page.getByText("Arbeidet er lagret. Du kan lukke siden og fortsette senere.")).toBeVisible();
 await page.reload();await expect(page.getByRole("button",{name:"Til gjennomgang · 1",exact:true})).toBeVisible();
 await proposal.getByRole("button",{name:"Avvis forslaget"}).click();await expect(page.getByRole("button",{name:"Til gjennomgang · 0",exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole("button",{name:"Behandlet · 1",exact:true})).toBeVisible();
 expect(stored.reviews[0].decision).toBe("REJECTED");expect(aiCalls).toBe(0);expect(writes).toBe(4);
});

test("stale saved CV remains readable but cannot approve or copy and recovery detects concurrent review",async({page})=>{
 await fixtures(page);const sessionId="55555555-5555-4555-8555-555555555555";
 let stored={id:sessionId,jobId,revision:1,createdAt:time,stale:false,snapshot:{result:{...result,sessionId},text:cv,claims:match.claims,quotes:job.content.requirements.map(r=>r.quote),locale:"nb",promptVersion:"cv-wording-v1"},reviews:[] as {paragraphIndex:number;text:string;decision:string}[]};
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring/session`,r=>r.request().method()==="GET"?r.fulfill({json:stored}):r.fulfill({status:409,json:{code:"CV_CONFLICT"}}));
 await page.goto(`/jobs/${jobId}/apply`);const proposal=page.locator(".tailoring-proposal");
 await expect(proposal.getByRole("button",{name:"Godkjenn teksten"})).toBeEnabled();
 await proposal.getByRole("button",{name:"Godkjenn teksten"}).click();
 await expect(page.getByText("Arbeidsøkten eller grunnlaget er endret. Teksten din beholdes her. Hent lagret arbeid før du fortsetter.")).toBeVisible();
 await expect(proposal.getByRole("button",{name:"Godkjenn teksten"})).toBeDisabled();
 stored={...stored,revision:2,stale:true,reviews:[{paragraphIndex:1,text:result.proposals[0].newText,decision:"ACCEPTED"}]};
 await page.getByRole("button",{name:"Hent lagret arbeid – erstatt lokale utkast"}).click();
 await page.getByRole("button",{name:"Behandlet · 1",exact:true}).click();
 await expect(proposal.getByRole("button",{name:"Godkjenn teksten"})).toBeDisabled();
 await expect(page.getByRole("button",{name:"Kopier CV-teksten",exact:true})).toBeDisabled();
 await expect(proposal.getByRole("textbox")).toHaveValue(result.proposals[0].newText);
});

test("new generated wording gets a durable session and session proxies reject spoofed review requests",async({page,request})=>{
 await fixtures(page);const sessionId="55555555-5555-4555-8555-555555555555";
 const stored={id:sessionId,jobId,revision:1,createdAt:time,stale:false,snapshot:{result:{...result,sessionId},text:cv,claims:match.claims,quotes:job.content.requirements.map(r=>r.quote),locale:"nb",promptVersion:"cv-wording-v1"},reviews:[]};
 let generated=false,calls=0;
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring/session`,r=>r.fulfill({json:generated?stored:null}));
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{calls++;generated=true;return r.fulfill({json:stored.snapshot.result});});
 await page.goto(`/jobs/${jobId}/apply`);await page.locator(".ai-consent input").check();await page.getByRole("button",{name:"Foreslå tilspisset CV-tekst"}).click();
 await expect(page.getByText("Arbeidet er lagret. Du kan lukke siden og fortsette senere.")).toBeVisible();
 await page.reload();await expect(page.locator(".tailoring-proposal")).toHaveCount(1);expect(calls).toBe(1);
 const path=`/api/profile/me/jobs/${jobId}/tailoring/session`;
 expect((await request.get(path,{headers:{Origin:"https://foreign.example.test"}})).status()).toBe(403);
 expect((await request.get(path)).status()).toBe(401);
 expect((await request.put(path,{data:{sessionId,revision:1,reviews:[],ownerId:claimId}})).status()).toBe(400);
 expect((await request.put(path,{data:{sessionId,revision:1,reviews:[{paragraphIndex:1,text:" ",decision:"ACCEPTED"}]}})).status()).toBe(400);
 expect((await request.put(path,{data:{sessionId,revision:1,reviews:[]}})).status()).toBe(403);
});

test("source sections expose explicit keep and unfinished plans with filtered proposals on mobile and after reload",async({page})=>{
 await fixtures(page);const sessionId="55555555-5555-4555-8555-555555555555";
 const source="Profil\nSenior developer with API experience.\n\nKjernekompetanse\nKotlin APIs.\n\nUtdanning\nCourse documentation needs review.";
 const paragraphs=tailoringPassages(source);
 const sections=[{id:"cv-1234567890abcdef-0",kind:"PROFILE",heading:"Profil",paragraphIndexes:[0]},{id:"cv-1234567890abcdef-1",kind:"SKILLS",heading:"Kjernekompetanse",paragraphIndexes:[1]},{id:"cv-1234567890abcdef-2",kind:"EDUCATION",heading:"Utdanning",paragraphIndexes:[2]}];
 const plans=sections.map((s,i)=>({sectionId:s.id,action:i===0?"KEEP_UNCHANGED":i===1?"PROPOSE_CHANGES":"NEEDS_REVIEW",priority:i===1?"HIGH":"LOW",reason:i===0?"Profilen er tydelig; behold originalen.":i===1?"Synliggjør dokumentert API-erfaring.":"Ingen gyldig seksjonsvurdering ble mottatt.",claimIds:i===1?[claimId]:[],requirementIndexes:i===1?[0]:[],assessed:i!==2,reviewedParagraphIndexes:i===2?null:s.paragraphIndexes}));
 const structured={...result,sessionId,proposals:[{...result.proposals[0],oldText:paragraphs[1],newText:"Kjernekompetanse\nUtvikling av Kotlin-API-er."}],sections,sectionPlans:plans};
 let stored={id:sessionId,jobId,revision:1,createdAt:time,stale:false,snapshot:{result:structured,text:source,claims:match.claims,quotes:job.content.requirements.map(r=>r.quote),locale:"nb",promptVersion:"cv-section-wording-v3"},reviews:[] as {paragraphIndex:number;text:string;decision:string}[]};
 await page.route(`**/api/profile/me/documents/${documentId}`,r=>r.fulfill({json:{document:doc,text:source}}));
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring/session`,r=>{if(r.request().method()==="PUT")stored={...stored,revision:stored.revision+1,reviews:r.request().postDataJSON().reviews};return r.fulfill({json:stored});});
 await page.setViewportSize({width:390,height:844});await page.goto(`/jobs/${jobId}/apply`);
 const plan=page.locator(".cv-section-review");await expect(plan).toBeVisible();await plan.getByRole("button",{name:/Profil/}).click();
 await expect(plan.getByText("Behold teksten",{exact:true})).toBeVisible();await expect(page.locator(".tailoring-proposal")).toHaveCount(0);
 await plan.getByRole("button",{name:/Kjernekompetanse/}).click();await expect(page.locator(".tailoring-proposal")).toHaveCount(1);
 await expect(plan.getByText("AI-prioritet: Høy")).toBeVisible();await expect(plan.getByText(/AI oppgir gjennomgang av 1\/1/)).toBeVisible();await plan.getByText("Se originaltekst og grunnlag",{exact:true}).click();await expect(plan.locator("pre")).toContainText("Kotlin APIs.");
 await plan.screenshot({path:"/tmp/career-cv-sections-mobile.png"});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await plan.getByRole("button",{name:/Utdanning/}).click();await expect(plan.getByText("Må gjennomgås",{exact:true})).toBeVisible();await expect(plan.getByText(/AI-prioritet/)).toHaveCount(0);
 await plan.getByRole("button",{name:/Kjernekompetanse/}).click();await page.locator(".tailoring-proposal").getByRole("button",{name:"Godkjenn teksten"}).click();
 await expect(page.getByRole("button",{name:"Til gjennomgang · 0",exact:true})).toBeVisible();await expect(plan.getByRole("button",{name:/Kjernekompetanse/})).toHaveAttribute("aria-pressed","true");
 await page.reload();await expect(plan).toBeVisible();await page.getByRole("button",{name:"Behandlet · 1",exact:true}).click();await expect(page.locator(".tailoring-proposal")).toHaveCount(1);
});

test("section metadata rejects missing duplicate and foreign source memberships",async()=>{
 const sections=[{id:"cv-1234567890abcdef-0",kind:"PROFILE",heading:"Profil",paragraphIndexes:[0,1]}];
 const sectionPlans=[{sectionId:sections[0].id,action:"KEEP_UNCHANGED",priority:"LOW",reason:"Reviewed wording",claimIds:[],requirementIndexes:[],assessed:true}];
 expect(isTailoringResult({...result,proposals:[],sections,sectionPlans})).toBe(true);
 expect(isTailoringResult({...result,sections,sectionPlans})).toBe(false);
 expect(isTailoringResult({...result,sections,sectionPlans:[]})).toBe(false);
 expect(isTailoringResult({...result,proposals:[],sections,sectionPlans:[{...sectionPlans[0],reviewedParagraphIndexes:[0]}]})).toBe(false);
 expect(isTailoringResult({...result,sections:[...sections,...sections],sectionPlans})).toBe(false);
 expect(isTailoringResult({...result,sections:[{...sections[0],paragraphIndexes:[1,0]}],sectionPlans})).toBe(false);
 expect(isTailoringResult({...result,sections,sectionPlans:[{...sectionPlans[0],sectionId:"cv-1234567890abcdef-3"}]})).toBe(false);
});

test("unsupported edited quantities retain the editor and can be saved as pending before a supported approval",async({page})=>{
 await fixtures(page);const sessionId="55555555-5555-4555-8555-555555555555";
 let stored={id:sessionId,jobId,revision:1,createdAt:time,stale:false,snapshot:{result:{...result,sessionId},text:cv,claims:match.claims,quotes:job.content.requirements.map(r=>r.quote),locale:"nb",promptVersion:"cv-section-wording-v3"},reviews:[] as {paragraphIndex:number;text:string;decision:string}[]};
 let aiCalls=0;
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{aiCalls++;return r.fulfill({json:result});});
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring/session`,r=>{
  if(r.request().method()==="GET")return r.fulfill({json:stored});
  const body=r.request().postDataJSON();
  if(body.reviews.some((review:{text:string;decision:string})=>review.decision==="ACCEPTED"&&review.text.includes("100")))return r.fulfill({status:400,json:{code:"CV_WORDING_UNSUPPORTED"}});
  stored={...stored,revision:stored.revision+1,reviews:body.reviews};return r.fulfill({json:stored});
 });
 await page.goto(`/jobs/${jobId}/apply`);const proposal=page.locator(".tailoring-proposal"),editor=proposal.getByRole("textbox");
 await editor.fill("Led 100 staff.");await proposal.getByRole("button",{name:"Godkjenn teksten"}).click();
 await expect(page.getByText("Kontroller tall og historiske årstall mot originalen og kompetansegrunnlaget. Teksten er beholdt; du kan lagre den som utkast før videre avklaring.")).toBeVisible();
 await expect(editor).toHaveValue("Led 100 staff.");await expect(page.getByRole("button",{name:"Til gjennomgang · 1",exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Lagre tekstutkast"}).click();await expect(page.getByText("Arbeidet er lagret. Du kan lukke siden og fortsette senere.")).toBeVisible();expect(stored.reviews[0].decision).toBe("PENDING");
 await editor.fill("Developed Kotlin APIs for the fictional employer.");await proposal.getByRole("button",{name:"Godkjenn teksten"}).click();await expect(page.getByRole("button",{name:"Til gjennomgang · 0",exact:true})).toBeVisible();expect(stored.reviews[0].decision).toBe("ACCEPTED");expect(aiCalls).toBe(0);
});

test("saved approved wording becomes a separate readable CV draft without AI or export approval",async({page})=>{
 await fixtures(page);const sessionId="55555555-5555-4555-8555-555555555555",versionId="99999999-9999-4999-8999-999999999999";
 const stored={id:sessionId,jobId,revision:2,createdAt:time,stale:false,snapshot:{result:{...result,sessionId},text:cv,claims:match.claims,quotes:job.content.requirements.map(r=>r.quote),locale:"nb",promptVersion:"cv-wording-v1"},reviews:[{paragraphIndex:1,text:result.proposals[0].newText,decision:"ACCEPTED"}]};
 const draft={id:versionId,title:"CV · Fictional developer",status:"DRAFT",revision:1,templateVersion:"reviewed-text-v1",createdAt:time,approvedAt:null,stale:false,artifacts:[],content:{locale:"nb",identity:{name:"Fictional Pilot",headline:"",email:"",phone:"",location:"",summary:""},claims:[],entries:[],jobId,jobTitle:job.content.title,reviewedSource:{sessionId,sessionRevision:2,documentId,sourceSha256:"a".repeat(64),text:cv.replace(claim.statement,result.proposals[0].newText),evidence:[{id:claimId,revision:2}]}}};
 let ai=0,writes=0;
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring/session`,r=>r.fulfill({json:stored}));
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring`,r=>{ai++;return r.fulfill({json:result});});
 await page.route(`**/api/profile/me/jobs/${jobId}/tailoring/draft`,r=>{writes++;expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");expect(r.request().postDataJSON()).toEqual({sessionId,revision:2});return r.fulfill({json:draft});});
 await page.route("**/api/profile/me/cvs**",r=>r.fulfill({json:r.request().url().endsWith("cleanup")?{remaining:0}:[draft]}));
 await page.route("**/api/profile/me/entries",r=>r.fulfill({json:[]}));
 await page.goto(`/jobs/${jobId}/apply`);await expect(page.locator(".preparation-readiness")).toContainText(doc.originalName);await page.screenshot({path:"/tmp/career-preparation-reviewed-desktop.png",fullPage:true});await page.setViewportSize({width:390,height:844});
 await page.getByRole("button",{name:"Lagre tilpasset CV-utkast",exact:true}).click();
 await expect(page.getByText("CV-utkastet er lagret. Dokumentkontroll gjenstår.")).toBeVisible();
 await page.getByRole("link",{name:"Se i Mine CV-er"}).click();
 await page.getByRole("button",{name:"Gjennomgå utkast",exact:true}).click();
 await expect(page.locator(".cv-paper")).toHaveText(draft.content.reviewedSource.text);
 await expect(page.getByRole("button",{name:"Dokumentkontroll gjenstår",exact:true})).toBeDisabled();
 await expect(page.getByText("Klar til å bruke",{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"/tmp/career-reviewed-cv-draft-mobile.png"});expect(ai).toBe(0);expect(writes).toBe(1);
});

test("reviewed draft proxy rejects injected text owner fields foreign origins and anonymous creation",async({request})=>{
 const path=`/api/profile/me/jobs/${jobId}/tailoring/draft`,body={sessionId:"55555555-5555-4555-8555-555555555555",revision:2};
 expect((await request.post(path,{data:{...body,text:"Injected wording"}})).status()).toBe(400);
 expect((await request.post(path,{data:{...body,ownerId:claimId}})).status()).toBe(400);
 expect((await request.post(path,{data:body,headers:{Origin:"https://unrelated.example"}})).status()).toBe(403);
 expect((await request.post(path,{data:body})).status()).toBe(403);
});

test("unreadable CV explains consent blocker and open questions do not block supported tailoring",async({page})=>{
 await fixtures(page);let calls=0;await page.route("**/tailoring",r=>{calls++;return r.fulfill({status:503});});
 await page.route(`**/api/profile/me/documents/${documentId}`,r=>r.fulfill({json:{document:doc,text:"Too short"}}));
 await page.goto(`/jobs/${jobId}/apply`);
 const consent=page.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Gemini for CV-forslag",exact:true});
 await expect(consent).toBeDisabled();await expect(page.locator("#preparation-blockers")).toContainText("for lite lesbar tekst");
 await page.getByRole("combobox",{name:"Språk",exact:true}).selectOption("en");await expect(page.locator("#preparation-blockers")).toContainText("too little readable text");
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await fixtures(page);await page.route(`**/api/profile/me/jobs/${jobId}/match`,r=>r.fulfill({json:{...match,assessments:[{requirementIndex:0,classification:"CLARIFY",reason:"More context is needed.",evidence:[],question:"Which APIs?"}]}}));
 await page.reload();await expect(page.getByRole("checkbox",{name:"I approve sending this evidence to Gemini for CV suggestions",exact:true})).toBeEnabled();expect(calls).toBe(0);
});

test("whole CV proposals exceed twelve and old merged DOCX source gets actionable guidance",async({page})=>{
 const {hasMergedCvSections}=await import("../lib/cv-tailoring");
 expect(hasMergedCvSections("Fictional person\nNØKKELKVALIFIKASJONER\nFirst paragraph\nKJERNEKOMPETANSE\nSkills")).toBe(true);
 expect(hasMergedCvSections("Fictional person\n\nNØKKELKVALIFIKASJONER\n\nFirst paragraph\n\nKJERNEKOMPETANSE\n\nSkills")).toBe(false);
 const proposals=Array.from({length:40},(_,paragraphIndex)=>({paragraphIndex,oldText:`Original ${paragraphIndex}`,newText:`Supported wording ${paragraphIndex}`,reason:"Relevant confirmed contribution",claimIds:[claimId],requirementIndexes:[0]}));
 expect(isTailoringResult({documentId,matchId,...gemini,proposals,omittedItems:0})).toBe(true);
 expect(isTailoringResult({documentId,matchId,...gemini,proposals:[...proposals,{...proposals[0],paragraphIndex:40}],omittedItems:0})).toBe(false);
 const reviews=proposals.slice(0,13).map(p=>({paragraphIndex:p.paragraphIndex,text:p.newText,decision:"ACCEPTED"}));
 expect((await page.request.put(`/api/profile/me/jobs/${jobId}/tailoring/session`,{data:{sessionId:documentId,revision:1,reviews}})).status()).toBe(403);
 expect((await page.request.put(`/api/profile/me/jobs/${jobId}/tailoring/session`,{data:{sessionId:documentId,revision:1,reviews:Array.from({length:41},(_,paragraphIndex)=>({...reviews[0],paragraphIndex}))}})).status()).toBe(400);
 await fixtures(page);await page.route(`**/api/profile/me/documents/${documentId}`,r=>r.fulfill({json:{document:doc,text:"Fictional person\nNØKKELKVALIFIKASJONER\nFirst profile paragraph\nKJERNEKOMPETANSE\nKotlin APIs"}}));
 await page.goto(`/jobs/${jobId}/apply`);
 await expect(page.getByText("CV-avsnittene kan være slått sammen",{exact:true})).toBeVisible();
 await expect(page.getByRole("link",{name:"Åpne dokumentene",exact:true})).toHaveAttribute("href","/documents");
});
