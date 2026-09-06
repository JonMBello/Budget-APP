import { expect, test, type APIRequestContext } from "@playwright/test";

const origin = "http://127.0.0.1:3002";
const credentials = { email: "people@example.test", password: "integration-only-password" };

async function login(request: APIRequestContext) {
  return request.post("/app/bff/auth/login", {
    headers: { Origin: origin },
    data: credentials,
  });
}

test.describe("People and Debts Directory (FE-04)", () => {
  test("validates minimum 2 characters name on creation", async ({ request }) => {
    await login(request);

    const invalid = await request.post("/app/bff/people", {
      headers: { Origin: origin },
      data: {
        name: "A",
        contact: "123",
      },
    });
    expect(invalid.status()).toBe(400);

    const empty = await request.post("/app/bff/people", {
      headers: { Origin: origin },
      data: {
        name: "   ",
      },
    });
    expect(empty.status()).toBe(400);
  });

  test("creates person with contact and notes successfully", async ({ request }) => {
    await login(request);

    const valid = await request.post("/app/bff/people", {
      headers: { Origin: origin },
      data: {
        name: "Mateo Silva",
        contact: "mateo@example.test",
        notes: "Préstamo de viaje",
      },
    });
    expect(valid.status()).toBe(201);
    const person = await valid.json();
    expect(person).toMatchObject({
      name: "Mateo Silva",
      contact: "mateo@example.test",
      notes: "Préstamo de viaje",
      isActive: true,
    });
  });

  test("consults debts and settles an expense for a person", async ({ request }) => {
    await login(request);

    // Create person with 'Deuda' in name to trigger synthetic debt items in test fixture
    const created = await request.post("/app/bff/people", {
      headers: { Origin: origin },
      data: {
        name: "Esteban Deuda",
        contact: "5511223344",
      },
    });
    const person = await created.json();

    // Query debts
    const debtsRes = await request.get(`/app/bff/people/${person.id}/debts`);
    expect(debtsRes.status()).toBe(200);
    const debts = await debtsRes.json();
    expect(debts.totalDebt).toBeGreaterThan(0);
    expect(debts.immediateDueAmount).toBeGreaterThan(0);
    expect(debts.msiInstallments.length).toBeGreaterThan(0);
    expect(debts.singleExpenses.length).toBeGreaterThan(0);

    // Settle a single expense
    const expenseId = debts.singleExpenses[0].expenseId;
    const settleRes = await request.post(`/app/bff/people/${person.id}/settle`, {
      headers: { Origin: origin },
      data: { expenseId },
    });
    expect(settleRes.status()).toBe(200);
    const settleData = await settleRes.json();
    expect(settleData.success).toBe(true);
  });

  test("archives person with DELETE and toggles display with includeInactive", async ({ request }) => {
    await login(request);

    const created = await request.post("/app/bff/people", {
      headers: { Origin: origin },
      data: {
        name: "Persona Para Archivar",
        contact: "antiguo@example.test",
      },
    });
    const person = await created.json();

    // Delete (archive)
    const archived = await request.delete(`/app/bff/people/${person.id}`, {
      headers: { Origin: origin },
    });
    expect(archived.status()).toBe(200);

    // Active query should exclude archived
    const activeList = await request.get("/app/bff/people");
    const activePeople = await activeList.json();
    expect(activePeople.some((p: { id: string }) => p.id === person.id)).toBe(false);

    // All query should include archived with isActive=false
    const allList = await request.get("/app/bff/people?includeInactive=true");
    const allPeople = await allList.json();
    const found = allPeople.find((p: { id: string }) => p.id === person.id);
    expect(found).toBeDefined();
    expect(found.isActive).toBe(false);
  });
});
