import { expect, test, type APIRequestContext } from "@playwright/test";

const origin = "http://127.0.0.1:3003";
const credentials = {
  email: "cashflow@example.test",
  password: "integration-only-password",
};

async function login(request: APIRequestContext) {
  return request.post("/app/bff/auth/login", {
    headers: { Origin: origin },
    data: credentials,
  });
}

test.describe("Metrics, Balance, Payroll Surplus and Cashflow (FE-08)", () => {
  test.describe.configure({ mode: "serial" });

  let periodId = "";
  let personId = "";
  let cardId = "";
  let expenseLuzId = "";

  test("initializes period, person, card, and movements with certified scenario amounts", async ({
    request,
  }) => {
    await login(request);

    // 1. Initialize budget period 2026-09 with carriedSavings: 1000
    const periodRes = await request.post("/app/bff/budgets/initialize", {
      headers: { Origin: origin },
      data: {
        year: 2026,
        month: 9,
        carriedSavings: 1000,
        notes: "Periodo para pruebas de flujo de caja y nómina",
      },
    });
    expect([200, 201]).toContain(periodRes.status());
    const period = await periodRes.json();
    periodId = period.id;

    // 2. Create person for debtor test
    const personRes = await request.post("/app/bff/people", {
      headers: { Origin: origin },
      data: {
        name: "Carlos Slim Test",
        email: "carlos@test.com",
      },
    });
    expect(personRes.status()).toBe(201);
    const person = await personRes.json();
    personId = person.id;

    // 3. Create credit card
    const cardRes = await request.post("/app/bff/cards", {
      headers: { Origin: origin },
      data: {
        name: "BBVA Oro Cashflow",
        type: "CREDIT",
        color: "#1e40af",
        cutoffDay: 10,
        paymentDueDay: 28,
        creditLimit: 30000,
      },
    });
    expect(cardRes.status()).toBe(201);
    const card = await cardRes.json();
    cardId = card.id;

    // 4. Create expenses for HU-FE-08.2 certified test case:
    // Services: 1500, Subscriptions: 600, MSI: 4000, Regular: 3000
    const luzRes = await request.post("/app/bff/expenses", {
      headers: { Origin: origin },
      data: {
        periodId,
        title: "Luz CFE",
        amount: 1500,
        category: "SERVICE",
        date: "2026-09-01",
        paymentDueDate: "2026-09-05", // Overdue
        isPaid: false,
      },
    });
    expect(luzRes.status()).toBe(201);
    const luz = await luzRes.json();
    expenseLuzId = luz.id;

    const streamingRes = await request.post("/app/bff/expenses", {
      headers: { Origin: origin },
      data: {
        periodId,
        title: "Streaming y Música",
        amount: 600,
        category: "SUBSCRIPTION",
        date: "2026-09-08",
        paymentDueDate: "2026-09-28",
        cardId,
        isPaid: false,
      },
    });
    expect(streamingRes.status()).toBe(201);

    const msiRes = await request.post("/app/bff/expenses", {
      headers: { Origin: origin },
      data: {
        periodId,
        title: "Laptop MSI Cuota 1",
        amount: 4000,
        category: "MSI",
        date: "2026-09-12",
        paymentDueDate: "2026-09-25",
        cardId,
        isPaid: false,
      },
    });
    expect(msiRes.status()).toBe(201);

    const regularRes = await request.post("/app/bff/expenses", {
      headers: { Origin: origin },
      data: {
        periodId,
        title: "Supermercado Semanal",
        amount: 3000,
        category: "REGULAR_EXPENSE",
        date: "2026-09-15",
        paymentDueDate: "2026-09-18",
        isPaid: false,
      },
    });
    expect(regularRes.status()).toBe(201);

    // 5. Create incomes:
    // Payroll: 25000, Debt collection: 800
    const payrollRes = await request.post("/app/bff/incomes", {
      headers: { Origin: origin },
      data: {
        periodId,
        title: "Nómina Mensual",
        amount: 25000,
        source: "PAYROLL",
        date: "2026-09-15",
        isReceived: false,
      },
    });
    expect(payrollRes.status()).toBe(201);

    const debtRes = await request.post("/app/bff/incomes", {
      headers: { Origin: origin },
      data: {
        periodId,
        title: "Cobro Cena Compartida",
        amount: 800,
        source: "DEBT_COLLECTION",
        debtorPersonId: personId,
        date: "2026-09-02",
        dueDate: "2026-09-22",
        isReceived: false,
      },
    });
    expect(debtRes.status()).toBe(201);
  });

  test("verifies certified calculations via summary API (TICKET-FE-08.1 & TICKET-FE-08.2)", async ({
    request,
  }) => {
    await login(request);

    const summaryRes = await request.get("/app/bff/budgets/2026/9/summary", {
      headers: { Origin: origin },
    });
    expect(summaryRes.status()).toBe(200);
    const summary = await summaryRes.json();

    // Certified Balance Calculations:
    // carriedSavings: 1000, totalIncome: 25800, totalExpenses: 9100
    // netBalance (balance proyectado): 1000 + 25800 - 9100 = 17700
    // cashInPocketBalance: 1000 + 0 - 0 = 1000
    expect(summary.carriedSavings).toBe(1000);
    expect(summary.totalIncome).toBe(25800);
    expect(summary.totalExpenses).toBe(9100);
    expect(summary.netBalance).toBe(17700);
    expect(summary.cashInPocketBalance).toBe(1000);

    // Certified Payroll Surplus:
    // Total Payroll: 25000, Fijos: 6100 (Services 1500 + Subscriptions 600 + MSI 4000)
    // Inicial: 18900 (25000 - 6100), Regulares: 3000, Restante: 15900 (18900 - 3000)
    expect(summary.payrollSurplus).toBeDefined();
    expect(summary.payrollSurplus).toMatchObject({
      totalPayrollIncome: 25000,
      services: 1500,
      subscriptions: 600,
      msi: 4000,
      fixedCommitments: 6100,
      initialDiscretionaryPayrollSurplus: 18900,
      regularExpenses: 3000,
      remainingDiscretionaryPayrollSurplus: 15900,
    });

    // Receivables:
    expect(summary.receivables).toBeDefined();
    expect(summary.receivables.pendingDebtCollections).toBe(800);
    expect(summary.receivables.debtors).toHaveLength(1);
    expect(summary.receivables.debtors[0]).toMatchObject({
      personId,
      name: "Carlos Slim Test",
      amount: 800,
      pendingCount: 1,
    });
  });

  test("renders dashboard server page with balance cards, payroll breakdown, agenda, and disclaimers", async ({
    request,
  }) => {
    await login(request);

    // Fetch dashboard page for active period
    const pageRes = await request.get("/app?period=2026-09");
    expect(pageRes.status()).toBe(200);
    const html = await pageRes.text();

    // Verify Month header
    expect(html).toContain("Septiembre de 2026");

    // Verify Cashflow Balance Cards
    expect(html).toContain("Balance proyectado");
    expect(html).toContain("$17,700.00");
    expect(html).toContain("Efectivo según registros");
    expect(html).toContain("$1,000.00");

    // Verify Payroll Surplus Widget & Breakdown
    expect(html).toContain("Remanente de Nómina");
    expect(html).toContain("$15,900.00");
    expect(html).toContain("$25,000.00");
    expect(html).toContain("$6,100.00");
    expect(html).toContain("$18,900.00");
    expect(html).toContain("$3,000.00");

    // Verify disclaimers
    expect(html).toContain(
      "La fórmula considera toda la nómina presupuestada para el mes",
    );
    expect(html).toContain(
      "Categorías de consumo diario o variable",
    );

    // Verify Receivables & Debtor
    expect(html).toContain("Carlos Slim Test");
    expect(html).toContain("$800.00");
    expect(html).toContain("Ver cuenta global");

    // Verify Agenda items & disclaimers
    expect(html).toContain("Agenda de Flujo de Caja");
    expect(html).toContain("Luz CFE");
    expect(html).toContain("$1,500.00");
    expect(html).toContain(
      "no representa saldo bancario disponible ni el pago mínimo requerido por tu banco",
    );
  });

  test("toggles expense as paid and verifies cash in pocket updates reactively", async ({
    request,
  }) => {
    await login(request);

    // Mark Luz CFE ($1,500) as paid
    const patchRes = await request.patch(`/app/bff/expenses/${expenseLuzId}`, {
      headers: { Origin: origin },
      data: { isPaid: true },
    });
    expect(patchRes.status()).toBe(200);
    const updatedExp = await patchRes.json();
    expect(updatedExp.isPaid).toBe(true);

    // Verify updated summary:
    // Carried: 1000, Total paid: 1500 -> Cash in pocket: 1000 - 1500 = -500
    const summaryRes = await request.get("/app/bff/budgets/2026/9/summary", {
      headers: { Origin: origin },
    });
    expect(summaryRes.status()).toBe(200);
    const summary = await summaryRes.json();
    expect(summary.totalPaidExpenses).toBe(1500);
    expect(summary.cashInPocketBalance).toBe(-500);

    // Verify rendered page reflects -$500.00 with negative styling
    const pageRes = await request.get("/app?period=2026-09");
    expect(pageRes.status()).toBe(200);
    const html = await pageRes.text();
    expect(html).toContain("-$500.00");
    expect(html).toContain("negative");
  });
});
