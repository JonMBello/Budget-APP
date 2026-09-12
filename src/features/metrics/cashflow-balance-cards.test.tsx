import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { budgetSummarySchema, type BudgetSummary } from "@/features/budgets/contracts";
import { CashflowBalanceCards } from "./cashflow-balance-cards";

describe("CashflowBalanceCards (HU-FE-08.1)", () => {
  it("renders projected savings 3000 and cash in pocket 2500 for the certified test case", () => {
    // Scenario: Ahorro 1000, ingreso total 5000/recibido 2000, gasto total 3000/pagado 500
    const summary: BudgetSummary = {
      year: 2026,
      month: 9,
      status: "OPEN",
      carriedSavings: 1000,
      totalIncome: 5000,
      totalExpenses: 3000,
      totalExpectedIncome: 5000,
      totalReceivedIncome: 2000,
      totalCommittedExpenses: 3000,
      totalPaidExpenses: 500,
      netBalance: 3000,

      cashInPocketBalance: 2500,
    };

    render(<CashflowBalanceCards summary={summary} />);

    expect(screen.getByText("Balance proyectado")).toBeInTheDocument();
    expect(screen.getByText("Efectivo según registros")).toBeInTheDocument();

    const projectedAmount = screen.getByTestId("projected-savings-amount");
    expect(projectedAmount).toHaveTextContent("$3,000.00");
    expect(projectedAmount).not.toHaveClass("negative");

    const cashAmount = screen.getByTestId("cash-in-pocket-amount");
    expect(cashAmount).toHaveTextContent("$2,500.00");
    expect(cashAmount).not.toHaveClass("negative");

    expect(screen.getAllByText("$1,000.00")).toHaveLength(2); // Carried savings in both cards
    expect(screen.getByText("$5,000.00")).toBeInTheDocument(); // Previstos
    expect(screen.getByText("$2,000.00")).toBeInTheDocument(); // Cobrados
    expect(screen.getByText("$500.00")).toBeInTheDocument(); // Pagados
  });

  it("applies negative style class when projected savings or cash in pocket are negative", () => {
    const summary: BudgetSummary = {
      year: 2026,
      month: 9,
      status: "OPEN",
      carriedSavings: 0,
      totalIncome: 1000,
      totalExpenses: 3000,
      totalExpectedIncome: 1000,
      totalReceivedIncome: 200,
      totalCommittedExpenses: 3000,
      totalPaidExpenses: 1500,
      netBalance: -2000,

      cashInPocketBalance: -1300,
    };

    render(<CashflowBalanceCards summary={summary} />);

    const projectedAmount = screen.getByTestId("projected-savings-amount");
    expect(projectedAmount).toHaveTextContent("-$2,000.00");
    expect(projectedAmount).toHaveClass("negative");

    const cashAmount = screen.getByTestId("cash-in-pocket-amount");
    expect(cashAmount).toHaveTextContent("-$1,300.00");
    expect(cashAmount).toHaveClass("negative");
  });
});

 it("renders the API netBalance without a projectedSavings field", () => {
   const summary = budgetSummarySchema.parse({
     year: 2026, month: 7, carriedSavings: 2000,
     totalIncome: 55249.50, totalExpenses: 599, netBalance: 56650.50,
   });
   render(<CashflowBalanceCards summary={summary} />);
   expect(screen.getByTestId("projected-savings-amount")).toHaveTextContent("$56,650.50");
 });
