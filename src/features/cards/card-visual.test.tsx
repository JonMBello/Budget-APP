import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardVisual } from "./card-visual";
import type { Card } from "./contracts";

const creditCard: Card = {
  id: "card-1",
  name: "Banorte Platino",
  type: "CREDIT",
  color: "#ef4444",
  last4Digits: "1234",
  cutoffDay: 15,
  paymentDueDay: 5,
  isActive: true,
};

const cashCard: Card = {
  id: "card-2",
  name: "Cartera Personal",
  type: "CASH",
  color: "#10b981",
  isActive: false,
};

describe("CardVisual", () => {
  it("renders credit card details with cycle info and link", () => {
    render(<CardVisual card={creditCard} />);
    expect(screen.getByText("Banorte Platino")).toBeInTheDocument();
    expect(screen.getByText("Crédito")).toBeInTheDocument();
    expect(screen.getByText("•••• 1234")).toBeInTheDocument();
    expect(screen.getByText("día 15")).toBeInTheDocument();
    expect(screen.getByText("día 5")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/cards/card-1");
  });

  it("renders inactive cash card without link and with archived tag", () => {
    render(<CardVisual card={cashCard} linked={false} />);
    expect(screen.getByText("Cartera Personal")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("Archivada")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
