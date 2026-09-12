import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CarriedSavingsEditor } from "./carried-savings-editor";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CarriedSavingsEditor", () => {
  it("renders carried savings and allows updating with notes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        year: 2026,
        month: 9,
        carriedSavings: 4500,
        notes: "Ajuste por bono de productividad",
        status: "OPEN",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onSaved = vi.fn();
    const user = userEvent.setup();

    render(
      <CarriedSavingsEditor
        period={{
          year: 2026,
          month: 9,
          carriedSavings: 2000,
          notes: "Ahorro inicial",
          status: "OPEN",
        }}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByText("$2,000.00")).toBeInTheDocument();
    expect(screen.getByText("Nota: Ahorro inicial")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ajustar ahorro" }));

    const input = screen.getByLabelText("Monto de ahorro o déficit");
    await user.clear(input);
    await user.type(input, "4500");

    const notesInput = screen.getByLabelText(
      "Motivo o notas del ajuste (opcional)",
    );
    await user.clear(notesInput);
    await user.type(notesInput, "Ajuste por bono de productividad");

    await user.click(screen.getByRole("button", { name: "Guardar ajuste" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/budgets/2026/9/savings",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          carriedSavings: 4500,
          notes: "Ajuste por bono de productividad",
        }),
      }),
    );
    expect(await screen.findByText("$4,500.00")).toBeInTheDocument();
    expect(
      screen.getByText("Nota: Ajuste por bono de productividad"),
    ).toBeInTheDocument();
  });

  it("disables editing when period is CLOSED", () => {
    render(
      <CarriedSavingsEditor
        period={{
          year: 2026,
          month: 9,
          carriedSavings: 2000,
          status: "CLOSED",
        }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Ajustar ahorro" }),
    ).not.toBeInTheDocument();
  });
});
