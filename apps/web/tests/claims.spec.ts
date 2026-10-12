import { expect, test, type Page } from "@playwright/test";
import type { CompetencyClaim, ClaimRevision } from "../lib/claims";
const id = "12345678-1234-1234-1234-123456789abc";
const initial: CompetencyClaim = { id, skill: "Webhooks", statement: "Jeg implementerte betalingsvarsler.", context: "Synthetic project", sourceNote: "Egen hukommelse", status: "UNVERIFIED", revision: 1, createdAt: "2026-10-07T00:00:00Z", updatedAt: "2026-10-07T00:00:00Z" };
async function profile(page: Page) {
  await page.route("**/api/profile/me/documents", route => route.fulfill({ json: [] }));
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, loginAvailable: true, profilesAvailable: true, csrfToken: "synthetic-csrf" } }));
  await page.route("**/api/profile/me", route => route.fulfill({ json: { id, displayName: "Synthetic Pilot", preferredLanguage: "nb", revision: 1 } }));
}
test("manual entry, explicit review, edit reset, history and delete require separate user actions", async ({ page }) => {
  await profile(page);
  let stored: CompetencyClaim | null = null;
  const history: ClaimRevision[] = [];
  let writes = 0;
  await page.route("**/api/profile/me/claims**", route => {
    const method = route.request().method(); const url = route.request().url();
    if (method === "GET") return route.fulfill({ json: url.endsWith("/history") ? { items: [...history].reverse(), total: history.length } : stored ? [stored] : [] });
    expect(route.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");
    const body = route.request().postDataJSON(); expect(body.ownerId).toBeUndefined(); writes++;
    if (method === "DELETE") { expect(body.revision).toBe(stored!.revision); stored = null; history.length = 0; return route.fulfill({ status: 204 }); }
    const action = url.endsWith("/review") ? body.decision === "CONFIRM" ? "USER_CONFIRMATION" : "USER_REJECTION" : method === "PUT" ? "CONTENT_EDIT" : "MANUAL_ENTRY";
    if (stored) expect(body.revision).toBe(stored.revision);
    stored = { ...initial, ...(stored ?? {}), ...(url.endsWith("/review") ? {} : body), status: action === "USER_CONFIRMATION" ? "CONFIRMED" : action === "USER_REJECTION" ? "REJECTED" : "UNVERIFIED", revision: (stored?.revision ?? 0) + 1 };
    const snapshot = stored!;
    history.push({ ...snapshot, action, recordedAt: snapshot.updatedAt, recordedBy: "PROFILE_OWNER" });
    return route.fulfill({ json: stored });
  });
  await page.goto("/career/profile"); await page.getByRole("button", {name:"Din kompetanse",exact:true}).click();
  await page.getByRole("button", { name: "Legg til kompetanse", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Kompetanse", exact: true }).fill(initial.skill);
  await dialog.getByRole("textbox", { name: "Hva gjorde du selv?", exact: true }).fill(initial.statement);
  await dialog.getByRole("textbox", { name: "Prosjekt eller arbeidsforhold", exact: true }).fill(initial.context);
  await dialog.getByRole("textbox", { name: "Grunnlag / kilde", exact: true }).fill(initial.sourceNote);
  await dialog.getByRole("button", { name: "Lagre opplysning", exact: true }).click();
  const card = page.getByRole("article", { name: "Webhooks", exact: true });
  await expect(card.locator('[data-claim-status="UNVERIFIED"]')).toBeVisible();
  await card.getByRole("button", { name: "Bekreft", exact: true }).click();
  await expect(dialog).toContainText(initial.statement); expect(writes).toBe(1);
  await dialog.getByRole("button", { name: "Ja, dette beskriver min erfaring", exact: true }).click();
  await expect(card.locator('[data-claim-status="CONFIRMED"]')).toBeVisible();
  await card.getByRole("button", { name: "Rediger", exact: true }).click();
  await dialog.getByRole("textbox", { name: "Hva gjorde du selv?", exact: true }).fill("Jeg implementerte og testet betalingsvarsler.");
  await dialog.getByRole("button", { name: "Lagre opplysning", exact: true }).click();
  await expect(card.locator('[data-claim-status="UNVERIFIED"]')).toBeVisible();
  await card.getByRole("button", { name: "Historikk", exact: true }).click();
  await expect(dialog.getByText(initial.statement, { exact: true })).toHaveCount(2);
  await expect(dialog.getByText("Bekreftet av deg", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Avbryt", exact: true }).click();
  await card.getByRole("button", { name: "Avvis", exact: true }).click();
  await dialog.getByRole("button", { name: "Avvis denne opplysningen", exact: true }).click();
  await expect(card.locator('[data-claim-status="REJECTED"]')).toBeVisible();
  await page.getByRole("combobox", { name: "Språk", exact: true }).selectOption("en");
  await card.getByRole("button", { name: "Delete", exact: true }).click(); expect(writes).toBe(4);
  await dialog.getByRole("button", { name: "Delete statement and history", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Build competencies from what you have actually done", exact: true })).toBeVisible();
  expect(writes).toBe(5);
});

test("stale edits preserve the draft and expired claim access closes the private workspace", async ({ page }) => {
  await profile(page); let expired = false;
  await page.route("**/api/profile/me/claims**", route => route.request().method() === "GET" ? route.fulfill({ json: [initial] }) : route.fulfill({ status: expired ? 401 : 409, json: { code: expired ? "AUTH_REQUIRED" : "CLAIM_CONFLICT" } }));
  await page.goto("/career/profile"); await page.getByRole("button", {name:"Din kompetanse",exact:true}).click();
  await page.getByRole("article", { name: "Webhooks", exact: true }).getByRole("button", { name: "Rediger", exact: true }).click();
  const dialog = page.getByRole("dialog"); const field = dialog.getByRole("textbox", { name: "Hva gjorde du selv?", exact: true });
  await field.fill("My retained draft");
  await dialog.getByRole("button", { name: "Lagre opplysning", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Utkastet er beholdt");
  await expect(field).toHaveValue("My retained draft");
  expired = true;
  await dialog.getByRole("button", { name: "Lagre opplysning", exact: true }).click();
  await expect(page.getByRole("link", { name: "Logg inn", exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: "Webhooks", exact: true })).toHaveCount(0);
});

test("claim proxies reject spoofed status and ownership and require authentication", async ({ request }) => {
  expect((await request.get("/api/profile/me/claims")).status()).toBe(401);
  expect((await request.post("/api/profile/me/claims", { data: { skill: "Kotlin", statement: "Used Kotlin", context: "Synthetic", sourceNote: "Recollection", status: "CONFIRMED", ownerId: id } })).status()).toBe(400);
  expect((await request.post(`/api/profile/me/claims/${id}/review`, { data: { revision: 1, decision: "CONFIRM" }, headers: { Origin: "https://other.example" } })).status()).toBe(403);
  expect((await request.get("/api/profile/me/claims/not-a-uuid/history")).status()).toBe(400);
});

test("bulk confirmation retains displayed revisions and partial success while excluding rejected and personally confirmed claims",async({page})=>{
 await profile(page);const time="2026-10-07T00:00:00Z";
 const first="12345678-1234-1234-1234-123456789abc",second="22345678-1234-1234-1234-123456789abc";
 const base={statement:"Built backend services",context:"Example AS",sourceNote:"Own statement",createdAt:time,updatedAt:time};
 let stored=[{...base,id:first,skill:"Kotlin",status:"UNVERIFIED",revision:1,confirmationBasis:"NONE"},{...base,id:second,skill:"PostgreSQL",status:"CONFIRMED",revision:2,confirmationBasis:"DOCUMENT"},{...base,id:"32345678-1234-1234-1234-123456789abc",skill:"Rejected",status:"REJECTED",revision:1,confirmationBasis:"NONE"},{...base,id:"42345678-1234-1234-1234-123456789abc",skill:"Personal",status:"CONFIRMED",revision:2,confirmationBasis:"USER"}];
 const writes:string[]=[];await page.route("**/api/profile/me/claims**",r=>{if(r.request().method()==="GET")return r.fulfill({json:stored});const body=r.request().postDataJSON();const id=new URL(r.request().url()).pathname.split("/").at(-2)!;writes.push(id);expect(body).toEqual({decision:"CONFIRM",revision:id===first?1:2});expect(r.request().headers()["x-csrf-token"]).toBe("synthetic-csrf");if(id===second)return r.fulfill({status:409,json:{code:"CLAIM_CONFLICT"}});stored=stored.map(c=>c.id===id?{...c,status:"CONFIRMED",confirmationBasis:"USER",revision:c.revision+1}:c);return r.fulfill({json:stored.find(c=>c.id===id)});});
 await page.goto("/career/profile");await page.getByRole("button",{name:"Din kompetanse",exact:true}).click();
 await page.getByRole("button",{name:"Bekreft flere (2)",exact:true}).click();const dialog=page.getByRole("dialog");
 await expect(dialog.getByRole("checkbox")).toHaveCount(2);expect(writes).toHaveLength(0);
 await dialog.getByRole("button",{name:"Velg alle i utvalget"}).click();await dialog.getByRole("button",{name:"Bekreft valgte",exact:true}).click();
 await expect(dialog).toContainText("1 bekreftet. Øvrige punkter er beholdt.");await expect(dialog).toContainText("Kunne ikke bekreftes");
 expect(writes).toEqual([first,second]);
 await page.setViewportSize({width:390,height:850});await expect.poll(async()=>{const b=await dialog.boundingBox();return !!b&&b.x>=15&&b.x+b.width<=375;}).toBe(true);
 await page.screenshot({path:"/tmp/career-bulk-confirm-mobile.png",animations:"disabled"});
 await dialog.getByRole("button",{name:"Ferdig",exact:true}).click();await page.getByRole("button",{name:"Bekreft flere (1)",exact:true}).click();await expect(page.getByRole("dialog").getByRole("checkbox")).toHaveCount(1);
});
