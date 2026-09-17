import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PeriodSelector } from "./period-selector";
import type { BudgetPeriod } from "./contracts";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams("period=2026-09"),
}));

const mockPeriods: BudgetPeriod[] = [
  {
    id: "b-1",
    userId: "u-1",
    year: 2026,
    month: 9,
    status: "OPEN",
    carriedSavings: 1000,
    totalIncome: 15000,
    totalExpenses: 12000,
  },
  {
    id: "b-2",
    userId: "u-1",
    year: 2026,
    month: 8,
    status: "CLOSED",
    carriedSavings: 500,
    totalIncome: 14000,
    totalExpenses: 13500,
  },
];

afterEach(() => {
  vi.clearAllMocks();
});

describe("PeriodSelector", () => {
  it("orders months chronologically across years while retaining the selected month", () => {
    const periods = [
      { ...mockPeriods[0], id: "next-year", year: 2027, month: 1 },
      ...mockPeriods,
      { ...mockPeriods[0], id: "previous-year", year: 2025, month: 12 },
    ];
    render(<PeriodSelector periods={periods} currentPeriod={mockPeriods[0]} />);

    expect(screen.getAllByRole("option").map((option) => (option as HTMLOptionElement).value))
      .toEqual(["2025-12", "2026-08", "2026-09", "2027-01"]);
    expect(screen.getByLabelText("Seleccionar mes activo")).toHaveValue("2026-09");
    expect(periods.map((period) => period.id)).toEqual(["next-year", "b-1", "b-2", "previous-year"]);
  });

  it("renders period options with month name and status", () => {
    render(
      <PeriodSelector
        periods={mockPeriods}
        currentPeriod={mockPeriods[0]}
      />,
    );

    const select = screen.getByLabelText("Seleccionar mes activo");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Septiembre de 2026 (Abierto)")).toBeInTheDocument();
    expect(screen.getByText("Agosto de 2026 (Cerrado)")).toBeInTheDocument();
  });

  it("navigates to selected period when changed", async () => {
    const user = userEvent.setup();
    render(
      <PeriodSelector
        periods={mockPeriods}
        currentPeriod={mockPeriods[0]}
      />,
    );

    const select = screen.getByLabelText("Seleccionar mes activo");
    await user.selectOptions(select, "2026-08");

    expect(pushMock).toHaveBeenCalledWith("/?period=2026-08");
  });

  it("opens InitializeMonthWizard when '+ Nuevo mes' is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PeriodSelector
        periods={mockPeriods}
        currentPeriod={mockPeriods[0]}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ Nuevo mes" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Abrir periodo presupuestario" }),
    ).toBeInTheDocument();
  });
});
