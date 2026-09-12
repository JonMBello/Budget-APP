import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExpenseCard } from "./expense-card";
import { type Expense } from "./contracts";

const mockExpense: Expense = {
  id: "exp-1",
  userId: "user-1",
  periodId: "2026-03",
  title: "Supermercado Walmart",
  amount: 1450.5,
  category: "FOOD",
  date: "2026-03-05",
  cardId: "card-1",
  isPaid: false,
  paymentDueDate: "2026-03-20",
  notes: "Despensa quincenal",
};

const mockSplitExpense: Expense = {
  id: "exp-2",
  userId: "user-1",
  periodId: "2026-03",
  title: "Cena Restaurante",
  amount: 1200,
  category: "ENTERTAINMENT",
  date: "2026-03-06",
  isPaid: true,
  split: {
    personId: "p-1",
    splitType: "PERCENTAGE",
    splitValue: 50,
    isDebtActive: true,
  },

};

describe("ExpenseCard", () => {
  it("renders an expense with category, card, due date and pending status", () => {
    render(
      <ExpenseCard
        expense={mockExpense}
        cardName="Santander LikeU"
      />,
    );

    expect(screen.getByText("Supermercado Walmart")).toBeInTheDocument();
    expect(screen.getByText("Comida")).toBeInTheDocument();
    expect(screen.getByText("$1,450.50")).toBeInTheDocument();
    expect(screen.getByText("Santander LikeU")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("renders a split expense with breakdown and person name", () => {
    render(
      <ExpenseCard
        expense={mockSplitExpense}
        personName="Carlos"
      />,
    );

    expect(screen.getByText("Cena Restaurante")).toBeInTheDocument();
    expect(screen.getByText("Entretenimiento")).toBeInTheDocument();
    expect(screen.getByText("Dividido 50%")).toBeInTheDocument();
    expect(screen.getByText("Tu parte real:")).toBeInTheDocument();
    expect(screen.getByText("Por cobrar a Carlos:")).toBeInTheDocument();
    expect(screen.getByText("Pagado")).toBeInTheDocument();
  });

  it("triggers onTogglePaid, onEdit, and onDelete callbacks", async () => {
    const user = userEvent.setup();
    const onTogglePaid = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ExpenseCard
        expense={mockExpense}
        onTogglePaid={onTogglePaid}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Marcar como pagado" }));
    expect(onTogglePaid).toHaveBeenCalledWith(mockExpense);

    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(onEdit).toHaveBeenCalledWith(mockExpense);

    await user.click(screen.getByRole("button", { name: /eliminar gasto/i }));
    expect(onDelete).toHaveBeenCalledWith(mockExpense);
  });

  it("disables actions when isClosed is true", () => {
    render(
      <ExpenseCard
        expense={mockExpense}
        isClosed={true}
        onTogglePaid={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Marcar como pagado" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar gasto/i })).not.toBeInTheDocument();
  });
});
