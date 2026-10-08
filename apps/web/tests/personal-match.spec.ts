import { expect, test } from "@playwright/test";
const jobId = "52345678-1234-1234-1234-123456789abc";
const claimId = "62345678-1234-1234-1234-123456789abc";
const pendingId = "72345678-1234-1234-1234-123456789abc";
const time = "2026-10-07T00:00:00Z";
const text = "Kotlin experience is required for this fictional backend role. We also prefer Kafka.";
const job = { id:jobId,content:{ title:"Fictional backend developer",sourceUrl:null,sourceType:"PASTED_TEXT",text,locale:"nb",requirements:[{label:"Kotlin",kind:"REQUIRED",quote:"Kotlin experience is required"},{label:"Kafka",kind:"PREFERRED",quote:"We also prefer Kafka."}],facts:[],omittedItems:0,retrievedAt:null },createdAt:time };
const confirmed = { id:claimId,skill:"Kotlin",statement:"Built APIs using Kotlin",context:"Fictional project",sourceNote:"Private note not sent",status:"CONFIRMED",revision:2,createdAt:time,updatedAt:time };
const result = { id:"82345678-1234-1234-1234-123456789abc",locale:"nb",createdAt:time,assessments:[{requirementIndex:0,classification:"STRONG",reason:"Bekreftet Kotlin-bidrag er relevant.",evidence:[{claimId,quote:confirmed.statement}],question:""},{requirementIndex:1,classification:"CLARIFY",reason:"Kafka er ikke dokumentert, men dette er ikke en bekreftet mangel.",evidence:[],question:"Har du brukt en meldingskø?"}],claims:[{id:claimId,revision:2,skill:confirmed.skill,statement:confirmed.statement,context:confirmed.context}],omittedItems:0,inputCharacters:180,stale:false };

test("matching shares only selected confirmed revisions after separate approval and reopens without another call", async ({ page }) => {
 let stored: typeof result | null = null; let calls = 0; let current = { ...confirmed };
 const logs: string[] = []; page.on("console",message => logs.push(message.text()));
 await page.route("**/api/auth/session",r => r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me/claims",r => r.fulfill({json:[current,{...confirmed,id:pendingId,skill:"React",status:"UNVERIFIED",revision:1}]}));
 await page.route("**/api/profile/me/jobs**",r => {
  if (r.request().url().endsWith("/match")) {
   if (r.request().method() === "GET") return r.fulfill({json:stored});
   calls++; expect(r.request().postDataJSON()).toEqual({text,claims:[{id:claimId,revision:2}],locale:"nb",consent:true});
   expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf"); stored = result; return r.fulfill({json:result});
  }
  return r.fulfill({json:[job]});
 });
 await page.goto("/jobs/saved"); await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();
 const sheet = page.getByRole("dialog");
 await sheet.getByRole("button",{name:"Velg grunnlag for personlig matching",exact:true}).click();
 const submit = sheet.getByRole("button",{name:"Analyser personlig match",exact:true});
 await expect(submit).toBeDisabled(); expect(calls).toBe(0);
 await expect(sheet.locator(".match-claim")).toHaveCount(1);
 await sheet.locator(".match-claim").getByRole("checkbox").check();
 await expect(submit).toBeDisabled();
 const consent = sheet.getByRole("checkbox",{name:"Jeg godkjenner at dette grunnlaget sendes til Groq for denne matchingen"});
 await consent.check();
 const preview = sheet.getByRole("textbox",{name:"Annonsetekst som sendes"});
 await preview.fill(text+"\n"); await expect(consent).not.toBeChecked();
 await preview.fill(text); await consent.check(); await submit.click();
 await expect(sheet.locator(".match-result")).toBeVisible();
 await sheet.locator(".match-assessment summary").filter({hasText:"Kotlin"}).click();
 await expect(sheet.locator(".match-proof")).toContainText(confirmed.statement);
 await sheet.locator(".match-assessment summary").filter({hasText:"Kafka"}).click();
 await expect(sheet.getByText("Har du brukt en meldingskø?",{exact:true})).toBeVisible();
 expect(calls).toBe(1);
 await page.reload(); await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();
 await expect(page.locator(".match-result")).toBeVisible(); expect(calls).toBe(1);
 current = {...confirmed,status:"UNVERIFIED",revision:3};
 await page.reload(); await page.getByRole("button",{name:"Åpne stilling",exact:true}).click();
 await expect(page.getByText("Vurderingen er utdatert fordi kompetansegrunnlaget er endret. Lag en ny vurdering før du bruker den videre.",{exact:true})).toBeVisible();
 expect(logs.join(" ")).not.toContain("Private note not sent");
 await page.setViewportSize({width:390,height:900});
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({path:"/tmp/career-personal-match-mobile.png",fullPage:true});
});

test("matching proxy rejects missing approval spoofed statements owner injection anonymous and foreign origins", async ({ request }) => {
 const path = `/api/profile/me/jobs/${jobId}/match`;
 const input = {text,claims:[{id:claimId,revision:2}],locale:"nb",consent:true};
 expect((await request.get(path)).status()).toBe(401);
 expect((await request.post(path,{data:{...input,consent:false}})).status()).toBe(400);
 expect((await request.post(path,{data:{...input,claims:[{id:claimId,revision:2,statement:"Invented"}]}})).status()).toBe(400);
 expect((await request.post(path,{data:{...input,ownerId:claimId}})).status()).toBe(400);
 expect((await request.post(path,{data:input,headers:{Origin:"https://unrelated.example"}})).status()).toBe(403);
});
