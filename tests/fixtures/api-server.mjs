// Synthetic API for integration tests only. Never forwards to an external service.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const tokens = new Map();
const profiles = new Map();
const userCards = new Map();

function profile(email) {
  if (!profiles.has(email)) {
    profiles.set(email, {
      id: email === "hasdata@example.test" ? "222222222222222222222222" : "111111111111111111111111",
      email,
      name: "Usuario de prueba",
      currency: "MXN",
    });
  }
  return profiles.get(email);
}

function getCards(userId) {
  if (!userCards.has(userId)) userCards.set(userId, new Map());
  return userCards.get(userId);
}

function calculateCycle(card, dateStr) {
  const [y, m, d] = (dateStr || new Date().toISOString().slice(0, 10)).split("-").map(Number);
  const cutoff = card.cutoffDay;
  const due = card.paymentDueDay;

  let cutoffYear = y;
  let cutoffMonth = m;
  if (d > cutoff) {
    cutoffMonth++;
    if (cutoffMonth > 12) {
      cutoffMonth = 1;
      cutoffYear++;
    }
  }

  let dueYear = cutoffYear;
  let dueMonth = cutoffMonth;
  if (due < cutoff) {
    dueMonth++;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear++;
    }
  }

  const statementCutoffDate = `${cutoffYear}-${String(cutoffMonth).padStart(2, "0")}-${String(cutoff).padStart(2, "0")}`;
  const paymentDueDate = `${dueYear}-${String(dueMonth).padStart(2, "0")}-${String(due).padStart(2, "0")}`;

  const tPurchase = new Date(Date.UTC(y, m - 1, d)).getTime();
  const tDue = new Date(Date.UTC(dueYear, dueMonth - 1, due)).getTime();
  const daysUntilDue = Math.max(0, Math.round((tDue - tPurchase) / (1000 * 60 * 60 * 24)));

  return {
    statementCutoffDate,
    paymentDueDate,
    impactBudgetYear: dueYear,
    impactBudgetMonth: dueMonth,
    daysUntilDue,
  };
}

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  const send = (status, data) => {
    response.writeHead(status);
    response.end(JSON.stringify(data));
  };

  const parsedUrl = new URL(request.url, "http://127.0.0.1:3101");
  const pathname = parsedUrl.pathname;

  if (pathname === "/ready") return send(200, { ready: true });
  if (request.headers["x-api-key"] !== "integration-only-key") {
    return send(401, { message: "Unauthorized request" });
  }

  let raw = "";
  for await (const chunk of request) raw += chunk;
  let body;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return send(400, {});
  }

  if (pathname === "/api/auth/login" || pathname === "/api/auth/register") {
    if (body.password !== "integration-only-password") return send(401, { message: "Unauthorized request" });
    if (pathname.endsWith("register") && body.inviteCode !== "integration-invite") return send(403, {});
    const user = profile(body.email);
    const accessToken = `test-access-${randomUUID()}`;
    tokens.set(accessToken, user);
    return send(200, { user, accessToken, refreshToken: "test-refresh-not-for-production" });
  }

  const token = request.headers.authorization?.replace("Bearer ", "");
  const user = tokens.get(token);
  if (!user) return send(401, { message: "Unauthorized request" });

  if (pathname === "/api/users/me") {
    if (request.method === "PATCH") Object.assign(user, body);
    return send(200, user);
  }

  // Cards endpoints
  if (pathname === "/api/cards") {
    const cardsMap = getCards(user.id);
    if (request.method === "GET") {
      const includeInactive = parsedUrl.searchParams.get("includeInactive") === "true";
      const cardsList = Array.from(cardsMap.values()).filter((c) => includeInactive || c.isActive);
      return send(200, cardsList);
    }
    if (request.method === "POST") {
      if (!body.name || !body.type) return send(400, { message: "Name and type are required" });
      if (body.type === "CREDIT") {
        if (!body.cutoffDay || !body.paymentDueDay || body.cutoffDay < 1 || body.cutoffDay > 31 || body.paymentDueDay < 1 || body.paymentDueDay > 31) {
          return send(400, { message: "Cutoff day and payment due day required for CREDIT (1-31)" });
        }
      }
      const card = {
        id: `card-${randomUUID().slice(0, 8)}`,
        userId: user.id,
        name: body.name,
        type: body.type,
        color: body.color || "#10b981",
        last4Digits: body.last4Digits || undefined,
        creditLimit: body.creditLimit !== undefined ? Number(body.creditLimit) : undefined,
        cutoffDay: body.cutoffDay !== undefined ? Number(body.cutoffDay) : undefined,
        paymentDueDay: body.paymentDueDay !== undefined ? Number(body.paymentDueDay) : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      cardsMap.set(card.id, card);
      return send(201, card);
    }
  }

  const cardMatch = pathname.match(/^\/api\/cards\/([^/]+)$/);
  if (cardMatch) {
    const cardId = cardMatch[1];
    const cardsMap = getCards(user.id);
    const card = cardsMap.get(cardId);
    if (!card) return send(404, { message: "Card not found" });

    if (request.method === "GET") return send(200, card);
    if (request.method === "PATCH") {
      Object.assign(card, body);
      return send(200, card);
    }
    if (request.method === "DELETE") {
      card.isActive = false;
      return send(200, card);
    }
  }

  const previewMatch = pathname.match(/^\/api\/cards\/([^/]+)\/preview-statement$/);
  if (previewMatch && request.method === "GET") {
    const cardId = previewMatch[1];
    const cardsMap = getCards(user.id);
    const card = cardsMap.get(cardId);
    if (!card) return send(404, { message: "Card not found" });
    if (card.type !== "CREDIT") return send(400, { message: "Only CREDIT cards have statement cycles" });
    const dateStr = parsedUrl.searchParams.get("date");
    const preview = calculateCycle(card, dateStr);
    return send(200, preview);
  }

  if (["/api/incomes", "/api/expenses", "/api/recurring", "/api/budgets"].some((p) => pathname.startsWith(p))) {
    return send(200, user.email === "hasdata@example.test" && pathname === "/api/budgets" ? [{ id: "fixture-period" }] : []);
  }

  return send(404, {});
});

server.listen(3101, "127.0.0.1");
for (const event of ["SIGINT", "SIGTERM"]) process.on(event, () => server.close(() => process.exit(0)));
