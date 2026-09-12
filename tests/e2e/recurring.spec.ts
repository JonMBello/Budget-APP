import { expect, test, type APIRequestContext } from "@playwright/test";

const origin = "http://127.0.0.1:3002";
const credentials = { email: "recurring@example.test", password: "integration-only-password" };

async function login(request: APIRequestContext) {
  return request.post("/app/bff/auth/login", {
    headers: { Origin: origin },
    data: credentials,
  });
}

test.describe("Recurring, Services, and MSI (FE-06)", () => {
  test.describe.configure({ mode: "serial" });

  test("creates service and subscription templates, validating required fields", async ({
    request,
  }) => {
    await login(request);

    // Invalid: missing title
    const invalidService = await request.post("/app/bff/recurring", {
      headers: { Origin: origin },
      data: {
        category: "SERVICE",
        amount: 650,
        startDate: "2026-01-01",
      },
    });
    expect(invalidService.status()).toBe(400);

    // Valid SERVICE
    const validService = await request.post("/app/bff/recurring", {
      headers: { Origin: origin },
      data: {
        title: "Internet Totalplay 500",
        category: "SERVICE",
        amount: 650,
        currency: "MXN",
        startDate: "2026-01-15",
        notes: "Servicio de fibra óptica",
      },
    });
    expect(validService.status()).toBe(201);
    const service = await validService.json();
    expect(service).toMatchObject({
      title: "Internet Totalplay 500",
      category: "SERVICE",
      amount: 650,
      currency: "MXN",
      startDate: "2026-01-15",
      isActive: true,
      isCancelled: false,
    });

    // Valid SUBSCRIPTION
    const validSub = await request.post("/app/bff/recurring", {
      headers: { Origin: origin },
      data: {
        title: "Spotify Familiar",
        category: "SUBSCRIPTION",
        amount: 199,
        currency: "MXN",
        startDate: "2026-01-01",
      },
    });
    expect(validSub.status()).toBe(201);
    const sub = await validSub.json();
    expect(sub.category).toBe("SUBSCRIPTION");
  });

  test("registers MSI with cent adjustment and rejects currentInstallment > totalInstallments", async ({
    request,
  }) => {
    await login(request);

    // Invalid: currentInstallment > totalInstallments (13 de 12)
    const invalidMsi = await request.post("/app/bff/recurring", {
      headers: { Origin: origin },
      data: {
        title: "Lavadora Inválida",
        category: "MSI",
        amount: 1000,
        totalAmount: 12000,
        totalInstallments: 12,
        currentInstallment: 13,
        startDate: "2026-01-01",
      },
    });
    expect(invalidMsi.status()).toBe(400);

    // Valid MSI: 18000 a 12 meses (1500/mes)
    const validMsi = await request.post("/app/bff/recurring", {
      headers: { Origin: origin },
      data: {
        title: "Refrigerador Samsung",
        category: "MSI",
        amount: 1500,
        totalAmount: 18000,
        totalInstallments: 12,
        currentInstallment: 1,
        startDate: "2026-01-01",
      },
    });
    expect(validMsi.status()).toBe(201);
    const msi = await validMsi.json();
    expect(msi).toMatchObject({
      title: "Refrigerador Samsung",
      category: "MSI",
      totalAmount: 18000,
      totalInstallments: 12,
      currentInstallment: 1,
      isActive: true,
    });

    // Cent rounding case: 1000 total a 3 meses -> 333.33 cuota regular
    const roundingMsi = await request.post("/app/bff/recurring", {
      headers: { Origin: origin },
      data: {
        title: "Cafetera Express",
        category: "MSI",
        amount: 333.33,
        totalAmount: 1000,
        totalInstallments: 3,
        currentInstallment: 1,
        startDate: "2026-01-01",
      },
    });
    expect(roundingMsi.status()).toBe(201);
  });

  test("pauses, reopens, and cancels recurring commitments", async ({
    request,
  }) => {
    await login(request);

    // Create item to pause and cancel
    const createRes = await request.post("/app/bff/recurring", {
      headers: { Origin: origin },
      data: {
        title: "Gimnasio Anualidad",
        category: "SERVICE",
        amount: 800,
        startDate: "2026-01-01",
      },
    });
    expect(createRes.status()).toBe(201);
    const item = await createRes.json();

    // Pause
    const pauseRes = await request.patch(`/app/bff/recurring/${item.id}`, {
      headers: { Origin: origin },
      data: { isActive: false },
    });
    expect(pauseRes.status()).toBe(200);
    const paused = await pauseRes.json();
    expect(paused.isActive).toBe(false);

    // Resume
    const resumeRes = await request.patch(`/app/bff/recurring/${item.id}`, {
      headers: { Origin: origin },
      data: { isActive: true },
    });
    expect(resumeRes.status()).toBe(200);
    const resumed = await resumeRes.json();
    expect(resumed.isActive).toBe(true);

    // Cancel
    const cancelRes = await request.patch(`/app/bff/recurring/${item.id}/cancel`, {
      headers: { Origin: origin },
    });
    expect(cancelRes.status()).toBe(200);
    const cancelled = await cancelRes.json();
    expect(cancelled.isCancelled).toBe(true);
    expect(cancelled.isActive).toBe(false);
  });

  test("advances MSI installments and liquidates remaining balance", async ({
    request,
  }) => {
    await login(request);

    // Create MSI plan of 6 installments
    const createRes = await request.post("/app/bff/recurring", {
      headers: { Origin: origin },
      data: {
        title: "Pantalla LG 55",
        category: "MSI",
        amount: 2000,
        totalAmount: 12000,
        totalInstallments: 6,
        currentInstallment: 1,
        startDate: "2026-01-01",
      },
    });
    expect(createRes.status()).toBe(201);
    const msi = await createRes.json();

    // Advance 2 installments
    const advanceRes = await request.post(`/app/bff/recurring/${msi.id}/advance`, {
      headers: { Origin: origin },
      data: { installmentsCount: 2 },
    });
    expect(advanceRes.status()).toBe(200);
    const advanced = await advanceRes.json();
    expect(advanced.currentInstallment).toBe(3);
    expect(advanced.isActive).toBe(true);

    // Pay all remaining installments (liquidate)
    const liquidateRes = await request.post(`/app/bff/recurring/${msi.id}/advance`, {
      headers: { Origin: origin },
      data: { payAll: true },
    });
    expect(liquidateRes.status()).toBe(200);
    const liquidated = await liquidateRes.json();
    expect(liquidated.currentInstallment).toBe(6);
    expect(liquidated.isActive).toBe(false);
  });

  test("instantiates active commitments in active period idempotently", async ({
    request,
  }) => {
    await login(request);

    const initialized = await request.post("/app/bff/budgets/initialize", {
      headers: { Origin: origin }, data: { year: 2025, month: 4 },
    });
    expect(initialized.status()).toBe(201);
    const period = await initialized.json();
    const created = await request.post("/app/bff/recurring", {
      headers: { Origin: origin }, data: { title: "Internet de prueba", category: "SERVICE", amount: 300, startDate: "2025-04-01" },
    });
    expect(created.status()).toBe(201);
    const options = { headers: { Origin: origin }, data: { periodId: period.id } };
    const first = await request.post("/app/bff/recurring/instantiate", options);
    expect(first.status()).toBe(200);
    const result = await first.json();
    expect(result).toMatchObject({ periodId: period.id, year: 2025, month: 4 });
    expect(result.createdCount).toBeGreaterThan(0);
    const second = await request.post("/app/bff/recurring/instantiate", options);
    expect(second.status()).toBe(200);
    expect(await second.json()).toMatchObject({ createdCount: 0, skippedCount: result.createdCount });
    const expenses = await request.get(`/app/bff/expenses?periodId=${period.id}`);
    expect((await expenses.json()).some((e: { title: string }) => e.title === "Internet de prueba")).toBe(true);
  });

  test("renders recurring page and filters via API and server component", async ({
    request,
  }) => {
    await login(request);

    // Fetch /app/recurring server page
    const pageRes = await request.get("/app/recurring");
    expect(pageRes.status()).toBe(200);
    const html = await pageRes.text();
    expect(html).toContain("Servicios, suscripciones y MSI");
    expect(html).toContain("COMPROMISOS MENSUALES");

    // Fetch recurring items with category filter
    const serviceFilterRes = await request.get("/app/bff/recurring?category=SERVICE");
    expect(serviceFilterRes.status()).toBe(200);
    const services = await serviceFilterRes.json();
    expect(Array.isArray(services)).toBe(true);
    expect(services.every((s: { category: string }) => s.category === "SERVICE")).toBe(true);
  });
});
