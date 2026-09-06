import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExpenseForm } from "./expense-form";
import { type Card } from "@/features/cards/contracts";
import { type Person } from "@/features/people/contracts";
import { type Expense } from "./contracts";

const mockCards: Card[] = [
  {
    id: "card-1",
    name: "BBVA Azul",
    type: "CREDIT",
    color: "#1e40af",
    cutoffDay: 15,
    paymentDueDay: 5,
    isActive: true,
  },
];

const mockPeople: Person[] = [
  { id: "p-1", name: "Andrés Guardado", isActive: true },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ExpenseForm", () => {
  it("renders expense form and validates positive amount and title", async () => {
    const user = userEvent.setup();
    render(
      <ExpenseForm
        periodId="2026-03"
        cards={mockCards}
        people={mockPeople}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Título o concepto del gasto")).toBeInTheDocument();
    expect(screen.getByLabelText("Importe ($)")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Título o concepto del gasto"), "Gasto prueba");
    await user.type(screen.getByLabelText("Importe ($)"), "0");
    await user.click(screen.getByRole("button", { name: "Registrar gasto" }));
    expect(
      await screen.findByText("El importe debe ser un número mayor a cero."),
    ).toBeInTheDocument();
  });

  it("submits a new expense with card and invokes onSuccess", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    const createdExpense: Expense = {
      id: "exp-101",
      userId: "user-1",
      periodId: "2026-03",
      title: "Gasolina Shell",
      amount: 600,
      category: "TRANSPORT",
      date: "2026-03-08",
      cardId: "card-1",
      isPaid: false,
    };

    const fetchMock = vi.fn().mockImplementation((url) => {
      if (String(url).includes("/preview")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            paymentDueDate: "2026-04-05",
            impactBudgetMonth: 4,
            impactBudgetYear: 2026,
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        json: async () => createdExpense,
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <ExpenseForm
        periodId="2026-03"
        cards={mockCards}
        people={mockPeople}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Título o concepto del gasto"), "Gasolina Shell");
    await user.type(screen.getByLabelText("Importe ($)"), "600");
    await user.selectOptions(screen.getByLabelText("Categoría"), "TRANSPORT");
    await user.selectOptions(screen.getByLabelText("Método de pago / Tarjeta"), "card-1");

    await user.click(screen.getByRole("button", { name: "Registrar gasto" }));

    expect(onSuccess).toHaveBeenCalledWith(createdExpense);
  });

  it("edits an existing expense successfully", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    const existing: Expense = {
      id: "exp-202",
      userId: "user-1",
      periodId: "2026-03",
      title: "Cena",
      amount: 500,
      category: "FOOD",
      date: "2026-03-01",
      isPaid: false,
    };

    const updated: Expense = {
      ...existing,
      amount: 550,
      title: "Cena Italiana",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updated,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ExpenseForm
        periodId="2026-03"
        expense={existing}
        cards={mockCards}
        people={mockPeople}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();

    const titleInput = screen.getByLabelText("Título o concepto del gasto");
    await user.clear(titleInput);
    await user.type(titleInput, "Cena Italiana");

    const amountInput = screen.getByLabelText("Importe ($)");
    await user.clear(amountInput);
    await user.type(amountInput, "550");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(onSuccess).toHaveBeenCalledWith(updated);
  });
});
