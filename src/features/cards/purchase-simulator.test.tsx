import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PurchaseSimulator } from "./purchase-simulator";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PurchaseSimulator", () => {
  it("fetches and displays cycle preview on load and on date change", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        statementCutoffDate: "2026-09-15",
        paymentDueDate: "2026-10-05",
        impactBudgetYear: 2026,
        impactBudgetMonth: 10,
        daysUntilDue: 25,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PurchaseSimulator cardId="card-test-123" />);

    expect(await screen.findByText("2026-09-15")).toBeInTheDocument();
    expect(screen.getByText("2026-10-05")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();

    const user = userEvent.setup();
    const dateInput = screen.getByLabelText("Fecha de la compra");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-09-20");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/app/bff/cards/card-test-123/preview?date=2026-09-20"),
      expect.anything(),
    );
  });

  it("handles fetch error gracefully", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", fetchMock);

    render(<PurchaseSimulator cardId="card-test-123" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión");
  });
});
