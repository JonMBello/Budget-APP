import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BudgetHistoryView } from "./budget-history-view";
import type { BudgetPeriod } from "./contracts";

const historyFixtures: BudgetPeriod[] = [
  {
    id: "b-sep",
    userId: "u-1",
    year: 2026,
    month: 9,
    status: "OPEN",
    carriedSavings: 2000,
    totalIncome: 30000,
    totalExpenses: 20000,
    notes: "Septiembre productivo",
  },
  {
    id: "b-ago",
    userId: "u-1",
    year: 2026,
    month: 8,
    status: "CLOSED",
    carriedSavings: 1500,
    totalIncome: 25000,
    totalExpenses: 24500,
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BudgetHistoryView", () => {
  it("renders reverse chronological period list with status badges", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          year: 2026,
          month: 9,
          totalIncome: 30000,
          totalExpenses: 20000,
          netBalance: 10000,
          carriedSavings: 2000,
          projectedSavings: 12000,
        }),
      })),
    );

    render(<BudgetHistoryView initialPeriods={historyFixtures} />);

    expect(
      screen.getAllByRole("heading", { name: "Septiembre de 2026" })[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: "Agosto de 2026" })[0],
    ).toBeInTheDocument();
    expect(screen.getByText("Abierto")).toBeInTheDocument();
    expect(screen.getByText("Cerrado")).toBeInTheDocument();
  });

  it("compares two months side by side using summary data", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/2026/9/summary")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            year: 2026,
            month: 9,
            totalIncome: 30000,
            totalExpenses: 20000,
            netBalance: 10000,
            carriedSavings: 2000,
            projectedSavings: 12000,
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          year: 2026,
          month: 8,
          totalIncome: 25000,
          totalExpenses: 24500,
          netBalance: 500,
          carriedSavings: 1500,
          projectedSavings: 2000,
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BudgetHistoryView initialPeriods={historyFixtures} />);

    expect(screen.getByText("Comparar dos meses")).toBeInTheDocument();
    const incomesA = await screen.findAllByText("$30,000.00");
    expect(incomesA.length).toBeGreaterThan(0);
    const incomesB = await screen.findAllByText("$25,000.00");
    expect(incomesB.length).toBeGreaterThan(0);
  });

  it("displays explicit error when summary fetch fails without converting to zero", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ message: "No pudimos conectar con el servicio." }),
      })),
    );

    render(<BudgetHistoryView initialPeriods={historyFixtures} />);

    const errorAlerts = await screen.findAllByText(
      "No pudimos conectar con el servicio.",
    );
    expect(errorAlerts).toHaveLength(2);
  });
});
