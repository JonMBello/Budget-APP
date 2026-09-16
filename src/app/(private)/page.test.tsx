import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { BudgetPeriod } from "@/features/budgets/contracts";
import HomePage from "./page";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/lib/server/session", () => ({
  requireUser: async () => ({ name: "Santiago" }),
  authenticatedRequest: request,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => vi.unstubAllGlobals());

it("updates the dashboard when navigation supplies another month's server data", async () => {
  // Keep background requests pending to verify the navigation data itself is used.
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
  const september: BudgetPeriod = {
    id: "september", userId: "user", year: 2026, month: 9,
    status: "OPEN", carriedSavings: 1500, totalIncome: 20000, totalExpenses: 12000,
  };
  const august: BudgetPeriod = {
    ...september, id: "august", month: 8, status: "CLOSED",
    carriedSavings: 500, totalIncome: 10000, totalExpenses: 8000,
  };
  request.mockImplementation(async (path: string) => {
    if (path === "/budgets") return [september, august];
    if (path.endsWith("/summary")) {
      const period = path.includes("/2026/8/") ? august : september;
      const balance = period.carriedSavings + period.totalIncome - period.totalExpenses;
      return { ...period, netBalance: balance, cashInPocketBalance: balance };
    }
    return [];
  });

  const view = render(await HomePage({ searchParams: Promise.resolve({ period: "2026-09" }) }));
  expect(screen.getByRole("heading", { name: "Septiembre de 2026" })).toBeInTheDocument();
  expect(screen.getByTestId("projected-savings-amount")).toHaveTextContent("$9,500.00");

  view.rerender(await HomePage({ searchParams: Promise.resolve({ period: "2026-08" }) }));
  expect(screen.getByRole("heading", { name: "Agosto de 2026" })).toBeInTheDocument();
  expect(screen.getByText("Periodo cerrado (solo lectura):")).toBeInTheDocument();
  expect(screen.getByTestId("projected-savings-amount")).toHaveTextContent("$2,500.00");
  expect(screen.getByTestId("cash-in-pocket-amount")).toHaveTextContent("$2,500.00");

  view.rerender(await HomePage({ searchParams: Promise.resolve({ period: "2026-09" }) }));
  expect(screen.getByRole("heading", { name: "Septiembre de 2026" })).toBeInTheDocument();
  expect(screen.queryByText("Periodo cerrado (solo lectura):")).not.toBeInTheDocument();
  expect(screen.getByTestId("projected-savings-amount")).toHaveTextContent("$9,500.00");
});
