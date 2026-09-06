import { expect, test, type APIRequestContext } from "@playwright/test";

const origin = "http://127.0.0.1:3002";
const credentials = { email: "test@example.test", password: "integration-only-password" };

async function login(request: APIRequestContext) {
  return request.post("/app/bff/auth/login", {
    headers: { Origin: origin },
    data: credentials,
  });
}

test.describe("Budget Periods and Savings (FE-05)", () => {
  test("initializes budget period, rejecting invalid months and accepting valid year/month", async ({
    request,
  }) => {
    await login(request);

    // Invalid month
    const invalidMonth = await request.post("/app/bff/budgets/initialize", {
      headers: { Origin: origin },
      data: { year: 2026, month: 14 },
    });
    expect(invalidMonth.status()).toBe(400);

    // Valid initialization
    const valid = await request.post("/app/bff/budgets/initialize", {
      headers: { Origin: origin },
      data: {
        year: 2026,
        month: 9,
        carriedSavings: 1500,
        notes: "Presupuesto de septiembre",
      },
    });
    expect(valid.status()).toBe(201);
    const period = await valid.json();
    expect(period).toMatchObject({
      year: 2026,
      month: 9,
      status: "OPEN",
      carriedSavings: 1500,
      notes: "Presupuesto de septiembre",
    });
  });

  test("handles 409 conflict transparently by returning existing period", async ({
    request,
  }) => {
    await login(request);

    // Re-attempt opening 2026-09
    const secondAttempt = await request.post("/app/bff/budgets/initialize", {
      headers: { Origin: origin },
      data: {
        year: 2026,
        month: 9,
        carriedSavings: 9999,
      },
    });
    // BFF absorbs 409 and returns 200 with the existing period (HU-FE-05.1)
    expect(secondAttempt.status()).toBe(200);
    const period = await secondAttempt.json();
    expect(period.year).toBe(2026);
    expect(period.month).toBe(9);
    expect(period.carriedSavings).toBe(1500); // Reuses original without duplicating
  });

  test("edits carried savings and notes, handling negative deficit correctly", async ({
    request,
  }) => {
    await login(request);

    const updated = await request.patch("/app/bff/budgets/2026/9/savings", {
      headers: { Origin: origin },
      data: {
        carriedSavings: -350,
        notes: "Ajuste por déficit",
      },
    });
    expect(updated.status()).toBe(200);
    const period = await updated.json();
    expect(period.carriedSavings).toBe(-350);
    expect(period.notes).toBe("Ajuste por déficit");
  });

  test("handles year crossover during month initialization", async ({ request }) => {
    await login(request);

    // Open December 2026
    const dec = await request.post("/app/bff/budgets/initialize", {
      headers: { Origin: origin },
      data: { year: 2026, month: 12, carriedSavings: 500 },
    });
    expect([200, 201]).toContain(dec.status());

    // Open January 2027
    const jan = await request.post("/app/bff/budgets/initialize", {
      headers: { Origin: origin },
      data: { year: 2027, month: 1, carriedSavings: 800 },
    });
    expect([200, 201]).toContain(jan.status());

    const listRes = await request.get("/app/bff/budgets");
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();

    const decPeriod = list.find((p: { year: number; month: number }) => p.year === 2026 && p.month === 12);
    const janPeriod = list.find((p: { year: number; month: number }) => p.year === 2027 && p.month === 1);
    expect(decPeriod).toBeDefined();
    expect(janPeriod).toBeDefined();
  });

  test("closes and reopens budget period with status PATCH", async ({ request }) => {
    await login(request);

    // Close period
    const closeRes = await request.patch("/app/bff/budgets/2026/9/status", {
      headers: { Origin: origin },
      data: { status: "CLOSED" },
    });
    expect(closeRes.status()).toBe(200);
    const closed = await closeRes.json();
    expect(closed.status).toBe("CLOSED");

    // While closed, savings modification should be rejected by server
    const blockedSavings = await request.patch("/app/bff/budgets/2026/9/savings", {
      headers: { Origin: origin },
      data: { carriedSavings: 100 },
    });
    expect(blockedSavings.status()).toBe(400);

    // Reopen period
    const reopenRes = await request.patch("/app/bff/budgets/2026/9/status", {
      headers: { Origin: origin },
      data: { status: "OPEN" },
    });
    expect(reopenRes.status()).toBe(200);
    const reopened = await reopenRes.json();
    expect(reopened.status).toBe("OPEN");
  });

  test("queries period summary and history with reverse chronological order", async ({
    request,
  }) => {
    await login(request);

    // Query list: 2027-01 should precede 2026-12 and 2026-09
    const listRes = await request.get("/app/bff/budgets");
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list.length).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < list.length - 1; i++) {
      const currentScore = list[i].year * 100 + list[i].month;
      const nextScore = list[i + 1].year * 100 + list[i + 1].month;
      expect(currentScore).toBeGreaterThanOrEqual(nextScore);
    }

    // Query summary
    const summaryRes = await request.get("/app/bff/budgets/2026/9/summary");
    expect(summaryRes.status()).toBe(200);
    const summary = await summaryRes.json();
    expect(summary.year).toBe(2026);
    expect(summary.month).toBe(9);
    expect(typeof summary.netBalance).toBe("number");
    expect(typeof summary.projectedSavings).toBe("number");
  });
});
