import { expect, test, type APIRequestContext } from "@playwright/test";

const origin = "http://127.0.0.1:3003";
const credentials = { email: "cards@example.test", password: "integration-only-password" };

async function login(request: APIRequestContext) {
  return request.post("/app/bff/auth/login", {
    headers: { Origin: origin },
    data: credentials,
  });
}

test.describe("Cards and Payment Methods (FE-03)", () => {
  test("credit card creation requires cutoffDay and paymentDueDay between 1 and 31", async ({ request }) => {
    await login(request);

    // Missing cutoff and payment
    const invalidCredit = await request.post("/app/bff/cards", {
      headers: { Origin: origin },
      data: {
        name: "Tarjeta Invalida",
        type: "CREDIT",
        color: "#f87171",
      },
    });
    expect(invalidCredit.status()).toBe(400);

    // Valid credit card with cutoff 15 and payment 5
    const validCredit = await request.post("/app/bff/cards", {
      headers: { Origin: origin },
      data: {
        name: "Banorte Oro",
        type: "CREDIT",
        color: "#ef4444",
        last4Digits: "5544",
        cutoffDay: 15,
        paymentDueDay: 5,
        creditLimit: 30000,
      },
    });
    expect(validCredit.status()).toBe(201);
    const card = await validCredit.json();
    expect(card).toMatchObject({
      name: "Banorte Oro",
      type: "CREDIT",
      cutoffDay: 15,
      paymentDueDay: 5,
      last4Digits: "5544",
      isActive: true,
    });
  });

  test("cash and debit accounts do not require credit cycle days", async ({ request }) => {
    await login(request);

    const cash = await request.post("/app/bff/cards", {
      headers: { Origin: origin },
      data: {
        name: "Efectivo",
        type: "CASH",
        color: "#10b981",
      },
    });
    expect(cash.status()).toBe(201);
    const card = await cash.json();
    expect(card.type).toBe("CASH");
    expect(card.cutoffDay).toBeUndefined();
  });

  test("simulates bank cycles: cutoff 15/pago 5 purchase on 10/09 impacts Oct, 16/09 impacts Nov", async ({ request }) => {
    await login(request);

    const created = await request.post("/app/bff/cards", {
      headers: { Origin: origin },
      data: {
        name: "Tarjeta Simulada",
        type: "CREDIT",
        color: "#3b82f6",
        cutoffDay: 15,
        paymentDueDay: 5,
      },
    });
    const card = await created.json();

    // Purchase on 2026-09-10 (before cutoff 15) -> statement cutoff 2026-09-15, payment due 2026-10-05, impact budget month 10
    const preview1 = await request.get(`/app/bff/cards/${card.id}/preview?date=2026-09-10`);
    expect(preview1.status()).toBe(200);
    const data1 = await preview1.json();
    expect(data1.statementCutoffDate).toBe("2026-09-15");
    expect(data1.paymentDueDate).toBe("2026-10-05");
    expect(data1.impactBudgetYear).toBe(2026);
    expect(data1.impactBudgetMonth).toBe(10);

    // Purchase on 2026-09-16 (after cutoff 15) -> statement cutoff 2026-10-15, payment due 2026-11-05, impact budget month 11
    const preview2 = await request.get(`/app/bff/cards/${card.id}/preview?date=2026-09-16`);
    expect(preview2.status()).toBe(200);
    const data2 = await preview2.json();
    expect(data2.statementCutoffDate).toBe("2026-10-15");
    expect(data2.paymentDueDate).toBe("2026-11-05");
    expect(data2.impactBudgetYear).toBe(2026);
    expect(data2.impactBudgetMonth).toBe(11);
  });

  test("archives card with DELETE and toggles display with includeInactive", async ({ request }) => {
    await login(request);

    const created = await request.post("/app/bff/cards", {
      headers: { Origin: origin },
      data: {
        name: "Tarjeta Para Archivar",
        type: "DEBIT",
        color: "#8b5cf6",
      },
    });
    const card = await created.json();

    // Delete (archive)
    const archived = await request.delete(`/app/bff/cards/${card.id}`, {
      headers: { Origin: origin },
    });
    expect(archived.status()).toBe(200);

    // Query active only: should not contain archived card
    const activeList = await request.get("/app/bff/cards");
    const activeCards = await activeList.json();
    expect(activeCards.some((c: { id: string }) => c.id === card.id)).toBe(false);

    // Query with includeInactive: should contain archived card with isActive=false
    const allList = await request.get("/app/bff/cards?includeInactive=true");
    const allCards = await allList.json();
    const found = allCards.find((c: { id: string }) => c.id === card.id);
    expect(found).toBeDefined();
    expect(found.isActive).toBe(false);
  });
});
