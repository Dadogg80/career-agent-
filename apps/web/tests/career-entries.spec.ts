import { expect,test } from "@playwright/test";
const id="92345678-1234-1234-1234-123456789abc";
const time="2026-10-07T00:00:00Z";
test("career timeline confirms actual roles separately and editing resets confirmation with visible revision history",async({page})=>{
 let saved:Record<string,unknown>|null=null;const history:Record<string,unknown>[]=[];
 await page.route("**/api/auth/session",r=>r.fulfill({json:{authenticated:true,loginAvailable:true,profilesAvailable:true,csrfToken:"synthetic-csrf"}}));
 await page.route("**/api/profile/me",r=>r.fulfill({json:{id,displayName:"Fictional Pilot",preferredLanguage:"nb",revision:1}}));
 await page.route("**/api/profile/me/claims",r=>r.fulfill({json:[]}));await page.route("**/api/profile/me/documents",r=>r.fulfill({json:[]}));
 await page.route("**/api/profile/me/entries**",r=>{
  const url=r.request().url(),method=r.request().method();
  if(url.endsWith("/history"))return r.fulfill({json:[...history].reverse()});
  if(method === "GET")return r.fulfill({json:saved?[saved]:[]});
  expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");const input=r.request().postDataJSON();
  if(method === "POST" && !url.endsWith("/review")){expect(Object.keys(input)).toEqual(["content"]);saved={id,content:input.content,status:"UNVERIFIED",revision:1,createdAt:time,updatedAt:time};}
  else if(url.endsWith("/review")){expect(input.revision).toBe(saved!.revision);saved={...saved,status:input.decision === "CONFIRM"?"CONFIRMED":"REJECTED",revision:Number(saved!.revision)+1};}
  else if(method === "PUT"){expect(input.revision).toBe(saved!.revision);saved={...saved,content:input.content,status:"UNVERIFIED",revision:Number(saved!.revision)+1};}
  else if(method === "DELETE"){saved=null;return r.fulfill({status:204});}
  history.push({...saved});return r.fulfill({json:saved});
 });
 await page.goto("/career/profile"); await page.getByRole("button", {name:"Arbeid og utdanning",exact:true}).click();
 await page.getByRole("button",{name:"Legg til historikk",exact:true}).click();
 let dialog=page.getByRole("dialog");
 await dialog.getByRole("textbox",{name:"Formell tittel / navn",exact:true}).fill("Developer");
 await dialog.getByRole("textbox",{name:"Arbeidsgiver / organisasjon",exact:true}).fill("Example AS");
 await dialog.getByRole("textbox",{name:"Kunde (valgfritt)",exact:true}).fill("Example client");
 await dialog.getByRole("textbox",{name:"Faktisk leveranserolle (valgfritt)",exact:true}).fill("API developer");
 await dialog.getByRole("textbox",{name:"Eget bidrag / beskrivelse (valgfritt)",exact:true}).fill("Built APIs using Kotlin");
 await dialog.getByRole("button",{name:"Lagre som ubekreftet",exact:true}).click();
 const panel=page.locator("#profile-career-history");
 await expect(panel.getByText("Ubekreftet",{exact:true})).toBeVisible();
 await expect(panel.getByText("Start ikke oppgitt – Slutt ikke oppgitt",{exact:true})).toBeVisible();
 await panel.getByRole("button",{name:"Bekreft",exact:true}).click();
 dialog=page.getByRole("dialog");await expect(dialog.getByText("API developer",{exact:true})).toBeVisible();
 await dialog.getByRole("button",{name:"Ja, opplysningene er riktige",exact:true}).click();
 await expect(panel.getByText("Bekreftet",{exact:true})).toBeVisible();
 await panel.getByRole("button",{name:"Rediger",exact:true}).click();
 await page.getByRole("dialog").getByRole("textbox",{name:"Faktisk leveranserolle (valgfritt)",exact:true}).fill("Integration developer");
 await page.getByRole("dialog").getByRole("button",{name:"Lagre som ubekreftet",exact:true}).click();
 await expect(panel.getByText("Ubekreftet",{exact:true})).toBeVisible();
 await panel.getByRole("button",{name:"Historikk",exact:true}).click();
 await expect(page.getByRole("dialog").locator(".career-entry")).toHaveCount(3);
 await page.getByRole("dialog").getByRole("button",{name:"Lukk",exact:true}).click();
 await page.setViewportSize({width:390,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole("combobox",{name:"Språk",exact:true}).selectOption("en");
 await expect(panel.getByRole("heading",{name:"Employment, projects and education"})).toBeVisible();
 await panel.getByRole("button",{name:"Delete",exact:true}).click();
 await page.getByRole("dialog").getByRole("button",{name:"Delete entry and history",exact:true}).click();
 await expect(panel.getByRole("heading",{name:"Start with one chapter",exact:true})).toBeVisible();
});
test("entry proxies reject external origins spoofed status invalid dates and anonymous history",async({request})=>{
 const path="/api/profile/me/entries";const content={kind:"EMPLOYMENT",title:"Developer",organization:"Example AS",client:"",deliveryRole:"",startMonth:"2020-01",endMonth:null,ongoing:true,description:"Built APIs",sourceNote:"Own statement"};
 expect((await request.get(path)).status()).toBe(401);
 expect((await request.post(path,{data:{content},headers:{Origin:"https://unrelated.example"}})).status()).toBe(403);
 expect((await request.post(path,{data:{content:{...content,status:"CONFIRMED"}}})).status()).toBe(400);
 expect((await request.post(path,{data:{content:{...content,endMonth:"2019-01",ongoing:false}}})).status()).toBe(400);
 expect((await request.get(`${path}/${id}/history`)).status()).toBe(401);
});
