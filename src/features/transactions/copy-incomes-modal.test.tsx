import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyIncomesModal } from "./copy-incomes-modal";
import { type Income } from "./contracts";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CopyIncomesModal", () => {
  it("renders modal with instructions and triggers copy on submit", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    const copiedIncomes: Income[] = [
      {
        id: "inc-copied-1",
        userId: "user-1",
        periodId: "2026-03",
        title: "Sueldo",
        amount: 20000,
        source: "PAYROLL",
        date: "2026-03-15",
        isReceived: false,
      },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => copiedIncomes,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CopyIncomesModal
        open={true}
        currentPeriodId="2026-03"
        previousPeriodId="2026-02"
        previousPeriodName="Febrero de 2026"
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    expect(screen.getByText("Copiar ingresos del mes anterior")).toBeInTheDocument();
    expect(screen.getByText(/febrero de 2026/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar y copiar" }));

    expect(onSuccess).toHaveBeenCalledWith(copiedIncomes);
    expect(onClose).toHaveBeenCalled();
  });
});
