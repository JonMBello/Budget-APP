// @vitest-environment node
import { expect, it, vi } from "vitest";
import { GET } from "./route";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/server/session", () => ({ authenticatedRequest: request }));
const get = () => GET(new Request("http://localhost/bff/people/person-1/debts"), {
  params: Promise.resolve({ id: "person-1" }),
});
const summary = {
  totalDebt: 3400, immediateDueAmount: 1400, nextPaymentDueDate: "2026-10-05",
  msiInstallments: [{ id: "msi-1", title: "Laptop", installmentAmount: 1000, remainingAmount: 3000, currentInstallment: 1, totalInstallments: 3, cardName: "Tarjeta", nextDueDate: "2026-10-05" }],
  recurringServices: [{ id: "service-1", title: "Servicio", amount: 100, nextDueDate: null }],
  singleExpenses: [{ id: "expense-1", title: "Cena", amount: 300, paymentDueDate: "2026-10-06", isPaid: false }],
};

it("adapts the API debt fields without recalculating totals", async () => {
  request.mockResolvedValue(summary);
  const response = await get();
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.totalDebt).toBe(3400);
  expect(body.immediateDueAmount).toBe(1400);
  expect(body.msiInstallments[0]).toMatchObject({ amount: 1000, paymentDueDate: "2026-10-05" });
  expect(body.recurringServices[0]).toMatchObject({ amount: 100, paymentDueDate: null });
  expect(body.singleExpenses[0]).toMatchObject({ expenseId: "expense-1", settled: false });
  expect(request).toHaveBeenCalledWith("/people/person-1/debts");
});

it("preserves a collected debt's status", async () => {
  request.mockResolvedValue({ ...summary, singleExpenses: [{ ...summary.singleExpenses[0], isPaid: true }] });
  expect((await (await get()).json()).singleExpenses[0].settled).toBe(true);
});

it.each([{}, null, { ...summary, msiInstallments: [{ title: "Laptop" }] }, { ...summary, singleExpenses: [{ title: "Cena", amount: 300, isPaid: false }] }])("reports invalid upstream data as a service error, not a form error", async (data) => {
  request.mockResolvedValue(data);
  const response = await get();
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({ message: "No pudimos consultar las deudas de esta persona. Inténtalo de nuevo." });
});
