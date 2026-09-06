import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecurringCard } from "./recurring-card";
import { type RecurringTemplate } from "./contracts";

const serviceTemplate: RecurringTemplate = {
  id: "rec-1",
  userId: "user-1",
  title: "Internet Totalplay",
  category: "SERVICE",
  amount: 650,
  currency: "MXN",
  startDate: "2026-01-15",
  isActive: true,
  isCancelled: false,
};

const msiTemplate: RecurringTemplate = {
  id: "rec-2",
  userId: "user-1",
  title: "Refrigerador Samsung",
  category: "MSI",
  amount: 1000,
  currency: "MXN",
  totalAmount: 12000,
  totalInstallments: 12,
  currentInstallment: 4,
  startDate: "2025-11-01",
  isActive: true,
  isCancelled: false,
  split: {
    personId: "p-1",
    splitType: "PERCENTAGE",
    splitValue: 50,
  },
};

const cancelledTemplate: RecurringTemplate = {
  id: "rec-3",
  userId: "user-1",
  title: "Netflix 4K",
  category: "SUBSCRIPTION",
  amount: 299,
  currency: "MXN",
  startDate: "2025-05-01",
  isActive: false,
  isCancelled: true,
};

describe("RecurringCard", () => {
  it("renders a standard service commitment with link and active badge", () => {
    render(
      <RecurringCard
        template={serviceTemplate}
        cardName="BBVA Crédito"
      />,
    );

    expect(screen.getByText("Internet Totalplay")).toBeInTheDocument();
    expect(screen.getByText("Servicio")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("$650.00")).toBeInTheDocument();
    expect(screen.getByText("BBVA Crédito")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/recurring/rec-1");
  });

  it("renders an MSI commitment with progress bar, split tag, and unlinked view", () => {
    render(
      <RecurringCard
        template={msiTemplate}
        personName="Carlos"
        linked={false}
      />,
    );

    expect(screen.getByText("Refrigerador Samsung")).toBeInTheDocument();
    expect(screen.getByText("MSI")).toBeInTheDocument();
    expect(screen.getByText("Cuota 4 de 12")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("Dividido 50%")).toBeInTheDocument();
    expect(screen.getByText("Carlos")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders a cancelled subscription with cancelled status tag", () => {
    render(<RecurringCard template={cancelledTemplate} />);

    expect(screen.getByText("Netflix 4K")).toBeInTheDocument();
    expect(screen.getByText("Suscripción")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });
});
