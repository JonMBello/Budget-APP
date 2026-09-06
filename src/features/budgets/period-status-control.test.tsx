import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PeriodStatusControl } from "./period-status-control";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PeriodStatusControl", () => {
  it("closes an open period upon confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        year: 2026,
        month: 9,
        status: "CLOSED",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onStatusChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PeriodStatusControl
        period={{ year: 2026, month: 9, status: "OPEN" }}
        onStatusChange={onStatusChange}
      />,
    );

    const closeBtn = screen.getByRole("button", { name: "Cerrar mes" });
    expect(closeBtn).toBeInTheDocument();

    await user.click(closeBtn);
    expect(
      screen.getByText("¿Cerrar este periodo presupuestario?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/budgets/2026/9/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "CLOSED" }),
      }),
    );
    expect(onStatusChange).toHaveBeenCalledWith("CLOSED");
  });

  it("reopens a closed period upon confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        year: 2026,
        month: 9,
        status: "OPEN",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onStatusChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PeriodStatusControl
        period={{ year: 2026, month: 9, status: "CLOSED" }}
        onStatusChange={onStatusChange}
      />,
    );

    const reopenBtn = screen.getByRole("button", { name: "Reabrir mes" });
    expect(reopenBtn).toBeInTheDocument();

    await user.click(reopenBtn);
    expect(
      screen.getByText("¿Reabrir este periodo presupuestario?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/budgets/2026/9/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "OPEN" }),
      }),
    );
    expect(onStatusChange).toHaveBeenCalledWith("OPEN");
  });
});
