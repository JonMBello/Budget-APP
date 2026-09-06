import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CardForm } from "./card-form";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CardForm", () => {
  it("renders credit card fields by default and validates required cutoff", async () => {
    const user = userEvent.setup();
    render(<CardForm />);

    expect(screen.getByLabelText("Tipo de cuenta")).toHaveValue("CREDIT");
    expect(screen.getByLabelText("Día de corte (1 al 31)")).toBeInTheDocument();
    expect(screen.getByLabelText("Día límite de pago (1 al 31)")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nombre de la tarjeta o cuenta"), "Mi Tarjeta");
    await user.click(screen.getByRole("button", { name: "Agregar método de pago" }));

    expect(await screen.findByText("El día de corte es obligatorio para tarjetas de crédito.")).toBeInTheDocument();
  });

  it("switches to CASH type and hides credit cycle fields", async () => {
    const user = userEvent.setup();
    render(<CardForm />);

    await user.selectOptions(screen.getByLabelText("Tipo de cuenta"), "CASH");

    expect(screen.queryByLabelText("Día de corte (1 al 31)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Día límite de pago (1 al 31)")).not.toBeInTheDocument();
  });

  it("submits a valid CASH card successfully", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: "card-cash-1",
        name: "Efectivo Cartera",
        type: "CASH",
        color: "#10b981",
        isActive: true,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<CardForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Nombre de la tarjeta o cuenta"), "Efectivo Cartera");
    await user.selectOptions(screen.getByLabelText("Tipo de cuenta"), "CASH");
    await user.click(screen.getByRole("button", { name: "Agregar método de pago" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/cards",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: "card-cash-1", name: "Efectivo Cartera" }),
    );
  });

  it("displays server error message when creation fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Datos inválidos para la tarjeta." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CardForm />);

    await user.type(screen.getByLabelText("Nombre de la tarjeta o cuenta"), "Test");
    await user.selectOptions(screen.getByLabelText("Tipo de cuenta"), "DEBIT");
    await user.click(screen.getByRole("button", { name: "Agregar método de pago" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Datos inválidos para la tarjeta.");
  });
});
