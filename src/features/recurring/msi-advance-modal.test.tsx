import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MsiAdvanceModal } from "./msi-advance-modal";
import { type RecurringTemplate } from "./contracts";

const msiTemplate: RecurringTemplate = {
  id: "rec-msi-1",
  userId: "user-1",
  title: "Pantalla OLED",
  category: "MSI",
  amount: 2000,
  currency: "MXN",
  totalAmount: 12000,
  totalInstallments: 6,
  currentInstallment: 2,
  startDate: "2026-01-01",
  isActive: true,
  isCancelled: false,
  split: {
    personId: "p-1",
    splitType: "PERCENTAGE",
    splitValue: 50,
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("MsiAdvanceModal", () => {
  it("renders modal details with split warning and remaining count", () => {
    render(
      <MsiAdvanceModal
        open={true}
        template={msiTemplate}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByText("Adelantar o liquidar MSI")).toBeInTheDocument();
    expect(screen.getByText(/4 cuotas restantes/)).toBeInTheDocument();
    expect(screen.getByText(/Plan compartido/)).toBeInTheDocument();
  });

  it("submits advance with specific installments count", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...msiTemplate,
        currentInstallment: 4,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <MsiAdvanceModal
        open={true}
        template={msiTemplate}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    const input = screen.getByLabelText("Número de cuotas a adelantar");
    await user.clear(input);
    await user.type(input, "2");
    await user.click(screen.getByRole("button", { name: "Confirmar adelanto" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/recurring/rec-msi-1/advance",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"installmentsCount":2'),
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("switches to payAll mode and submits full payoff", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...msiTemplate,
        currentInstallment: 6,
        isActive: false,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(
      <MsiAdvanceModal
        open={true}
        template={msiTemplate}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    await user.click(
      screen.getByLabelText("Liquidar todo el saldo restante por completo"),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar adelanto" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/recurring/rec-msi-1/advance",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"payAll":true'),
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });
});
