import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import IncomesPage from "./incomes/page";
import ExpensesPage from "./expenses/page";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/lib/server/session", () => ({
  requireUser: async () => ({ name: "Santiago" }),
  authenticatedRequest: request,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

it.each([
  { page: IncomesPage, path: "incomes", label: "Ingresos" },
  { page: ExpensesPage, path: "expenses", label: "Gastos" },
])("updates $label movements and totals across month navigation", async ({ page, path, label }) => {
  const periods = [9, 8, 7].map((month) => ({
    id: `period-${month}`, userId: "user", year: 2026, month,
    status: month === 8 ? "CLOSED" : "OPEN",
    carriedSavings: 0, totalIncome: 0, totalExpenses: 0,
  }));
  request.mockImplementation(async (url: string) => {
    if (url === "/budgets") return periods;
    const period = periods.find((p) => url === `/${path}?periodId=${p.id}`);
    if (!period || period.month === 7) return [];
    return [{
      id: `movement-${period.month}`, userId: "user", periodId: period.id,
      title: `Movimiento de ${period.month}`, amount: period.month === 9 ? 1500 : 800,
      date: `2026-0${period.month}-05`, category: "FOOD", source: "PAYROLL",
      isPaid: false, isReceived: false,
    }];
  });
  const load = (month: number) => page({ searchParams: Promise.resolve({ period: `2026-0${month}` }) });
  const view = render(await load(9));
  expect(screen.getByText("Movimiento de 9")).toBeInTheDocument();
  expect(screen.getAllByText("$1,500.00").length).toBeGreaterThan(0);

  view.rerender(await load(8));
  expect(screen.getByRole("heading", { name: `${label} — Agosto de 2026` })).toBeInTheDocument();
  expect(screen.getByText("Movimiento de 8")).toBeInTheDocument();
  expect(screen.queryByText("Movimiento de 9")).not.toBeInTheDocument();
  expect(screen.queryByText("$1,500.00")).not.toBeInTheDocument();
  expect(screen.getAllByText("$800.00").length).toBeGreaterThan(0);
  expect(screen.getByText("Periodo cerrado (solo lectura):")).toBeInTheDocument();

  view.rerender(await load(7));
  expect(screen.queryByText("Movimiento de 8")).not.toBeInTheDocument();
  expect(screen.queryByText("$800.00")).not.toBeInTheDocument();
  expect(screen.queryByText("Periodo cerrado (solo lectura):")).not.toBeInTheDocument();

  view.rerender(await load(9));
  expect(screen.getByText("Movimiento de 9")).toBeInTheDocument();
  expect(screen.getAllByText("$1,500.00").length).toBeGreaterThan(0);
});
