import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DebtSummaryView } from "./debt-summary-view";
import type { DebtSummary } from "./contracts";

const debtsFixture: DebtSummary = {
  totalDebt: 3200,
  immediateDueAmount: 1200,
  nextPaymentDueDate: "2026-10-05",
  periods: [
    {
      period: "2026-09",
      year: 2026,
      month: 9,
      periodName: "Septiembre 2026",
      periodId: "p-100",
      totalDebt: 1200,
      msiInstallments: [
        {
          title: "PlayStation 5",
          currentInstallment: 3,
          totalInstallments: 12,
          amount: 1000,
          paymentDueDate: "2026-10-05",
          cardName: "BBVA Oro",
        },
      ],
      recurringServices: [
        {
          title: "YouTube Premium",
          amount: 200,
          paymentDueDate: "2026-10-01",
        },
      ],
      singleExpenses: [
        {
          expenseId: "exp-single-99",
          title: "Cena en terraza",
          amount: 800,
          paymentDueDate: "2026-09-25",
          settled: false,
        },
      ],
    },
    {
      period: "2026-10",
      year: 2026,
      month: 10,
      periodName: "Octubre 2026",
      periodId: null,
      totalDebt: 2000,
      msiInstallments: [
        {
          title: "Monitor 4K",
          currentInstallment: 1,
          totalInstallments: 6,
          amount: 1000,
          paymentDueDate: "2026-11-05",
          cardName: "BBVA Oro",
        },
      ],
      recurringServices: [],
      singleExpenses: [],
    },
  ],
  msiInstallments: [
    {
      title: "PlayStation 5",
      currentInstallment: 3,
      totalInstallments: 12,
      amount: 1000,
      paymentDueDate: "2026-10-05",
      cardName: "BBVA Oro",
    },
  ],
  recurringServices: [
    {
      title: "YouTube Premium",
      amount: 200,
      paymentDueDate: "2026-10-01",
    },
  ],
  singleExpenses: [
    {
      expenseId: "exp-single-99",
      title: "Cena en terraza",
      amount: 800,
      paymentDueDate: "2026-09-25",
      settled: false,
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DebtSummaryView", () => {
  it("does not claim there are no debts after a failed request and allows retry", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({ message: "No pudimos consultar las deudas." }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => debtsFixture });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<DebtSummaryView personId="person-100" />);
    expect(await screen.findByText("No pudimos consultar las deudas.")).toBeInTheDocument();
    expect(screen.queryByText("Esta persona no tiene deudas ni cobros pendientes registrados.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver a intentar" }));
    expect(await screen.findByText("PlayStation 5")).toBeInTheDocument();
    expect(screen.queryByText("No pudimos consultar las deudas.")).not.toBeInTheDocument();
  });

  it("fetches and displays debt summary with breakdowns", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => debtsFixture,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DebtSummaryView personId="person-100" />);

    expect(await screen.findByText("PlayStation 5")).toBeInTheDocument();
    expect(screen.getByText("Cuota 3 de 12 · BBVA Oro · Vence: 5 oct 2026")).toBeInTheDocument();
    expect(screen.getByText("YouTube Premium")).toBeInTheDocument();
    expect(screen.getByText("Cena en terraza")).toBeInTheDocument();
  });

  it("handles settle action on single expense", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => debtsFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...debtsFixture, singleExpenses: [] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<DebtSummaryView personId="person-100" />);

    const settleBtn = await screen.findByRole("button", { name: "Marcar cobrado" });
    await user.click(settleBtn);

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/people/person-100/settle",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ expenseId: "exp-single-99" }),
      }),
    );
    expect(await screen.findByText("Cobro registrado exitosamente.")).toBeInTheDocument();
  });

  it("displays empty state when there are no debts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          totalDebt: 0,
          immediateDueAmount: 0,
          nextPaymentDueDate: null,
          periods: [],
          msiInstallments: [],
          recurringServices: [],
          singleExpenses: [],
        }),
      }),
    );

    render(<DebtSummaryView personId="person-100" />);

    expect(
      await screen.findByText("Esta persona no tiene deudas ni cobros pendientes registrados."),
    ).toBeInTheDocument();
  });

  it("filters items by period when clicking period tabs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => debtsFixture,
      }),
    );
    const user = userEvent.setup();
    render(<DebtSummaryView personId="person-100" />);

    expect(await screen.findByText("Septiembre 2026")).toBeInTheDocument();
    expect(screen.getByText("Periodo actual")).toBeInTheDocument();
    expect(screen.getByText("Octubre 2026")).toBeInTheDocument();
    expect(screen.getByText("Proyección futura")).toBeInTheDocument();
    expect(screen.getByText("PlayStation 5")).toBeInTheDocument();
    expect(screen.getByText("Monitor 4K")).toBeInTheDocument();

    // Filter by October 2026
    const octoberTab = screen.getByRole("button", { name: /Octubre 2026/ });
    await user.click(octoberTab);

    expect(screen.getByText("Monitor 4K")).toBeInTheDocument();
    expect(screen.queryByText("PlayStation 5")).not.toBeInTheDocument();
    expect(screen.queryByText("Septiembre 2026")).not.toBeInTheDocument();
  });
});
