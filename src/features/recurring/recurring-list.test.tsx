import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecurringList } from "./recurring-list";
import { type RecurringTemplate } from "./contracts";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const period = { id: "period-1", userId: "user-1", year: 2025, month: 4, status: "OPEN" as const, carriedSavings: 0, totalIncome: 0, totalExpenses: 0 };

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
    render(<RecurringList period={period} initialTemplates={templates} />);

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
            periodId: period.id, createdCount: 3, skippedCount: 2,
            year: period.year, month: period.month,
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
    render(<RecurringList period={period} initialTemplates={templates} />);

    await user.click(screen.getByRole("button", { name: "Agregar al periodo" }));

    expect(screen.getByText("¿Agregar compromisos al periodo?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/recurring/instantiate",
      expect.objectContaining({
        method: "POST", body: JSON.stringify({ periodId: period.id }),
      }),
    );
    expect(
      await screen.findByText(/Se agregaron 3 gastos/),
    ).toBeInTheDocument();
  });
  it.each([null, { ...period, status: "CLOSED" as const }])("disables adding without an open period", (destination) => {
    render(<RecurringList period={destination} initialTemplates={templates} />);
    expect(screen.getByRole("button", { name: "Agregar al periodo" })).toBeDisabled();
  });

  it.each([
    [{ totalCount: 3, year: 2025, month: 4 }, /No pudimos confirmar/],
    [{ periodId: "another", createdCount: 3, skippedCount: 0, year: 2025, month: 4 }, /No pudimos confirmar/],
  ])("rejects incompatible results", async (result, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => result }));
    const user = userEvent.setup();
    render(<RecurringList period={period} initialTemplates={templates} />);
    await user.click(screen.getByRole("button", { name: "Agregar al periodo" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByText(/✓/)).not.toBeInTheDocument();
  });

  it.each([
    [2, /2 ya estaban registrados/],
    [0, /No hay compromisos elegibles/],
  ])("explains zero new expenses", async (skippedCount, message) => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => Promise.resolve({ ok: true, status: 200,
      json: async () => url.includes("instantiate") ? { periodId: period.id, year: period.year, month: period.month, createdCount: 0, skippedCount } : templates,
    })));
    const user = userEvent.setup();
    render(<RecurringList period={period} initialTemplates={templates} />);
    await user.click(screen.getByRole("button", { name: "Agregar al periodo" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByRole("status")).toHaveTextContent(message);
    expect(screen.getByRole("link", { name: "Ver gastos del periodo" })).toHaveAttribute("href", "/expenses?period=2025-04");
    expect(refresh).toHaveBeenCalled();
  });

  it("prevents duplicate submissions and retries the same period after failure", async () => {
    let finish: (value: unknown) => void = () => {};
    const fetchMock = vi.fn().mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ periodId: period.id, year: period.year, month: period.month, createdCount: 1, skippedCount: 0 }) })
      .mockResolvedValue({ ok: true, status: 200, json: async () => templates });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<RecurringList period={period} initialTemplates={templates} />);
    await user.click(screen.getByRole("button", { name: "Agregar al periodo" }));
    await user.dblClick(screen.getByRole("button", { name: "Confirmar" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Agregando…" })).toBeDisabled();
    finish({ ok: false, status: 503, json: async () => ({ message: "Servicio temporalmente no disponible" }) });
    expect(await screen.findByRole("alert")).toHaveTextContent("Servicio temporalmente no disponible");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Se agregaron 1 gastos");
    const submissions = fetchMock.mock.calls.filter(([url]) => String(url).includes("instantiate"));
    expect(submissions).toHaveLength(2);
    for (const [, options] of submissions) expect(JSON.parse(options.body)).toEqual({ periodId: period.id });
  });

});
