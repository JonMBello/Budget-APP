import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecurringForm } from "./recurring-form";
import { type RecurringTemplate } from "./contracts";
import { type Card } from "@/features/cards/contracts";
import { type Person } from "@/features/people/contracts";

const mockCards: Card[] = [
  {
    id: "card-1",
    name: "BBVA Oro",
    type: "CREDIT",
    color: "#2563eb",
    isActive: true,
  },
];

const mockPeople: Person[] = [
  {
    id: "person-1",
    name: "Ana Gómez",
    isActive: true,
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RecurringForm", () => {
  it("renders creation form with default service fields and validates required title", async () => {
    const user = userEvent.setup();
    render(<RecurringForm cards={mockCards} people={mockPeople} />);

    expect(screen.getByLabelText("Tipo de compromiso")).toHaveValue("SERVICE");
    expect(screen.getByLabelText("Título del compromiso o servicio")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Crear compromiso" }));
    expect(
      await screen.findByText("El título debe tener al menos 2 caracteres"),
    ).toBeInTheDocument();
  });

  it("switches to MSI and displays installment calculation preview", async () => {
    const user = userEvent.setup();
    render(<RecurringForm cards={mockCards} people={mockPeople} />);

    await user.selectOptions(screen.getByLabelText("Tipo de compromiso"), "MSI");

    expect(screen.getByLabelText("Monto total de la compra")).toBeInTheDocument();
    expect(screen.getByLabelText("Plazo total (meses)")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Monto total de la compra"), "18000");

    expect(await screen.findByText("Cuota calculada:")).toBeInTheDocument();
    expect(screen.getByText("$1500.00")).toBeInTheDocument();
  });

  it("successfully submits a new SERVICE commitment", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: "rec-new",
        userId: "user-1",
        title: "Totalplay 500MB",
        category: "SERVICE",
        amount: 600,
        currency: "MXN",
        startDate: "2026-02-01",
        isActive: true,
        isCancelled: false,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<RecurringForm cards={mockCards} onSuccess={onSuccess} />);

    await user.type(
      screen.getByLabelText("Título del compromiso o servicio"),
      "Totalplay 500MB",
    );
    await user.type(screen.getByLabelText("Monto mensual estimado"), "600");
    await user.click(screen.getByRole("button", { name: "Crear compromiso" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/recurring",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("submits an update for an existing commitment", async () => {
    const existing: RecurringTemplate = {
      id: "rec-edit",
      userId: "user-1",
      title: "Spotify Familiar",
      category: "SUBSCRIPTION",
      amount: 199,
      currency: "MXN",
      startDate: "2025-01-01",
      isActive: true,
      isCancelled: false,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...existing,
        amount: 249,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<RecurringForm template={existing} onSuccess={onSuccess} />);

    expect(screen.getByDisplayValue("Spotify Familiar")).toBeInTheDocument();
    const amountInput = screen.getByLabelText("Monto mensual estimado");
    await user.clear(amountInput);
    await user.type(amountInput, "249");
    await user.click(screen.getByRole("button", { name: "Actualizar compromiso" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/recurring/rec-edit",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });
});
