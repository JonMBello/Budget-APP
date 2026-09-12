import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CardDetail } from "./card-detail";
import type { Card } from "./contracts";

const creditCard: Card = {
  id: "card-detail-1",
  name: "Banorte Platino",
  type: "CREDIT",
  color: "#ef4444",
  last4Digits: "1234",
  cutoffDay: 15,
  paymentDueDay: 5,
  isActive: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CardDetail", () => {
  it("renders card detail and purchase simulator for credit card", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        statementCutoffDate: "2026-09-15",
        paymentDueDate: "2026-10-05",
        impactBudgetYear: 2026,
        impactBudgetMonth: 10,
        daysUntilDue: 25,
      }),
    }));

    render(<CardDetail initialCard={creditCard} />);
    expect(screen.getAllByText("Banorte Platino")[0]).toBeInTheDocument();
    expect(screen.getByText("Simulador de fecha de compra")).toBeInTheDocument();
  });

  it("toggles edit form", async () => {
    const user = userEvent.setup();
    render(<CardDetail initialCard={creditCard} />);

    expect(screen.queryByLabelText("Nombre de la tarjeta o cuenta")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editar método de pago" }));
    expect(screen.getByLabelText("Nombre de la tarjeta o cuenta")).toBeInTheDocument();
  });

  it("archives card upon confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...creditCard, isActive: false }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CardDetail initialCard={creditCard} />);

    await user.click(screen.getByRole("button", { name: "Archivar tarjeta" }));
    expect(screen.getByText("¿Archivar este método de pago?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/cards/card-detail-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(await screen.findByText("Archivada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archivar tarjeta" })).not.toBeInTheDocument();
  });
});
