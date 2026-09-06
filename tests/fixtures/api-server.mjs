// Synthetic API for integration tests only. Never forwards to an external service.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
const tokens = new Map();
const profiles = new Map();
function profile(email) {
  if (!profiles.has(email)) profiles.set(email, { id: email === "hasdata@example.test" ? "222222222222222222222222" : "111111111111111111111111", email, name: "Usuario de prueba", currency: "MXN" });
  return profiles.get(email);
}
const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  const send = (status, data) => { response.writeHead(status); response.end(JSON.stringify(data)); };
  if (request.url === "/ready") return send(200, { ready: true });
  if (request.headers["x-api-key"] !== "integration-only-key") return send(401, { message: "Unauthorized request" });
  let raw = "";
  for await (const chunk of request) raw += chunk;
  let body; try { body = raw ? JSON.parse(raw) : {}; } catch { return send(400, {}); }
  if (request.url === "/api/auth/login" || request.url === "/api/auth/register") {
    if (body.password !== "integration-only-password") return send(401, { message: "Unauthorized request" });
    if (request.url.endsWith("register") && body.inviteCode !== "integration-invite") return send(403, {});
    const user = profile(body.email); const accessToken = `test-access-${randomUUID()}`; tokens.set(accessToken, user);
    return send(200, { user, accessToken, refreshToken: "test-refresh-not-for-production" });
  }
  const token = request.headers.authorization?.replace("Bearer ", ""); const user = tokens.get(token);
  if (!user) return send(401, { message: "Unauthorized request" });
  if (request.url === "/api/users/me") {
    if (request.method === "PATCH") Object.assign(user, body);
    return send(200, user);
  }
  if (["/api/incomes", "/api/expenses", "/api/recurring?includeInactive=true", "/api/budgets"].includes(request.url)) return send(200, user.email === "hasdata@example.test" && request.url === "/api/budgets" ? [{ id: "fixture-period" }] : []);
  return send(404, {});
});
server.listen(3101, "127.0.0.1");
for (const event of ["SIGINT", "SIGTERM"]) process.on(event, () => server.close(() => process.exit(0)));
