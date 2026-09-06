import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransactionsList } from "./transactions-list";
import { type BudgetPeriod } from "@/features/budgets/contracts";
import { type Expense, type Income } from "./contracts";
import { type Card } from "@/features/cards/contracts";
import { type Person } from "@/features/people/contracts";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/expenses",
  useSearchParams: () => new URLSearchParams(),
}));

const mockOpenPeriod: BudgetPeriod = {
  id: "2026-03",
  userId: "user-1",
  year: 2026,
  month: 3,
  status: "OPEN",
  carriedSavings: 0,
  totalIncome: 30000,
  totalExpenses: 12000,
};

const mockClosedPeriod: BudgetPeriod = {
  ...mockOpenPeriod,
  status: "CLOSED",
};

const mockPrevPeriod: BudgetPeriod = {
  id: "2026-02",
  userId: "user-1",
  year: 2026,
  month: 2,
  status: "CLOSED",
  carriedSavings: 0,
  totalIncome: 28000,
  totalExpenses: 14000,
};

const mockExpenses: Expense[] = [
  {
    id: "exp-1",
    userId: "user-1",
    periodId: "2026-03",
    title: "Internet Totalplay",
    amount: 700,
    category: "SERVICE",
    date: "2026-03-05",
    isPaid: true,
  },
  {
    id: "exp-2",
    userId: "user-1",
    periodId: "2026-03",
    title: "Cena Tacos",
    amount: 300,
    category: "FOOD",
    date: "2026-03-10",
    isPaid: false,
  },
];

const mockIncomes: Income[] = [
  {
    id: "inc-1",
    userId: "user-1",
    periodId: "2026-03",
    title: "Quincena 1",
    amount: 15000,
    source: "PAYROLL",
    date: "2026-03-15",
    isReceived: true,
  },
];

const mockCards: Card[] = [
  { id: "card-1", name: "BBVA Crédito", type: "CREDIT", color: "#2563eb", isActive: true },
];


const mockPeople: Person[] = [
  { id: "person-1", name: "Luis", isActive: true },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("TransactionsList", () => {
  it("renders expenses list with metrics, search filter, and shows form when clicking button", async () => {
    const user = userEvent.setup();

    render(
      <TransactionsList
        type="expenses"
        period={mockOpenPeriod}
        allPeriods={[mockOpenPeriod, mockPrevPeriod]}
        initialExpenses={mockExpenses}
        cards={mockCards}
        people={mockPeople}
      />,
    );

    expect(screen.getByText("Internet Totalplay")).toBeInTheDocument();
    expect(screen.getByText("Cena Tacos")).toBeInTheDocument();

    // Check metrics
    expect(screen.getByText("Total gastos")).toBeInTheDocument();
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();

    // Search filter
    const searchInput = screen.getByLabelText("Buscar gastos");
    await user.type(searchInput, "Tacos");

    expect(screen.queryByText("Internet Totalplay")).not.toBeInTheDocument();
    expect(screen.getByText("Cena Tacos")).toBeInTheDocument();

    await user.clear(searchInput);

    // Open create form
    const createBtn = screen.getByRole("button", { name: "+ Registrar gasto" });
    await user.click(createBtn);

    expect(screen.getByRole("button", { name: "Registrar gasto" })).toBeInTheDocument();
  });

  it("renders incomes list and handles period closed banner", () => {
    render(
      <TransactionsList
        type="incomes"
        period={mockClosedPeriod}
        allPeriods={[mockClosedPeriod, mockPrevPeriod]}
        initialIncomes={mockIncomes}
        people={mockPeople}
      />,
    );

    expect(screen.getByText("Quincena 1")).toBeInTheDocument();
    expect(screen.getByText("Total ingresos")).toBeInTheDocument();
    expect(screen.getAllByText(/\$15,000\.00/).length).toBeGreaterThanOrEqual(1);

    // Period closed banner
    expect(screen.getByText(/periodo cerrado/i)).toBeInTheDocument();
    // Register button should NOT be visible when closed
    expect(screen.queryByRole("button", { name: "+ Registrar ingreso" })).not.toBeInTheDocument();
  });
});
