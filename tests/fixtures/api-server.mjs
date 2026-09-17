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

const userRecurring = new Map();
function getRecurring(userId) {
  if (!userRecurring.has(userId)) userRecurring.set(userId, new Map());
  return userRecurring.get(userId);
}

const userIncomes = new Map();
function getIncomes(userId) {
  if (!userIncomes.has(userId)) userIncomes.set(userId, new Map());
  return userIncomes.get(userId);
}

const userExpenses = new Map();
function getExpenses(userId) {
  if (!userExpenses.has(userId)) userExpenses.set(userId, new Map());
  return userExpenses.get(userId);
}

const userPushSubscriptions = new Map();
function getPushSubscriptions(userId) {
  if (!userPushSubscriptions.has(userId)) userPushSubscriptions.set(userId, new Map());
  return userPushSubscriptions.get(userId);
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
    cutoffDate: statementCutoffDate,
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
        phoneCode: body.phoneCode ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        notes: body.notes ?? null,
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
      for (const field of ["phoneCode", "phone", "email"]) {
        if (body[field] !== undefined) person[field] = body[field];
      }
      if (body.notes !== undefined) person.notes = body.notes;
      return send(200, person);
    }
    if (request.method === "DELETE") {
      person.isActive = false;
      return send(200, person);
    }
  }

  const debtsV2Match = pathname.match(/^\/api\/v2\/people\/([^/]+)\/debts$/);
  if (debtsV2Match && request.method === "GET") {
    const personId = debtsV2Match[1];
    const peopleMap = getPeople(user.id);
    const person = peopleMap.get(personId);
    if (!person) return send(404, { message: "Person not found" });

    const hasDebt = person.name.includes("Deuda");
    const debts = {
      personId: person.id,
      name: person.name,
      phoneCode: person.phoneCode ?? null,
      phone: person.phone ?? null,
      email: person.email ?? null,
      totalDebt: hasDebt ? 2500 : 0,
      periods: hasDebt
        ? [
            {
              period: "2026-09",
              year: 2026,
              month: 9,
              periodName: "Septiembre 2026",
              periodId: "period-2026-09",
              totalDebt: 2500,
              msiInstallments: [
                {
                  id: "msi-1",
                  title: "Laptop Trabajo",
                  currentInstallment: 2,
                  totalInstallments: 6,
                  installmentAmount: 1500,
                  remainingAmount: 6000,
                  nextDueDate: "2026-10-05",
                  cardName: "Banorte Oro",
                },
              ],
              recurringServices: [
                {
                  id: "rec-1",
                  title: "Spotify Familiar",
                  amount: 200,
                  cardName: "Banorte Oro",
                  nextDueDate: "2026-10-01",
                },
              ],
              singleExpenses: [
                {
                  id: "exp-single-1",
                  title: "Cena en restaurante",
                  cardName: "Banorte Oro",
                  amount: 800,
                  date: "2026-09-02",
                  paymentDueDate: "2026-09-20",
                  isPaid: false,
                },
              ],
            },
          ]
        : [],
    };
    return send(200, debts);
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
        ? [{ title: "Laptop Trabajo", currentInstallment: 2, totalInstallments: 6, installmentAmount: 1500, nextDueDate: "2026-10-05", cardName: "Banorte Oro" }]
        : [],
      recurringServices: hasDebt
        ? [{ title: "Spotify Familiar", amount: 200, nextDueDate: "2026-10-01" }]
        : [],
      singleExpenses: hasDebt
        ? [{ id: "exp-single-1", title: "Cena en restaurante", amount: 800, paymentDueDate: "2026-09-20", isPaid: false }]
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

function computePeriodSummary(period, user) {
  const key = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const userIncs = Array.from(getIncomes(user.id).values()).filter(
    (i) => i.periodId === period.id || i.periodId === key || i.periodId === `p-${key}`
  );
  const userExps = Array.from(getExpenses(user.id).values()).filter(
    (e) => e.periodId === period.id || e.periodId === key || e.periodId === `p-${key}`
  );
  const userPeopleMap = getPeople(user.id);

  const totalIncome = userIncs.length > 0 ? userIncs.reduce((sum, i) => sum + i.amount, 0) : period.totalIncome;
  const totalExpenses = userExps.length > 0 ? userExps.reduce((sum, e) => sum + e.amount, 0) : period.totalExpenses;
  const totalReceivedIncome = userIncs.filter((i) => i.isReceived).reduce((sum, i) => sum + i.amount, 0);
  const totalPaidExpenses = userExps.filter((e) => e.isPaid).reduce((sum, e) => sum + e.amount, 0);

  const netBalance = period.carriedSavings + totalIncome - totalExpenses;
  const projectedSavings = period.carriedSavings + totalIncome - totalExpenses;
  const cashInPocketBalance =
    period.carriedSavings +
    (userIncs.length > 0 ? totalReceivedIncome : period.totalIncome) -
    (userExps.length > 0 ? totalPaidExpenses : period.totalExpenses);

  // Payroll surplus
  const payrollIncomes = userIncs.filter((i) => i.source === "PAYROLL");
  const totalPayrollIncome = payrollIncomes.reduce((sum, i) => sum + i.amount, 0);
  const services = userExps.filter((e) => e.category === "SERVICE").reduce((sum, e) => sum + e.amount, 0);
  const subscriptions = userExps.filter((e) => e.category === "SUBSCRIPTION").reduce((sum, e) => sum + e.amount, 0);
  const msi = userExps.filter((e) => e.category === "MSI").reduce((sum, e) => sum + e.amount, 0);
  const fixedCommitments = services + subscriptions + msi;
  const initialDiscretionaryPayrollSurplus = totalPayrollIncome - fixedCommitments;
  const regularExpenses = userExps.filter((e) => e.category === "REGULAR_EXPENSE").reduce((sum, e) => sum + e.amount, 0);
  const remainingDiscretionaryPayrollSurplus = initialDiscretionaryPayrollSurplus - regularExpenses;

  const payrollSurplus = {
    totalPayrollIncome,
    fixedCommitments,
    services,
    subscriptions,
    msi,
    initialDiscretionaryPayrollSurplus,
    regularExpenses,
    remainingDiscretionaryPayrollSurplus,
  };

  // Receivables
  const pendingDebtIncomes = userIncs.filter(
    (i) => !i.isReceived && (i.source === "DEBT_COLLECTION" || i.debtorPersonId)
  );
  const pendingDebtCollections = pendingDebtIncomes.reduce((sum, i) => sum + i.amount, 0);

  const debtorsMap = new Map();
  for (const inc of pendingDebtIncomes) {
    const personId = inc.debtorPersonId || "unknown";
    const personObj = userPeopleMap.get(personId);
    const personName = personObj ? personObj.name : "Persona desconocida";
    if (!debtorsMap.has(personId)) {
      debtorsMap.set(personId, {
        personId,
        name: personName,
        amount: 0,
        earliestDueDate: inc.dueDate || inc.date || null,
        pendingCount: 0,
      });
    }
    const d = debtorsMap.get(personId);
    d.amount += inc.amount;
    d.pendingCount += 1;
    const itemDate = inc.dueDate || inc.date;
    if (itemDate && (!d.earliestDueDate || itemDate < d.earliestDueDate)) {
      d.earliestDueDate = itemDate;
    }
  }

  const receivables = {
    pendingDebtCollections,
    debtors: Array.from(debtorsMap.values()),
  };

  const hasPendingTransactions =
    userExps.some((e) => !e.isPaid) || userIncs.some((i) => !i.isReceived);

  return {
    periodId: period.id,
    year: period.year,
    month: period.month,
    status: period.status,
    totalIncome,
    totalExpenses,
    totalExpectedIncome: totalIncome,
    totalReceivedIncome,
    totalCommittedExpenses: totalExpenses,
    totalPaidExpenses,
    netBalance,
    carriedSavings: period.carriedSavings,
    projectedSavings,
    cashInPocketBalance,
    pendingDebtAmount: pendingDebtCollections,
    hasPendingTransactions,
    payrollSurplus,
    receivables,
  };
}

  if (pathname === "/api/budgets/current/summary") {
    const budgetsMap = getBudgets(user.id);
    const sorted = Array.from(budgetsMap.values()).sort(
      (a, b) => b.year * 100 + b.month - (a.year * 100 + a.month),
    );
    if (sorted.length === 0) return send(404, { message: "No active budget found" });
    const period = sorted[0];
    return send(200, computePeriodSummary(period, user));
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

    return send(200, computePeriodSummary(period, user));
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

  // Recurring endpoints
  if (pathname === "/api/recurring") {
    const recurringMap = getRecurring(user.id);
    if (request.method === "GET") {
      const includeInactive = parsedUrl.searchParams.get("includeInactive") === "true";
      const categoryFilter = parsedUrl.searchParams.get("category");
      let list = Array.from(recurringMap.values());
      if (!includeInactive) {
        list = list.filter((r) => r.isActive && !r.isCancelled);
      }
      if (categoryFilter) {
        list = list.filter((r) => r.category === categoryFilter);
      }
      return send(200, list);
    }
    if (request.method === "POST") {
      if (!body.title || body.title.trim().length < 2) {
        return send(400, { message: "Title must be at least 2 characters" });
      }
      if (!body.category || !body.amount || Number(body.amount) <= 0) {
        return send(400, { message: "Valid category and positive amount required" });
      }
      if (body.category === "MSI") {
        if (!body.totalInstallments || Number(body.totalInstallments) < 2) {
          return send(400, { message: "MSI requires at least 2 installments" });
        }
        if (!body.totalAmount || Number(body.totalAmount) <= 0) {
          return send(400, { message: "MSI requires totalAmount" });
        }
      }

      const template = {
        id: `rec-${randomUUID().slice(0, 8)}`,
        userId: user.id,
        title: body.title.trim(),
        category: body.category,
        amount: Number(body.amount),
        currency: body.currency || "MXN",
        exchangeRate: body.exchangeRate,
        totalAmount: body.totalAmount ? Number(body.totalAmount) : undefined,
        totalInstallments: body.totalInstallments ? Number(body.totalInstallments) : undefined,
        currentInstallment: body.currentInstallment ? Number(body.currentInstallment) : (body.category === "MSI" ? 1 : undefined),
        startDate: body.startDate,
        cardId: body.cardId || undefined,
        split: body.split || undefined,
        isActive: true,
        isCancelled: false,
        notes: body.notes ? body.notes.trim() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      recurringMap.set(template.id, template);
      return send(201, template);
    }
  }

  if (pathname === "/api/recurring/instantiate" && request.method === "POST") {
    // Simulate the agreed API contract; production atomicity belongs to Budget-API.
    const period = Array.from(getBudgets(user.id).values()).find((p) => p.id === body.periodId);
    if (!period) return send(404, { message: "Period not found" });
    if (period.status !== "OPEN") return send(409, { message: "Period is closed" });
    const expenses = getExpenses(user.id);
    let createdCount = 0;
    let skippedCount = 0;
    const monthKey = `${period.year}-${String(period.month).padStart(2, "0")}`;
    for (const template of getRecurring(user.id).values()) {
      const existing = Array.from(expenses.values()).some((e) => e.periodId === period.id && e.templateId === template.id);
      if (existing) { skippedCount++; continue; }
      if (!template.isActive || template.isCancelled || (template.startDate && template.startDate.slice(0, 7) > monthKey)) continue;
      const id = `expense-${randomUUID().slice(0, 8)}`;
      expenses.set(id, { id, userId: user.id, periodId: period.id, templateId: template.id,
        title: template.title, amount: template.amount, category: template.category === "OTHER_RECURRING" ? "OTHER" : template.category,
        date: `${monthKey}-01`, cardId: template.cardId ?? null, isPaid: false, notes: template.notes ?? null,
      });
      createdCount++;
    }
    return send(200, { periodId: period.id, year: period.year, month: period.month, createdCount, skippedCount });
  }

  const recurringMatch = pathname.match(/^\/api\/recurring\/([^/]+)$/);
  if (recurringMatch) {
    const recId = recurringMatch[1];
    const recurringMap = getRecurring(user.id);
    const template = recurringMap.get(recId);
    if (!template) return send(404, { message: "Recurring template not found" });

    if (request.method === "GET") return send(200, template);
    if (request.method === "PATCH") {
      if (body.title) template.title = body.title.trim();
      if (body.amount !== undefined) template.amount = Number(body.amount);
      if (body.cardId !== undefined) template.cardId = body.cardId || undefined;
      if (body.split !== undefined) template.split = body.split || undefined;
      if (body.notes !== undefined) template.notes = body.notes ? body.notes.trim() : undefined;
      if (body.isActive !== undefined) template.isActive = Boolean(body.isActive);
      template.updatedAt = new Date().toISOString();
      return send(200, template);
    }
    if (request.method === "DELETE") {
      template.isActive = false;
      template.updatedAt = new Date().toISOString();
      return send(200, template);
    }
  }

  const recurringCancelMatch = pathname.match(/^\/api\/recurring\/([^/]+)\/cancel$/);
  if (recurringCancelMatch && request.method === "PATCH") {
    const recId = recurringCancelMatch[1];
    const recurringMap = getRecurring(user.id);
    const template = recurringMap.get(recId);
    if (!template) return send(404, { message: "Recurring template not found" });
    template.isCancelled = true;
    template.isActive = false;
    template.updatedAt = new Date().toISOString();
    return send(200, template);
  }

  const recurringAdvanceMatch = pathname.match(/^\/api\/recurring\/([^/]+)\/advance$/);
  if (recurringAdvanceMatch && request.method === "POST") {
    const recId = recurringAdvanceMatch[1];
    const recurringMap = getRecurring(user.id);
    const template = recurringMap.get(recId);
    if (!template) return send(404, { message: "Recurring template not found" });
    if (template.category !== "MSI") return send(400, { message: "Only MSI plans can be advanced" });

    if (body.payAll) {
      template.currentInstallment = template.totalInstallments;
      template.isActive = false;
    } else if (body.installmentsCount) {
      const advanceBy = Number(body.installmentsCount);
      template.currentInstallment = Math.min(
        template.totalInstallments || 1,
        (template.currentInstallment || 1) + advanceBy,
      );
      if (template.currentInstallment >= (template.totalInstallments || 1)) {
        template.isActive = false;
      }
    }
    if (body.notes) {
      template.notes = template.notes ? `${template.notes}. ${body.notes}` : body.notes;
    }
    template.updatedAt = new Date().toISOString();
    return send(200, template);
  }

  // Incomes copy-from-previous-month
  if (pathname === "/api/incomes/copy-from-previous-month" && request.method === "POST") {
    const { fromPeriodId, toPeriodId } = body;
    if (!fromPeriodId || !toPeriodId) return send(400, { message: "fromPeriodId and toPeriodId are required" });

    // Check if destination is closed
    const budgetsMap = getBudgets(user.id);
    for (const b of budgetsMap.values()) {
      if ((b.id === toPeriodId || `${b.year}-${String(b.month).padStart(2, "0")}` === toPeriodId) && b.status === "CLOSED") {
        return send(400, { message: "Cannot copy incomes to a closed period" });
      }
    }

    const incomesMap = getIncomes(user.id);
    const fromIncomes = Array.from(incomesMap.values()).filter(
      (inc) => (inc.periodId === fromPeriodId || inc.periodId === `p-${fromPeriodId}`) && inc.source !== "DEBT_COLLECTION"
    );

    const cleanTo = toPeriodId.replace(/^p-/, "");
    let targetYear = null;
    let targetMonth = null;
    for (const b of budgetsMap.values()) {
      if (b.id === toPeriodId || `${b.year}-${String(b.month).padStart(2, "0")}` === cleanTo) {
        targetYear = b.year;
        targetMonth = b.month;
        break;
      }
    }
    if (!targetYear) {
      const parts = cleanTo.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        targetYear = parts[0];
        targetMonth = parts[1];
      }
    }
    const maxDays = targetYear && targetMonth ? new Date(targetYear, targetMonth, 0).getDate() : 28;


    let copiedCount = 0;
    const copiedItems = [];

    for (const orig of fromIncomes) {
      const alreadyExists = Array.from(incomesMap.values()).some(
        (inc) => (inc.periodId === toPeriodId || inc.periodId === `p-${toPeriodId}`) && inc.title === orig.title
      );
      if (!alreadyExists) {
        let newDate = orig.date;
        if (targetYear && targetMonth) {
          const origDay = Number(orig.date.slice(8, 10)) || 1;
          const cappedDay = Math.min(origDay, maxDays);
          newDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(cappedDay).padStart(2, "0")}`;
        }
        const newIncome = {
          id: "inc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
          userId: user.id,
          periodId: toPeriodId,
          title: orig.title,
          amount: orig.amount,
          date: newDate,
          source: orig.source,
          isReceived: false,
          notes: orig.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        incomesMap.set(newIncome.id, newIncome);
        copiedItems.push(newIncome);
        copiedCount++;
      }
    }
    return send(200, { success: true, count: copiedCount, items: copiedItems });
  }

  // Incomes collection
  if (pathname === "/api/incomes") {
    const incomesMap = getIncomes(user.id);
    if (request.method === "GET") {
      const periodId = parsedUrl.searchParams.get("periodId");
      let list = Array.from(incomesMap.values());
      if (periodId) {
        list = list.filter((i) => i.periodId === periodId || i.periodId === `p-${periodId}` || `p-${i.periodId}` === periodId);
      }
      return send(200, list);
    }
    if (request.method === "POST") {
      if (!body.title || !body.title.trim()) return send(400, { message: "Title is required" });
      if (!body.amount || Number(body.amount) <= 0) return send(400, { message: "Amount must be positive" });
      if (!body.date) return send(400, { message: "Date is required" });
      if (!body.source) return send(400, { message: "Source is required" });
      if (!body.periodId) return send(400, { message: "Period is required" });

      const budgetsMap = getBudgets(user.id);
      for (const b of budgetsMap.values()) {
        if ((b.id === body.periodId || `${b.year}-${String(b.month).padStart(2, "0")}` === body.periodId) && b.status === "CLOSED") {
          return send(400, { message: "Cannot add incomes to a closed budget period" });
        }
      }

      const income = {
        id: "inc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        userId: user.id,
        periodId: body.periodId,
        title: body.title.trim(),
        amount: Number(body.amount),
        date: body.date,
        source: body.source,
        isReceived: Boolean(body.isReceived),
        dueDate: body.dueDate || undefined,
        debtorPersonId: body.debtorPersonId || undefined,
        notes: body.notes ? body.notes.trim() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      incomesMap.set(income.id, income);
      return send(201, income);
    }
  }

  // Incomes single item
  const incomeMatch = pathname.match(/^\/api\/incomes\/([^/]+)$/);
  if (incomeMatch) {
    const incId = incomeMatch[1];
    const incomesMap = getIncomes(user.id);
    const income = incomesMap.get(incId);
    if (!income) return send(404, { message: "Income not found" });

    if (request.method === "GET") return send(200, income);
    if (request.method === "PATCH") {
      if (body.title) income.title = body.title.trim();
      if (body.amount !== undefined) income.amount = Number(body.amount);
      if (body.date) income.date = body.date;
      if (body.source) income.source = body.source;
      if (body.isReceived !== undefined) income.isReceived = Boolean(body.isReceived);
      if (body.dueDate !== undefined) income.dueDate = body.dueDate || undefined;
      if (body.notes !== undefined) income.notes = body.notes ? body.notes.trim() : undefined;
      income.updatedAt = new Date().toISOString();
      return send(200, income);
    }
    if (request.method === "DELETE") {
      if (income.linkedExpenseId && income.isReceived) {
        return send(400, { message: "Cannot delete a received debt collection income" });
      }
      incomesMap.delete(incId);
      return send(200, { success: true });
    }
  }

  // Expenses collection
  if (pathname === "/api/expenses") {
    const expensesMap = getExpenses(user.id);
    const incomesMap = getIncomes(user.id);

    if (request.method === "GET") {
      const periodId = parsedUrl.searchParams.get("periodId");
      const category = parsedUrl.searchParams.get("category");
      let list = Array.from(expensesMap.values());
      if (periodId) {
        list = list.filter((e) => e.periodId === periodId || e.periodId === `p-${periodId}` || `p-${e.periodId}` === periodId);
      }
      if (category) {
        list = list.filter((e) => e.category === category);
      }
      return send(200, list);
    }
    if (request.method === "POST") {
      if (!body.title || !body.title.trim()) return send(400, { message: "Title is required" });
      if (!body.amount || Number(body.amount) <= 0) return send(400, { message: "Amount must be positive" });
      if (!body.category) return send(400, { message: "Category is required" });
      if (!body.date) return send(400, { message: "Date is required" });
      if (!body.periodId) return send(400, { message: "Period is required" });

      const budgetsMap = getBudgets(user.id);
      for (const b of budgetsMap.values()) {
        if ((b.id === body.periodId || `${b.year}-${String(b.month).padStart(2, "0")}` === body.periodId) && b.status === "CLOSED") {
          return send(400, { message: "Cannot add expenses to a closed budget period" });
        }
      }

      const expense = {
        id: "exp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        userId: user.id,
        periodId: body.periodId,
        title: body.title.trim(),
        amount: Number(body.amount),
        category: body.category,
        date: body.date,
        cardId: body.cardId || undefined,
        templateId: body.templateId || undefined,
        paymentDueDate: body.paymentDueDate || undefined,
        isPaid: Boolean(body.isPaid),
        split: body.split || undefined,
        notes: body.notes ? body.notes.trim() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expensesMap.set(expense.id, expense);

      // Auto-create linked split income if split provided
      if (expense.split && expense.split.personId) {
        let debtAmount = expense.amount;
        if (expense.split.splitType === "PERCENTAGE") {
          debtAmount = Math.round((expense.amount * (Number(expense.split.splitValue) / 100)) * 100) / 100;
        } else {
          debtAmount = Math.min(expense.amount, Number(expense.split.splitValue));
        }
        const splitIncome = {
          id: "inc-split-" + expense.id,
          userId: user.id,
          periodId: expense.periodId,
          title: "Cobro: " + expense.title,
          amount: debtAmount,
          date: expense.date,
          source: "DEBT_COLLECTION",
          isReceived: false,
          dueDate: expense.paymentDueDate || expense.date,
          debtorPersonId: expense.split.personId,
          linkedExpenseId: expense.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        incomesMap.set(splitIncome.id, splitIncome);
      }

      return send(201, expense);
    }
  }

  // Expenses single item
  const expenseMatch = pathname.match(/^\/api\/expenses\/([^/]+)$/);
  if (expenseMatch) {
    const expId = expenseMatch[1];
    const expensesMap = getExpenses(user.id);
    const incomesMap = getIncomes(user.id);
    const expense = expensesMap.get(expId);
    if (!expense) return send(404, { message: "Expense not found" });

    if (request.method === "GET") return send(200, expense);
    if (request.method === "PATCH") {
      if (body.title) expense.title = body.title.trim();
      if (body.amount !== undefined) expense.amount = Number(body.amount);
      if (body.category) expense.category = body.category;
      if (body.date) expense.date = body.date;
      if (body.cardId !== undefined) expense.cardId = body.cardId || undefined;
      if (body.paymentDueDate !== undefined) expense.paymentDueDate = body.paymentDueDate || undefined;
      if (body.isPaid !== undefined) expense.isPaid = Boolean(body.isPaid);
      if (body.notes !== undefined) expense.notes = body.notes ? body.notes.trim() : undefined;

      if (body.split !== undefined) {
        if (body.split && body.split.personId) {
          expense.split = body.split;
          let debtAmount = expense.amount;
          if (expense.split.splitType === "PERCENTAGE") {
            debtAmount = Math.round((expense.amount * (Number(expense.split.splitValue) / 100)) * 100) / 100;
          } else {
            debtAmount = Math.min(expense.amount, Number(expense.split.splitValue));
          }
          const existingSplitIncome = incomesMap.get("inc-split-" + expense.id);
          if (existingSplitIncome) {
            existingSplitIncome.amount = debtAmount;
            existingSplitIncome.debtorPersonId = expense.split.personId;
            existingSplitIncome.title = "Cobro: " + expense.title;
            existingSplitIncome.updatedAt = new Date().toISOString();
          } else {
            const splitIncome = {
              id: "inc-split-" + expense.id,
              userId: user.id,
              periodId: expense.periodId,
              title: "Cobro: " + expense.title,
              amount: debtAmount,
              date: expense.date,
              source: "DEBT_COLLECTION",
              isReceived: false,
              dueDate: expense.paymentDueDate || expense.date,
              debtorPersonId: expense.split.personId,
              linkedExpenseId: expense.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            incomesMap.set(splitIncome.id, splitIncome);
          }
        } else {
          expense.split = undefined;
          const existingSplitIncome = incomesMap.get("inc-split-" + expense.id);
          if (existingSplitIncome && !existingSplitIncome.isReceived) {
            incomesMap.delete("inc-split-" + expense.id);
          }
        }
      }

      expense.updatedAt = new Date().toISOString();
      return send(200, expense);
    }
    if (request.method === "DELETE") {
      const linkedIncome = incomesMap.get("inc-split-" + expense.id);
      if (linkedIncome && !linkedIncome.isReceived) {
        incomesMap.delete("inc-split-" + expense.id);
      }
      expensesMap.delete(expId);
      return send(200, { success: true });
    }
  }

  // Web Push public key
  if (pathname === "/api/notifications/web-push/public-key" && request.method === "GET") {
    return send(200, {
      publicKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-Skv6_synthetic_vapid_public_key_for_testing",
    });
  }

  // Web Push subscribe
  if (pathname === "/api/notifications/web-push/subscribe" && request.method === "POST") {
    if (!body.endpoint || !body.keys || !body.keys.p256dh || !body.keys.auth) {
      return send(400, { message: "endpoint and keys (p256dh, auth) required" });
    }
    const subsMap = getPushSubscriptions(user.id);
    const sub = {
      endpoint: body.endpoint,
      keys: {
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      userAgent: body.userAgent,
      createdAt: new Date().toISOString(),
    };
    subsMap.set(body.endpoint, sub);
    return send(201, { success: true, message: "Suscripción registrada" });
  }

  // Web Push unsubscribe
  if (pathname === "/api/notifications/web-push/unsubscribe" && request.method === "DELETE") {
    const endpoint = body.endpoint;
    if (!endpoint) return send(400, { message: "endpoint required" });
    const subsMap = getPushSubscriptions(user.id);
    subsMap.delete(endpoint);
    return send(200, { success: true, message: "Suscripción eliminada" });
  }

  // Notification test
  if (pathname === "/api/notifications/test" && request.method === "POST") {
    const channel = body.channel || "ALL";
    const subsMap = getPushSubscriptions(user.id);
    const pushCount = subsMap.size;
    return send(200, {
      success: true,
      channel,
      pushResult: {
        sent: channel === "EMAIL" ? false : true,
        recipientCount: pushCount,
      },
      emailResult: {
        sent: channel === "WEB_PUSH" ? false : true,
        recipientEmail: user.email,
      },
    });
  }

  // Trigger reminders
  if (pathname === "/api/notifications/trigger-reminders" && request.method === "POST") {
    const expensesMap = getExpenses(user.id);
    const incomesMap = getIncomes(user.id);
    const pendingExpenses = Array.from(expensesMap.values()).filter((e) => !e.isPaid);
    const pendingIncomes = Array.from(incomesMap.values()).filter((i) => !i.isReceived);
    const count = pendingExpenses.length + pendingIncomes.length;
    return send(200, {
      success: true,
      remindersProcessed: count,
      timestamp: new Date().toISOString(),
    });
  }

  return send(404, {});
});

server.listen(3101, "127.0.0.1");
for (const event of ["SIGINT", "SIGTERM"]) process.on(event, () => server.close(() => process.exit(0)));
