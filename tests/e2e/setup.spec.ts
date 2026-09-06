import { expect, test } from "@playwright/test";

test("serves the real Next.js app under /app with a private no-cache health endpoint", async ({ request }) => {
  const response = await request.get("/app/login");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  const html = await response.text();
  expect(html).toContain("Iniciar sesión");
  expect(html).toContain("/app/_next/");
  const health = await request.get("/app/health");
  expect(await health.json()).toEqual({ status: "ok" });
  expect(health.headers()["cache-control"]).toBe("no-store");
});
test("redirects the entry to login and returns a useful missing-page response", async ({ request }) => {
  const root = await request.get("/app", { maxRedirects: 0 });
  if (root.status() === 200) {
    expect(await root.text()).toContain('http-equiv="refresh" content="1;url=/app/login"');
  } else {
    expect([307, 308]).toContain(root.status());
  }
  const missing = await request.get("/app/this-page-does-not-exist");
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain("No encontramos esta página");
});
