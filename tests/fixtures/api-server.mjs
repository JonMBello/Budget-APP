// Synthetic API for integration tests only. Never forwards to an external service.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const tokens = new Map();
const profiles = new Map();
const userCards = new Map();
const userPeople = new Map();
const userBudgets = new Map();

function profile(email) {
  if (!profiles.has(email)) {
    profiles.set(email, {
      id:
        email === "hasdata@example.test"
          ? "222222222222222222222222"
          : `user-${email}`,
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

function getPeople(userId) {
  if (!userPeople.has(userId)) userPeople.set(userId, new Map());
  return userPeople.get(userId);
}

function getBudgets(userId) {
  if (!userBudgets.has(userId)) {
    const map = new Map();
    if (userId === "222222222222222222222222") {
      map.set("2026-09", {
        id: "fixture-period",
        userId,
        year: 2026,
        month: 9,
        status: "OPEN",
        carriedSavings: 0,
        totalIncome: 10000,
        totalExpenses: 5000,
        notes: "Fixture period",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    userBudgets.set(userId, map);
  }
  return userBudgets.get(userId);
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

  // People endpoints
  if (pathname === "/api/people") {
    const peopleMap = getPeople(user.id);
    if (request.method === "GET") {
      const includeInactive = parsedUrl.searchParams.get("includeInactive") === "true";
      const list = Array.from(peopleMap.values()).filter((p) => includeInactive || p.isActive);
      return send(200, list);
    }
    if (request.method === "POST") {
      if (!body.name || body.name.trim().length < 2) {
        return send(400, { message: "Name must be at least 2 characters" });
      }
      const person = {
        id: `person-${randomUUID().slice(0, 8)}`,
        userId: user.id,
        name: body.name.trim(),
        contact: body.contact ? body.contact.trim() : undefined,
        notes: body.notes ? body.notes.trim() : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      peopleMap.set(person.id, person);
      return send(201, person);
    }
  }

  const personMatch = pathname.match(/^\/api\/people\/([^/]+)$/);
  if (personMatch) {
    const personId = personMatch[1];
    const peopleMap = getPeople(user.id);
    const person = peopleMap.get(personId);
    if (!person) return send(404, { message: "Person not found" });

    if (request.method === "GET") return send(200, person);
    if (request.method === "PATCH") {
      if (body.name) person.name = body.name.trim();
      if (body.contact !== undefined) person.contact = body.contact ? body.contact.trim() : undefined;
      if (body.notes !== undefined) person.notes = body.notes ? body.notes.trim() : undefined;
      return send(200, person);
    }
    if (request.method === "DELETE") {
      person.isActive = false;
      return send(200, person);
    }
  }

  const debtsMatch = pathname.match(/^\/api\/people\/([^/]+)\/debts$/);
  if (debtsMatch && request.method === "GET") {
    const personId = debtsMatch[1];
    const peopleMap = getPeople(user.id);
    const person = peopleMap.get(personId);
    if (!person) return send(404, { message: "Person not found" });

    const hasDebt = person.name.includes("Deuda");
    const debts = {
      totalDebt: hasDebt ? 2500 : 0,
      immediateDueAmount: hasDebt ? 1000 : 0,
      nextPaymentDueDate: hasDebt ? "2026-10-05" : null,
      msiInstallments: hasDebt
        ? [{ title: "Laptop Trabajo", currentInstallment: 2, totalInstallments: 6, amount: 1500, paymentDueDate: "2026-10-05", cardName: "Banorte Oro" }]
        : [],
      recurringServices: hasDebt
        ? [{ title: "Spotify Familiar", amount: 200, paymentDueDate: "2026-10-01" }]
        : [],
      singleExpenses: hasDebt
        ? [{ expenseId: "exp-single-1", title: "Cena en restaurante", amount: 800, paymentDueDate: "2026-09-20", settled: false }]
        : [],
    };
    return send(200, debts);
  }

  const settleMatch = pathname.match(/^\/api\/people\/([^/]+)\/settle$/);
  if (settleMatch && request.method === "POST") {
    const personId = settleMatch[1];
    const peopleMap = getPeople(user.id);
    const person = peopleMap.get(personId);
    if (!person) return send(404, { message: "Person not found" });
    if (!body.expenseId) return send(400, { message: "expenseId required" });
    return send(200, { success: true, settledExpenseId: body.expenseId });
  }

  // Budget endpoints
  if (pathname === "/api/budgets") {
    const budgetsMap = getBudgets(user.id);
    if (request.method === "GET") {
      const list = Array.from(budgetsMap.values()).sort(
        (a, b) => b.year * 100 + b.month - (a.year * 100 + a.month),
      );
      return send(200, list);
    }
  }

  if (pathname === "/api/budgets/current") {
    const budgetsMap = getBudgets(user.id);
    const sorted = Array.from(budgetsMap.values()).sort(
      (a, b) => b.year * 100 + b.month - (a.year * 100 + a.month),
    );
    if (sorted.length === 0) return send(404, { message: "No active budget found" });
    return send(200, sorted[0]);
  }

  if (pathname === "/api/budgets/current/summary") {
    const budgetsMap = getBudgets(user.id);
    const sorted = Array.from(budgetsMap.values()).sort(
      (a, b) => b.year * 100 + b.month - (a.year * 100 + a.month),
    );
    if (sorted.length === 0) return send(404, { message: "No active budget found" });
    const period = sorted[0];
    const netBalance = period.totalIncome - period.totalExpenses;
    const projectedSavings = period.carriedSavings + netBalance;
    return send(200, {
      periodId: period.id,
      year: period.year,
      month: period.month,
      status: period.status,
      totalIncome: period.totalIncome,
      totalExpenses: period.totalExpenses,
      netBalance,
      carriedSavings: period.carriedSavings,
      projectedSavings,
      cashInPocketBalance: netBalance,
    });
  }

  if (pathname === "/api/budgets/initialize" && request.method === "POST") {
    const budgetsMap = getBudgets(user.id);
    const year = Number(body.year);
    const month = Number(body.month);
    if (!year || !month || month < 1 || month > 12) {
      return send(400, { message: "Valid year and month (1-12) required" });
    }
    const key = `${year}-${String(month).padStart(2, "0")}`;
    if (budgetsMap.has(key)) {
      return send(409, {
        message: "Budget period already exists",
        period: budgetsMap.get(key),
      });
    }

    const period = {
      id: `budget-${randomUUID().slice(0, 8)}`,
      userId: user.id,
      year,
      month,
      status: "OPEN",
      carriedSavings: Number(body.carriedSavings || 0),
      totalIncome: Number(body.totalIncome || 0),
      totalExpenses: Number(body.totalExpenses || 0),
      notes: body.notes ? body.notes.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    budgetsMap.set(key, period);
    return send(201, period);
  }

  const budgetSummaryMatch = pathname.match(/^\/api\/budgets\/(\d{4})\/(\d{1,2})\/summary$/);
  if (budgetSummaryMatch && request.method === "GET") {
    const year = Number(budgetSummaryMatch[1]);
    const month = Number(budgetSummaryMatch[2]);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const budgetsMap = getBudgets(user.id);
    const period = budgetsMap.get(key);
    if (!period) return send(404, { message: "Budget period not found" });

    const netBalance = period.totalIncome - period.totalExpenses;
    const projectedSavings = period.carriedSavings + netBalance;
    return send(200, {
      periodId: period.id,
      year: period.year,
      month: period.month,
      status: period.status,
      totalIncome: period.totalIncome,
      totalExpenses: period.totalExpenses,
      netBalance,
      carriedSavings: period.carriedSavings,
      projectedSavings,
      cashInPocketBalance: netBalance,
    });
  }

  const budgetSavingsMatch = pathname.match(/^\/api\/budgets\/(\d{4})\/(\d{1,2})\/savings$/);
  if (budgetSavingsMatch && request.method === "PATCH") {
    const year = Number(budgetSavingsMatch[1]);
    const month = Number(budgetSavingsMatch[2]);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const budgetsMap = getBudgets(user.id);
    const period = budgetsMap.get(key);
    if (!period) return send(404, { message: "Budget period not found" });
    if (period.status === "CLOSED") {
      return send(400, { message: "Cannot modify a closed budget period" });
    }
    if (body.carriedSavings !== undefined) {
      period.carriedSavings = Number(body.carriedSavings);
    }
    if (body.notes !== undefined) {
      period.notes = body.notes ? body.notes.trim() : undefined;
    }
    period.updatedAt = new Date().toISOString();
    return send(200, period);
  }

  const budgetStatusMatch = pathname.match(/^\/api\/budgets\/(\d{4})\/(\d{1,2})\/status$/);
  if (budgetStatusMatch && request.method === "PATCH") {
    const year = Number(budgetStatusMatch[1]);
    const month = Number(budgetStatusMatch[2]);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const budgetsMap = getBudgets(user.id);
    const period = budgetsMap.get(key);
    if (!period) return send(404, { message: "Budget period not found" });
    if (body.status !== "OPEN" && body.status !== "CLOSED") {
      return send(400, { message: "Status must be OPEN or CLOSED" });
    }
    period.status = body.status;
    period.updatedAt = new Date().toISOString();
    return send(200, period);
  }

  const budgetMatch = pathname.match(/^\/api\/budgets\/(\d{4})\/(\d{1,2})$/);
  if (budgetMatch) {
    const year = Number(budgetMatch[1]);
    const month = Number(budgetMatch[2]);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const budgetsMap = getBudgets(user.id);
    const period = budgetsMap.get(key);
    if (!period) return send(404, { message: "Budget period not found" });

    if (request.method === "GET") return send(200, period);
    if (request.method === "PATCH") {
      if (period.status === "CLOSED") {
        return send(400, { message: "Cannot modify a closed budget period" });
      }
      if (body.carriedSavings !== undefined) period.carriedSavings = Number(body.carriedSavings);
      if (body.notes !== undefined) period.notes = body.notes ? body.notes.trim() : undefined;
      period.updatedAt = new Date().toISOString();
      return send(200, period);
    }
  }

  if (["/api/incomes", "/api/expenses", "/api/recurring"].some((p) => pathname.startsWith(p))) {
    return send(200, []);
  }

  return send(404, {});
});

server.listen(3101, "127.0.0.1");
for (const event of ["SIGINT", "SIGTERM"]) process.on(event, () => server.close(() => process.exit(0)));
