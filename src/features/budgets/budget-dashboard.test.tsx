import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BudgetDashboard } from "./budget-dashboard";
import type { BudgetPeriod } from "./contracts";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BudgetDashboard", () => {
  it("renders empty state 'Crear primer mes' when user has no budget", async () => {
    const user = userEvent.setup();
    render(
      <BudgetDashboard
        userName="Santiago"
        initialPeriod={null}
        allPeriods={[]}
      />,
    );

    expect(screen.getByText("Crear primer mes")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Abrir mi primer periodo" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir mi primer periodo" }));
    expect(
      screen.getByRole("heading", { name: "Abrir periodo presupuestario" }),
    ).toBeInTheDocument();
  });

  it("renders dashboard with period details, metrics, and closed banner when closed", () => {
    const closedPeriod: BudgetPeriod = {
      id: "b-closed",
      userId: "u-1",
      year: 2026,
      month: 9,
      status: "CLOSED",
      carriedSavings: 1500,
      totalIncome: 20000,
      totalExpenses: 12000,
    };

    render(
      <BudgetDashboard
        userName="Santiago"
        initialPeriod={closedPeriod}
        allPeriods={[closedPeriod]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Septiembre de 2026" })).toBeInTheDocument();
    expect(screen.getByText("Periodo cerrado (solo lectura):")).toBeInTheDocument();
    expect(screen.getByText("$20,000.00")).toBeInTheDocument();
    expect(screen.getByText("$12,000.00")).toBeInTheDocument();
    expect(screen.getByText("$8,000.00")).toBeInTheDocument();
  });
});
