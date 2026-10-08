import { expect, test } from "@playwright/test";
const first="12345678-1234-1234-1234-123456789abc";const second="22345678-1234-1234-1234-123456789abc";const texts:Record<string,string>={[first]:"Built APIs with Kotlin for a synthetic project."};
test("private analysis proxies reject missing approval cross-origin spoofing oversized inputs and anonymous access", async ({ request }) => {
  const path = `/api/profile/me/documents/${first}/analysis`;
  expect((await request.get(path)).status()).toBe(401);
  expect((await request.get("/api/profile/me/documents/analysis")).status()).toBe(401);
  const body = { text:texts[first], locale:"nb", consent:true };
  expect((await request.post(path, { data:{ ...body, consent:false } })).status()).toBe(400);
  expect((await request.post(path, { headers:{ Origin:"https://other.example" }, data:body })).status()).toBe(403);
  expect((await request.post(path, { data:{ ...body, ownerId:second } })).status()).toBe(400);
  expect((await request.post(path, { data:{ ...body, text:"x".repeat(12001) } })).status()).toBe(400);
  expect((await request.post("/api/profile/me/documents/analysis", { data:{ documents:[{ documentId:first, text:texts[first] }, { documentId:first, text:texts[first] }], locale:"nb", consent:true } })).status()).toBe(400);
});
