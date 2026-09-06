import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InitializeMonthWizard } from "./initialize-month-wizard";
import type { BudgetPeriod } from "./contracts";

const previousFixture: BudgetPeriod = {
  id: "b-prev",
  userId: "u-1",
  year: 2026,
  month: 8,
  status: "CLOSED",
  carriedSavings: 1000,
  totalIncome: 20000,
  totalExpenses: 15000, // Remaining savings = 1000 + 20000 - 15000 = 6000
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("InitializeMonthWizard", () => {
  it("suggests next month and carried savings from previous month", () => {
    render(<InitializeMonthWizard lastPeriod={previousFixture} />);

    expect(screen.getByLabelText("Año")).toHaveValue("2026");
    expect(screen.getByLabelText("Mes")).toHaveValue("9");
    expect(screen.getByLabelText("Ahorro o déficit acarreado")).toHaveValue("6000");
  });

  it("submits initialization with custom deficit savings", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: "b-new",
        userId: "u-1",
        year: 2026,
        month: 10,
        status: "OPEN",
        carriedSavings: -500,
        totalIncome: 0,
        totalExpenses: 0,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onCreated = vi.fn();
    const user = userEvent.setup();

    render(
      <InitializeMonthWizard
        lastPeriod={previousFixture}
        onCreated={onCreated}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Mes"), "10");
    const savingsInput = screen.getByLabelText("Ahorro o déficit acarreado");
    await user.clear(savingsInput);
    await user.type(savingsInput, "-500");

    await user.click(screen.getByRole("button", { name: "Abrir periodo" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/budgets/initialize",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          year: 2026,
          month: 10,
          carriedSavings: -500,
        }),
      }),
    );
    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        year: 2026,
        month: 10,
        carriedSavings: -500,
      }),
    );
  });

  it("displays error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          message: "No pudimos inicializar este periodo presupuestario.",
        }),
      }),
    );

    const user = userEvent.setup();
    render(<InitializeMonthWizard lastPeriod={null} />);

    await user.click(screen.getByRole("button", { name: "Abrir periodo" }));

    expect(
      await screen.findByText("No pudimos inicializar este periodo presupuestario."),
    ).toBeInTheDocument();
  });
});
