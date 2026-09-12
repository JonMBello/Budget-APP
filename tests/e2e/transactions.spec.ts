import { expect, test, type APIRequestContext } from "@playwright/test";

const origin = "http://127.0.0.1:3003";
const credentials = { email: "transactions@example.test", password: "integration-only-password" };

async function login(request: APIRequestContext) {
  return request.post("/app/bff/auth/login", {
    headers: { Origin: origin },
    data: credentials,
  });
}

test.describe("Transactions, Expenses, Incomes and Splits (FE-07)", () => {
  test.describe.configure({ mode: "serial" });

  let activePeriodId = "";
  let previousPeriodId = "";
  let creditCardId = "";
  let personId = "";

  test("initializes periods, credit card, and contact person", async ({ request }) => {
    await login(request);

    // Initialize previous period 2026-02
    const prevPeriodRes = await request.post("/app/bff/budgets/initialize", {
      headers: { Origin: origin },
      data: { year: 2026, month: 2 },
    });
    expect([200, 201]).toContain(prevPeriodRes.status());
    const prevPeriod = await prevPeriodRes.json();
    previousPeriodId = prevPeriod.id;

    // Initialize current period 2026-03
    const periodRes = await request.post("/app/bff/budgets/initialize", {
      headers: { Origin: origin },
      data: { year: 2026, month: 3 },
    });
    expect([200, 201]).toContain(periodRes.status());
    const period = await periodRes.json();
    activePeriodId = period.id;


    // Create credit card
    const cardRes = await request.post("/app/bff/cards", {
      headers: { Origin: origin },
      data: {
        name: "BBVA Oro Test",
        type: "CREDIT",
        color: "#2563eb",
        cutoffDay: 15,
        paymentDueDay: 5,
        creditLimit: 50000,
      },
    });
    expect(cardRes.status()).toBe(201);
    const card = await cardRes.json();
    creditCardId = card.id;

    // Create person
    const personRes = await request.post("/app/bff/people", {
      headers: { Origin: origin },
      data: {
        name: "Carlos Dividido",
        email: "carlos@example.test",
      },
    });
    expect(personRes.status()).toBe(201);
    const person = await personRes.json();
    personId = person.id;
  });

  test("creates expenses with validation, card preview and toggle isPaid", async ({ request }) => {
    await login(request);

    // Rejects missing title
    const invalidTitle = await request.post("/app/bff/expenses", {
      headers: { Origin: origin },
      data: {
        periodId: activePeriodId,
        title: "",
        amount: 500,
        category: "FOOD",
        date: "2026-03-05",
      },
    });
    expect(invalidTitle.status()).toBe(400);

    // Rejects non-positive amount
    const invalidAmount = await request.post("/app/bff/expenses", {
      headers: { Origin: origin },
      data: {
        periodId: activePeriodId,
        title: "Comida",
        amount: 0,
        category: "FOOD",
        date: "2026-03-05",
      },
    });
    expect(invalidAmount.status()).toBe(400);

    // Credit card preview calculation
    const previewRes = await request.get(
      `/app/bff/cards/${creditCardId}/preview?date=2026-03-10`,
    );
    expect(previewRes.status()).toBe(200);
    const preview = await previewRes.json();
    expect(preview).toHaveProperty("paymentDueDate");
    expect(preview.paymentDueDate).toBe("2026-04-05");

    // Valid expense creation with credit card
    const createRes = await request.post("/app/bff/expenses", {
      headers: { Origin: origin },
      data: {
        periodId: activePeriodId,
        title: "Supermercado Semanal",
        amount: 1450.5,
        category: "FOOD",
        date: "2026-03-10",
        cardId: creditCardId,
        paymentDueDate: preview.paymentDueDate,
        isPaid: false,
        notes: "Despensa del mes",
      },
    });
    expect(createRes.status()).toBe(201);
    const expense = await createRes.json();
    expect(expense).toMatchObject({
      title: "Supermercado Semanal",
      amount: 1450.5,
      category: "FOOD",
      isPaid: false,
      cardId: creditCardId,
    });

    // Toggle isPaid to true
    const patchRes = await request.patch(`/app/bff/expenses/${expense.id}`, {
      headers: { Origin: origin },
      data: { isPaid: true },
    });
    expect(patchRes.status()).toBe(200);
    const patched = await patchRes.json();
    expect(patched.isPaid).toBe(true);

    // Delete expense
    const deleteRes = await request.delete(`/app/bff/expenses/${expense.id}`, {
      headers: { Origin: origin },
    });
    expect(deleteRes.status()).toBe(200);
  });

  test("creates split expense and automatically generates linked DEBT_COLLECTION income", async ({
    request,
  }) => {
    await login(request);

    // Create split expense: $1,200.00 split 50% with Carlos
    const splitExpenseRes = await request.post("/app/bff/expenses", {
      headers: { Origin: origin },
      data: {
        periodId: activePeriodId,
        title: "Cena Restaurante Italiano",
        amount: 1200,
        category: "ENTERTAINMENT",
        date: "2026-03-12",
        split: {
          personId,
          splitType: "PERCENTAGE",
          splitValue: 50,
          isDebtActive: true,
        },
      },
    });
    expect(splitExpenseRes.status()).toBe(201);
    const expense = await splitExpenseRes.json();
    expect(expense.split).toMatchObject({
      personId,
      splitType: "PERCENTAGE",
      splitValue: 50,
    });

    // Check that DEBT_COLLECTION income was automatically created for $600.00
    const incomesRes = await request.get(`/app/bff/incomes?periodId=${activePeriodId}`);
    expect(incomesRes.status()).toBe(200);
    const incomes = await incomesRes.json();

    const linkedIncome = incomes.find(
      (inc: { linkedExpenseId?: string }) => inc.linkedExpenseId === expense.id,
    );
    expect(linkedIncome).toBeDefined();
    expect(linkedIncome).toMatchObject({
      source: "DEBT_COLLECTION",
      amount: 600,
      debtorPersonId: personId,
      isReceived: false,
    });

    // Updating expense amount to 1500 synchronizes the linked split debt to 750
    const updateRes = await request.patch(`/app/bff/expenses/${expense.id}`, {
      headers: { Origin: origin },
      data: {
        amount: 1500,
        split: {
          personId,
          splitType: "PERCENTAGE",
          splitValue: 50,
        },
      },
    });
    expect(updateRes.status()).toBe(200);

    const updatedIncomesRes = await request.get(`/app/bff/incomes?periodId=${activePeriodId}`);
    const updatedIncomes = await updatedIncomesRes.json();
    const updatedLinked = updatedIncomes.find(
      (inc: { linkedExpenseId?: string }) => inc.linkedExpenseId === expense.id,
    );
    expect(updatedLinked.amount).toBe(750);
  });

  test("creates incomes by source, toggles received status, and manages records", async ({
    request,
  }) => {
    await login(request);

    // Create payroll income
    const createRes = await request.post("/app/bff/incomes", {
      headers: { Origin: origin },
      data: {
        periodId: activePeriodId,
        title: "Sueldo Quincena 1",
        amount: 22000,
        source: "PAYROLL",
        date: "2026-03-15",
        isReceived: false,
      },
    });
    expect(createRes.status()).toBe(201);
    const income = await createRes.json();
    expect(income).toMatchObject({
      title: "Sueldo Quincena 1",
      amount: 22000,
      source: "PAYROLL",
      isReceived: false,
    });

    // Toggle isReceived to true
    const patchRes = await request.patch(`/app/bff/incomes/${income.id}`, {
      headers: { Origin: origin },
      data: { isReceived: true },
    });
    expect(patchRes.status()).toBe(200);
    const patched = await patchRes.json();
    expect(patched.isReceived).toBe(true);

    // Update income title and notes
    const updateRes = await request.patch(`/app/bff/incomes/${income.id}`, {
      headers: { Origin: origin },
      data: { notes: "Depósito de nómina confirmado" },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.notes).toBe("Depósito de nómina confirmado");
  });

  test("copies incomes from previous month, adjusting calendar dates and omitting debt collections", async ({
    request,
  }) => {
    await login(request);

    // Register an income in previous period 2026-02 (e.g. salary and side income)
    const prevSalary = await request.post("/app/bff/incomes", {
      headers: { Origin: origin },
      data: {
        periodId: previousPeriodId,
        title: "Nómina Mensual Base",
        amount: 28000,
        source: "PAYROLL",
        date: "2026-02-15",
        isReceived: true,
      },
    });
    expect(prevSalary.status()).toBe(201);

    // Register a debt collection in previous period 2026-02
    const prevDebt = await request.post("/app/bff/incomes", {
      headers: { Origin: origin },
      data: {
        periodId: previousPeriodId,
        title: "Cobro préstamo Carlos",
        amount: 1000,
        source: "DEBT_COLLECTION",
        date: "2026-02-20",
        isReceived: true,
      },
    });
    expect(prevDebt.status()).toBe(201);

    // Call copy-from-previous-month to active period 2026-03
    const copyRes = await request.post("/app/bff/incomes/copy-from-previous-month", {
      headers: { Origin: origin },
      data: {
        fromPeriodId: previousPeriodId,
        toPeriodId: activePeriodId,
      },
    });
    expect(copyRes.status()).toBe(200);
    const copyData = await copyRes.json();
    const copied = Array.isArray(copyData) ? copyData : copyData.items ?? [];

    // Verify only the payroll was copied and not the debt collection
    const copiedSalary = copied.find((i: { title: string }) => i.title === "Nómina Mensual Base");
    expect(copiedSalary).toBeDefined();
    expect(copiedSalary.isReceived).toBe(false);
    expect(copiedSalary.date).toBe("2026-03-15");

    const copiedDebt = copied.find((i: { title: string }) => i.title === "Cobro préstamo Carlos");
    expect(copiedDebt).toBeUndefined();

    // Idempotence: copying again doesn't duplicate
    const copyAgain = await request.post("/app/bff/incomes/copy-from-previous-month", {
      headers: { Origin: origin },
      data: {
        fromPeriodId: previousPeriodId,
        toPeriodId: activePeriodId,
      },
    });
    expect(copyAgain.status()).toBe(200);
    const copyAgainData = await copyAgain.json();
    const copiedAgain = Array.isArray(copyAgainData) ? copyAgainData : copyAgainData.items ?? [];
    expect(copiedAgain.length).toBe(0);
  });


  test("blocks creating expenses or incomes in a closed budget period", async ({ request }) => {
    await login(request);

    // Create and close a temporary budget period 2025-12
    const newPeriodRes = await request.post("/app/bff/budgets/initialize", {
      headers: { Origin: origin },
      data: { year: 2025, month: 12 },
    });
    expect([200, 201]).toContain(newPeriodRes.status());
    const period = await newPeriodRes.json();


    // Close the period
    const closeRes = await request.patch(`/app/bff/budgets/2025/12/status`, {
      headers: { Origin: origin },
      data: { status: "CLOSED" },
    });
    expect(closeRes.status()).toBe(200);

    // Attempt to add expense to closed period fails
    const failExpense = await request.post("/app/bff/expenses", {
      headers: { Origin: origin },
      data: {
        periodId: period.id,
        title: "Gasto en mes cerrado",
        amount: 300,
        category: "OTHER",
        date: "2025-12-10",
      },
    });
    expect(failExpense.status()).toBe(400);

    // Attempt to add income to closed period fails
    const failIncome = await request.post("/app/bff/incomes", {
      headers: { Origin: origin },
      data: {
        periodId: period.id,
        title: "Ingreso en mes cerrado",
        amount: 500,
        source: "OTHER",
        date: "2025-12-10",
      },
    });
    expect(failIncome.status()).toBe(400);
  });

  test("renders expenses and incomes server-side pages", async ({ request }) => {
    await login(request);

    // Server-rendered /app/expenses
    const expensesPage = await request.get("/app/expenses?period=2026-03");
    expect(expensesPage.status()).toBe(200);
    const expensesHtml = await expensesPage.text();
    expect(expensesHtml).toContain("Gastos");

    // Server-rendered /app/incomes
    const incomesPage = await request.get("/app/incomes?period=2026-03");
    expect(incomesPage.status()).toBe(200);
    const incomesHtml = await incomesPage.text();
    expect(incomesHtml).toContain("Ingresos");
  });
});
