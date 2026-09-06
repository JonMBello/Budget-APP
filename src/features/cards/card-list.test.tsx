import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CardList } from "./card-list";
import type { Card } from "./contracts";

const initialCards: Card[] = [
  {
    id: "c-1",
    name: "Banorte Activa",
    type: "CREDIT",
    color: "#ef4444",
    last4Digits: "1111",
    cutoffDay: 15,
    paymentDueDay: 5,
    isActive: true,
  },
  {
    id: "c-2",
    name: "Santander Archivada",
    type: "DEBIT",
    color: "#3b82f6",
    last4Digits: "2222",
    isActive: false,
  },
];

describe("CardList", () => {
  it("renders active cards by default and filters to all when tab is clicked", async () => {
    const user = userEvent.setup();
    render(<CardList initialCards={initialCards} />);

    expect(screen.getByText("Banorte Activa")).toBeInTheDocument();
    expect(screen.queryByText("Santander Archivada")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Todas (2)" }));

    expect(screen.getByText("Banorte Activa")).toBeInTheDocument();
    expect(screen.getByText("Santander Archivada")).toBeInTheDocument();
  });

  it("renders empty state when there are no cards", () => {
    render(<CardList initialCards={[]} />);
    expect(screen.getByText("No tienes cuentas activas")).toBeInTheDocument();
  });

  it("toggles card creation form", async () => {
    const user = userEvent.setup();
    render(<CardList initialCards={initialCards} />);

    expect(screen.queryByLabelText("Nombre de la tarjeta o cuenta")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ Agregar método de pago" }));
    expect(screen.getByLabelText("Nombre de la tarjeta o cuenta")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByLabelText("Nombre de la tarjeta o cuenta")).not.toBeInTheDocument();
  });
});
