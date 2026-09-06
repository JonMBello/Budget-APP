import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IncomeForm } from "./income-form";
import { type Person } from "@/features/people/contracts";
import { type Income } from "./contracts";

const mockPeople: Person[] = [
  { id: "p-1", name: "Sofía Martínez", isActive: true },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("IncomeForm", () => {
  it("validates positive amount and title", async () => {
    const user = userEvent.setup();
    render(
      <IncomeForm
        periodId="2026-03"
        people={mockPeople}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Título o concepto del ingreso")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Título o concepto del ingreso"), "Ingreso prueba");
    await user.type(screen.getByLabelText("Importe ($)"), "0");
    await user.click(screen.getByRole("button", { name: "Registrar ingreso" }));
    expect(
      await screen.findByText("El importe debe ser un número mayor a cero."),
    ).toBeInTheDocument();
  });

  it("submits a new income successfully", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    const createdIncome: Income = {
      id: "inc-101",
      userId: "user-1",
      periodId: "2026-03",
      title: "Freelance Diseño",
      amount: 4500,
      source: "DEPOSIT",
      date: "2026-03-12",
      isReceived: true,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => createdIncome,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <IncomeForm
        periodId="2026-03"
        people={mockPeople}
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Título o concepto del ingreso"), "Freelance Diseño");
    await user.type(screen.getByLabelText("Importe ($)"), "4500");
    await user.selectOptions(screen.getByLabelText("Fuente de ingreso"), "DEPOSIT");
    await user.click(screen.getByLabelText("Ya ingresado / cobrado en cuenta"));

    await user.click(screen.getByRole("button", { name: "Registrar ingreso" }));

    expect(onSuccess).toHaveBeenCalledWith(createdIncome);
  });

  it("shows notice for linked income and disables source selector", () => {
    const linkedIncome: Income = {
      id: "inc-linked-1",
      userId: "user-1",
      periodId: "2026-03",
      title: "Cobro cena",
      amount: 400,
      source: "DEBT_COLLECTION",
      date: "2026-03-05",
      isReceived: false,
      linkedExpenseId: "exp-10",
    };

    render(
      <IncomeForm
        periodId="2026-03"
        income={linkedIncome}
        people={mockPeople}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText(/cobro vinculado/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Fuente de ingreso")).toBeDisabled();
  });
});
