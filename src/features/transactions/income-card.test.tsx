import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IncomeCard } from "./income-card";
import { type Income } from "./contracts";

const mockIncome: Income = {
  id: "inc-1",
  userId: "user-1",
  periodId: "2026-03",
  title: "Nómina Quincenal",
  amount: 18500,
  source: "PAYROLL",
  date: "2026-03-15",
  isReceived: true,
};

const mockDebtIncome: Income = {
  id: "inc-2",
  userId: "user-1",
  periodId: "2026-03",
  title: "Cobro: Cena Restaurante",
  amount: 600,
  source: "DEBT_COLLECTION",
  date: "2026-03-06",
  isReceived: false,
  debtorPersonId: "p-1",
  linkedExpenseId: "exp-2",
};

describe("IncomeCard", () => {
  it("renders standard income with payroll badge and received status", () => {
    render(<IncomeCard income={mockIncome} />);

    expect(screen.getByText("Nómina Quincenal")).toBeInTheDocument();
    expect(screen.getByText("Nómina")).toBeInTheDocument();
    expect(screen.getByText(/\$18,500\.00/)).toBeInTheDocument();
    expect(screen.getByText("Cobrado")).toBeInTheDocument();
  });

  it("renders debt collection income with debtor name and split badge", () => {
    render(
      <IncomeCard
        income={mockDebtIncome}
        debtorPersonName="Sofía Martínez"
      />,
    );

    expect(screen.getByText("Cobro: Cena Restaurante")).toBeInTheDocument();
    expect(screen.getByText("Cobro de deuda")).toBeInTheDocument();
    expect(screen.getByText("Gasto dividido")).toBeInTheDocument();
    expect(screen.getByText("Sofía Martínez")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("triggers onToggleReceived, onEdit, and onDelete callbacks", async () => {
    const user = userEvent.setup();
    const onToggleReceived = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <IncomeCard
        income={mockIncome}
        onToggleReceived={onToggleReceived}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Marcar como pendiente" }));
    expect(onToggleReceived).toHaveBeenCalledWith(mockIncome);

    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(onEdit).toHaveBeenCalledWith(mockIncome);

    await user.click(screen.getByRole("button", { name: /eliminar ingreso/i }));
    expect(onDelete).toHaveBeenCalledWith(mockIncome);
  });
});
