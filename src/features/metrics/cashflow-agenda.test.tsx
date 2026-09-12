import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Card } from "@/features/cards/contracts";
import type { Person } from "@/features/people/contracts";
import { CashflowAgenda } from "./cashflow-agenda";
import type { AgendaSections, ReceivablesSummary } from "./contracts";

describe("CashflowAgenda (HU-FE-08.3)", () => {
  const sampleCards: Card[] = [
    {
      id: "card-1",
      name: "BBVA Oro",
      type: "CREDIT",
      color: "#004481",
      isActive: true,
      cutoffDay: 10,
      paymentDueDay: 30,
    },
    {
      id: "card-2",
      name: "Banorte Débito",
      type: "DEBIT",
      color: "#eb0029",
      isActive: true,
    },
  ];

  const samplePeople: Person[] = [
    { id: "person-1", name: "Carlos Slim", isActive: true },
    { id: "person-2", name: "Ana Gomez", isActive: true },
  ];

  const sampleReceivables: ReceivablesSummary = {
    pendingDebtCollections: 600,
    debtors: [
      {
        personId: "person-1",
        name: "Carlos Slim",
        amount: 600,
        earliestDueDate: "2026-09-12",
        pendingCount: 2,
      },
    ],
  };

  const sampleAgenda: AgendaSections = {
    overdue: [
      {
        id: "exp-vencido",
        type: "EXPENSE",
        title: "Luz CFE",
        amount: 450,
        date: "2026-09-01",
        dueDate: "2026-09-10",
        isPaid: false,
        category: "SERVICE",
      },
    ],
    upcoming: [
      {
        id: "exp-programado",
        type: "EXPENSE",
        title: "Internet Totalplay",
        amount: 700,
        date: "2026-09-05",
        dueDate: "2026-09-25",
        isPaid: false,
        cardId: "card-1",
        cardName: "BBVA Oro",
        category: "SERVICE",
      },
      {
        id: "inc-cobro",
        type: "INCOME",
        title: "Cobro a Carlos",
        amount: 300,
        date: "2026-09-02",
        dueDate: "2026-09-22",
        isReceived: false,
        debtorPersonId: "person-1",
        debtorName: "Carlos Slim",
        source: "DEBT_COLLECTION",
      },
    ],
    noDate: [
      {
        id: "exp-nodate",
        type: "EXPENSE",
        title: "Reparación pendiente",
        amount: 1200,
        date: "2026-09-15",
        dueDate: null,
        isPaid: false,
        category: "OTHER",
      },
    ],
  };

  it("renders all sections, debtors block, and mandatory disclaimer", () => {
    render(
      <CashflowAgenda
        agenda={sampleAgenda}
        receivables={sampleReceivables}
        cards={sampleCards}
        people={samplePeople}
      />,
    );

    expect(screen.getByText("Agenda de Flujo de Caja")).toBeInTheDocument();

    // Receivables summary
    const recSummary = screen.getByTestId("receivables-summary");
    expect(recSummary).toBeInTheDocument();
    expect(within(recSummary).getByText("Carlos Slim")).toBeInTheDocument();
    expect(within(recSummary).getByText("2 cobros pendientes")).toBeInTheDocument();
    expect(
      within(recSummary).getByRole("link", { name: "Ver cuenta global" }),
    ).toHaveAttribute("href", "/people/person-1");

    // Sections
    expect(screen.getByTestId("agenda-section-overdue")).toBeInTheDocument();
    expect(screen.getByTestId("agenda-section-upcoming")).toBeInTheDocument();
    expect(screen.getByTestId("agenda-section-nodate")).toBeInTheDocument();

    // Disclaimer
    expect(
      screen.getByText(/no representa saldo bancario disponible ni el pago mínimo requerido por tu banco/),
    ).toBeInTheDocument();
  });

  it("filters items by type, card, and debtor person", async () => {
    const user = userEvent.setup();
    render(
      <CashflowAgenda
        agenda={sampleAgenda}
        receivables={sampleReceivables}
        cards={sampleCards}
        people={samplePeople}
      />,
    );

    // Initial state: all items visible
    expect(screen.getByText("Luz CFE")).toBeInTheDocument();
    expect(screen.getByText("Internet Totalplay")).toBeInTheDocument();
    expect(screen.getByText("Cobro a Carlos")).toBeInTheDocument();
    expect(screen.getByText("Reparación pendiente")).toBeInTheDocument();

    // Filter by type: Solo cobros pendientes
    const typeSelect = screen.getByLabelText("Tipo:");
    await user.selectOptions(typeSelect, "INCOME");

    expect(screen.queryByText("Luz CFE")).not.toBeInTheDocument();
    expect(screen.queryByText("Internet Totalplay")).not.toBeInTheDocument();
    expect(screen.getByText("Cobro a Carlos")).toBeInTheDocument();

    // Reset to ALL and filter by card
    await user.selectOptions(typeSelect, "ALL");
    const cardSelect = screen.getByLabelText("Tarjeta / Cuenta:");
    await user.selectOptions(cardSelect, "card-1");

    expect(screen.getByText("Internet Totalplay")).toBeInTheDocument();
    expect(screen.queryByText("Luz CFE")).not.toBeInTheDocument();
    expect(screen.queryByText("Cobro a Carlos")).not.toBeInTheDocument();
  });

  it("calls onTogglePaidExpense and onToggleReceivedIncome when user clicks action buttons", async () => {
    const user = userEvent.setup();
    const onTogglePaid = vi.fn().mockResolvedValue(undefined);
    const onToggleReceived = vi.fn().mockResolvedValue(undefined);

    render(
      <CashflowAgenda
        agenda={sampleAgenda}
        receivables={sampleReceivables}
        cards={sampleCards}
        people={samplePeople}
        onTogglePaidExpense={onTogglePaid}
        onToggleReceivedIncome={onToggleReceived}
      />,
    );

    const payBtn = screen.getByTestId("toggle-button-exp-vencido");
    await user.click(payBtn);
    expect(onTogglePaid).toHaveBeenCalledWith("exp-vencido");

    const receiveBtn = screen.getByTestId("toggle-button-inc-cobro");
    await user.click(receiveBtn);
    expect(onToggleReceived).toHaveBeenCalledWith("inc-cobro");
  });
});
