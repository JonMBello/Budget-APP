import { expect, test, type APIRequestContext } from "@playwright/test";
const origin = "http://127.0.0.1:3003";
const credentials = { email: "test@example.test", password: "integration-only-password" };
async function login(request: APIRequestContext, email = credentials.email) {
  return request.post("/app/bff/auth/login", { headers: { Origin: origin }, data: { ...credentials, email } });
}

test("login stores an opaque HttpOnly session and never exposes upstream tokens", async ({ request }) => {
  const result = await login(request); expect(result.status()).toBe(200);
  expect(await result.json()).toMatchObject({ user: { email: credentials.email } });
  expect(await result.text()).not.toContain("test-access"); expect(await result.text()).not.toContain("test-refresh");
  const cookie = result.headers()["set-cookie"];
  expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("Path=/app"); expect(cookie).toContain("SameSite=lax");
  expect(cookie).not.toContain("integration-only-key");
  const profile = await request.get("/app/bff/profile"); expect(profile.status()).toBe(200); expect(profile.headers()["cache-control"]).toContain("no-store");
  const home = await request.get("/app"); expect(home.status()).toBe(200); expect(await home.text()).toContain("Usuario de prueba");
});
test("unauthorized routes and cross-origin writes fail closed", async ({ request }) => {
  expect((await request.get("/app/bff/profile")).status()).toBe(401);
  const page = await request.get("/app/settings/profile", { maxRedirects: 0 });
  expect(page.status()).toBe(307); expect(page.headers().location).toContain("returnTo=");
  expect((await request.post("/app/bff/auth/login", { headers: { Origin: "https://evil.test" }, data: credentials })).status()).toBe(403);
  expect((await request.post("/app/bff/auth/anything", { headers: { Origin: origin }, data: credentials })).status()).toBe(404);
});
test("invalid credentials and unsupported fields cannot create a session", async ({ request }) => {
  const rejected = await request.post("/app/bff/auth/login", { headers: { Origin: origin }, data: { ...credentials, password: "wrong" } });
  expect(rejected.status()).toBe(401); expect(rejected.headers()["set-cookie"]).toBeUndefined();
  const invalid = await request.post("/app/bff/auth/login", { headers: { Origin: origin }, data: { ...credentials, userId: "other" } });
  expect(invalid.status()).toBe(400);
});
test("logout revokes the old session, including when its cookie is replayed", async ({ request }) => {
  const result = await login(request, "logout@example.test"); const cookie = result.headers()["set-cookie"].split(";")[0];
  expect((await request.post("/app/bff/auth/logout", { headers: { Origin: origin }, data: {} })).status()).toBe(200);
  expect((await request.get("/app/bff/profile", { headers: { Cookie: cookie } })).status()).toBe(401);
});
test("profile updates persist and currency changes are refused after a budget exists", async ({ request }) => {
  await login(request, "hasdata@example.test");
  const update = await request.patch("/app/bff/profile", { headers: { Origin: origin }, data: { name: "Nombre editado" } });
  expect(update.status()).toBe(200); expect((await (await request.get("/app/bff/profile")).json()).name).toBe("Nombre editado");
  const currency = await request.patch("/app/bff/profile", { headers: { Origin: origin }, data: { name: "Nombre editado", currency: "USD" } });
  expect(currency.status()).toBe(409);
});
test("invited registration creates a session only with the correct invite", async ({ request }) => {
  const data = { ...credentials, email: "register@example.test", name: "Nueva cuenta", inviteCode: "wrong" };
  expect((await request.post("/app/bff/auth/register", { headers: { Origin: origin }, data })).status()).toBe(403);
  const success = await request.post("/app/bff/auth/register", { headers: { Origin: origin }, data: { ...data, inviteCode: "integration-invite" } });
  expect(success.status()).toBe(200); expect((await request.get("/app/bff/profile")).status()).toBe(200);
});
