import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecurringDetail } from "./recurring-detail";
import { type RecurringTemplate } from "./contracts";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const activeService: RecurringTemplate = {
  id: "rec-service-1",
  userId: "user-1",
  title: "Internet Izzi",
  category: "SERVICE",
  amount: 700,
  currency: "MXN",
  startDate: "2026-01-01",
  isActive: true,
  isCancelled: false,
};

const activeMsi: RecurringTemplate = {
  id: "rec-msi-1",
  userId: "user-1",
  title: "Comedor 6 sillas",
  category: "MSI",
  amount: 1500,
  currency: "MXN",
  totalAmount: 18000,
  totalInstallments: 12,
  currentInstallment: 3,
  startDate: "2026-01-01",
  isActive: true,
  isCancelled: false,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RecurringDetail", () => {
  it("renders detail view and allows pausing an active commitment", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...activeService,
        isActive: false,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<RecurringDetail initialTemplate={activeService} />);

    expect(screen.getAllByText("Internet Izzi")[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pausar compromiso" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pausar compromiso" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/recurring/rec-service-1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"isActive":false'),
      }),
    );
    expect(await screen.findByRole("button", { name: "Reanudar compromiso" })).toBeInTheDocument();
  });

  it("handles cancelling a commitment via confirm dialog", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...activeService,
        isActive: false,
        isCancelled: true,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<RecurringDetail initialTemplate={activeService} />);

    await user.click(screen.getByRole("button", { name: "Cancelar compromiso" }));

    expect(screen.getByText("¿Cancelar este compromiso?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/recurring/rec-service-1/cancel",
      expect.objectContaining({
        method: "PATCH",
      }),
    );

    expect(await screen.findByText("Cancelado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar compromiso" })).not.toBeInTheDocument();
  });

  it("shows MSI advance button and opens advance modal", async () => {
    const user = userEvent.setup();
    render(<RecurringDetail initialTemplate={activeMsi} />);

    const advanceButton = screen.getByRole("button", {
      name: "Adelantar cuotas / Liquidar",
    });
    expect(advanceButton).toBeInTheDocument();

    await user.click(advanceButton);
    expect(screen.getByText("Adelantar o liquidar MSI")).toBeInTheDocument();
  });
});
