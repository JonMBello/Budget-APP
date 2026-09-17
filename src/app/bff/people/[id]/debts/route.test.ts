// @vitest-environment node
import { expect, it, vi } from "vitest";
import { GET } from "./route";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/server/session", () => ({ authenticatedRequest: request }));
const get = () => GET(new Request("http://localhost/bff/people/person-1/debts"), {
  params: Promise.resolve({ id: "person-1" }),
});
const summary = {
  personId: "person-1",
  name: "Juan Pérez",
  totalDebt: 3400,
  periods: [
    {
      period: "2026-09",
      year: 2026,
      month: 9,
      periodName: "Septiembre 2026",
      periodId: "period-1",
      totalDebt: 1400,
      msiInstallments: [
        {
          id: "msi-1",
          title: "Laptop",
          installmentAmount: 1000,
          remainingAmount: 3000,
          currentInstallment: 1,
          totalInstallments: 3,
          cardName: "Tarjeta",
          nextDueDate: "2026-10-05",
        },
      ],
      recurringServices: [
        {
          id: "service-1",
          title: "Servicio",
          amount: 100,
          cardName: "Tarjeta",
          nextDueDate: null,
        },
      ],
      singleExpenses: [
        {
          id: "expense-1",
          title: "Cena",
          amount: 300,
          date: "2026-09-02",
          paymentDueDate: "2026-10-06",
          isPaid: false,
        },
      ],
    },
    {
      period: "2026-10",
      year: 2026,
      month: 10,
      periodName: "Octubre 2026",
      periodId: null,
      totalDebt: 2000,
      msiInstallments: [
        {
          id: "msi-1",
          title: "Laptop",
          installmentAmount: 1000,
          remainingAmount: 2000,
          currentInstallment: 2,
          totalInstallments: 3,
          cardName: "Tarjeta",
          nextDueDate: "2026-11-05",
        },
      ],
      recurringServices: [],
      singleExpenses: [],
    },
  ],
};

it("adapts the V2 API debt fields and groups by periods", async () => {
  request.mockResolvedValue(summary);
  const response = await get();
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.totalDebt).toBe(3400);
  expect(body.immediateDueAmount).toBe(1400);
  expect(body.periods).toHaveLength(2);
  expect(body.periods[0].msiInstallments[0]).toMatchObject({ amount: 1000, paymentDueDate: "2026-10-05" });
  expect(body.periods[0].recurringServices[0]).toMatchObject({ amount: 100, paymentDueDate: null });
  expect(body.periods[0].singleExpenses[0]).toMatchObject({ expenseId: "expense-1", settled: false });
  expect(request).toHaveBeenCalledWith("/v2/people/person-1/debts");
});

it("preserves a collected debt's status in V2 periods", async () => {
  const updated = {
    ...summary,
    periods: [
      {
        ...summary.periods[0],
        singleExpenses: [{ ...summary.periods[0].singleExpenses[0], isPaid: true }],
      },
    ],
  };
  request.mockResolvedValue(updated);
  const body = await (await get()).json();
  expect(body.periods[0].singleExpenses[0].settled).toBe(true);
});

it.each([
  {},
  null,
  { totalDebt: "invalid" },
  { ...summary, periods: [{ period: "2026-09", year: 2026, month: 9, periodName: "Sept", totalDebt: 100, msiInstallments: [{ title: "Laptop" }] }] },
])("reports invalid upstream data as a service error, not a form error", async (data) => {
  request.mockResolvedValue(data);
  const response = await get();
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({ message: "No pudimos consultar las deudas de esta persona. Inténtalo de nuevo." });
});
