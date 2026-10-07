import { expect, test } from "@playwright/test";

const jobUrl = "https://www.finn.no/job/ad/478077416";
const text = "Vi søker en utvikler. Du må ha erfaring med Kotlin og PostgreSQL.";

for (const host of ["localhost", "127.0.0.1"]) {
  test(`${host} supports interactive modes and URL analysis without document navigation`, async ({ page }) => {
    const errors: string[] = [];
    const navigations: string[] = [];
    let imports = 0;
    let analyses = 0;
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (request.isNavigationRequest()) navigations.push(request.url()); });
    await page.route("**/api/status", route => route.fulfill({ json: { application: "career-agent", status: "UP" } }));
    await page.route("**/api/jobs/import", route => {
      imports++;
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON().url).toBe(jobUrl);
      return route.fulfill({ json: { sourceUrl: jobUrl, title: "Utvikler", text, retrievedAt: "2026-10-07T00:00:00Z", sourceType: "GROQ_BROWSER_EXCERPT" } });
    });
    await page.route("**/api/jobs/requirements", route => {
      analyses++;
      expect(route.request().postDataJSON().text).toBe(text);
      return route.fulfill({ json: { facts: [], requirements: [{ label: "Kotlin", kind: "REQUIRED", quote: "Du må ha erfaring med Kotlin og PostgreSQL." }] } });
    });
    await page.goto(`http://${host}:13001`);
    await page.getByRole("button", { name: "Lim inn tekst", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Stillingsannonse", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Bruk lenke", exact: true }).click();
    const input = page.getByRole("textbox", { name: "Lenke til stillingsannonse" });
    await input.fill(jobUrl);
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: "Kotlin", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(input).toHaveValue(jobUrl);
    expect(imports).toBe(1);
    expect(analyses).toBe(1);
    expect(navigations).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}

test("development assets allow explicit loopback origins and reject unrelated origins", async ({ page, request }) => {
  await page.route("**/api/status", route => route.fulfill({ json: { status: "UP" } }));
  await page.goto("/");
  const asset = await page.locator('script[src^="/_next/"]').first().getAttribute("src");
  expect(asset).toBeTruthy();
  for (const host of ["localhost", "127.0.0.1"]) {
    expect((await request.get(asset!, { headers: { Origin: `http://${host}:13001` } })).status()).toBe(200);
    // Without a WebSocket upgrade, HMR need not return 200, but the origin must be accepted.
    expect((await request.get("/_next/hmr", { headers: { Origin: `http://${host}:13001` } })).status()).not.toBe(403);
  }
  expect((await request.get(asset!, { headers: { Origin: "https://unrelated.example" } })).status()).toBe(403);
});
