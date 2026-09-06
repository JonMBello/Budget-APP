import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecurringList } from "./recurring-list";
import { type RecurringTemplate } from "./contracts";

const templates: RecurringTemplate[] = [
  {
    id: "rec-1",
    userId: "user-1",
    title: "Luz CFE",
    category: "SERVICE",
    amount: 450,
    currency: "MXN",
    startDate: "2026-01-01",
    isActive: true,
    isCancelled: false,
  },
  {
    id: "rec-2",
    userId: "user-1",
    title: "Spotify Individual",
    category: "SUBSCRIPTION",
    amount: 129,
    currency: "MXN",
    startDate: "2026-01-01",
    isActive: true,
    isCancelled: false,
  },
  {
    id: "rec-3",
    userId: "user-1",
    title: "Laptop HP MSI",
    category: "MSI",
    amount: 1250,
    currency: "MXN",
    totalAmount: 15000,
    totalInstallments: 12,
    currentInstallment: 5,
    startDate: "2025-10-01",
    isActive: true,
    isCancelled: false,
  },
  {
    id: "rec-4",
    userId: "user-1",
    title: "Gimnasio",
    category: "SERVICE",
    amount: 800,
    currency: "MXN",
    startDate: "2025-01-01",
    isActive: false,
    isCancelled: false,
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RecurringList", () => {
  it("renders list and filters by category tab", async () => {
    const user = userEvent.setup();
    render(<RecurringList initialTemplates={templates} />);

    expect(screen.getByText("Todas (4)")).toBeInTheDocument();
    expect(screen.getByText("Servicios (1)")).toBeInTheDocument();
    expect(screen.getByText("Suscripciones (1)")).toBeInTheDocument();
    expect(screen.getByText("MSI (1)")).toBeInTheDocument();
    expect(screen.getByText("Inactivas (1)")).toBeInTheDocument();

    // Default tab is ALL: all 4 cards appear
    expect(screen.getByText("Luz CFE")).toBeInTheDocument();
    expect(screen.getByText("Laptop HP MSI")).toBeInTheDocument();

    // Filter to MSI
    await user.click(screen.getByText("MSI (1)"));
    expect(screen.getByText("Laptop HP MSI")).toBeInTheDocument();
    expect(screen.queryByText("Luz CFE")).not.toBeInTheDocument();

    // Filter to Inactive
    await user.click(screen.getByText("Inactivas (1)"));
    expect(screen.getByText("Gimnasio")).toBeInTheDocument();
    expect(screen.queryByText("Laptop HP MSI")).not.toBeInTheDocument();
  });

  it("triggers instantiate monthly action via confirm dialog", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/instantiate")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            count: 3,
            year: 2026,
            month: 9,
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => templates,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<RecurringList initialTemplates={templates} />);

    await user.click(screen.getByRole("button", { name: "⚡ Instanciar en mes activo" }));

    expect(screen.getByText("¿Instanciar compromisos del mes?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/recurring/instantiate",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(
      await screen.findByText(/Se instanciaron 3 compromisos/),
    ).toBeInTheDocument();
  });
});
