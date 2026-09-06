import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PersonForm } from "./person-form";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PersonForm", () => {
  it("validates that name has at least 2 characters", async () => {
    const user = userEvent.setup();
    render(<PersonForm />);

    await user.type(screen.getByLabelText("Nombre completo o alias"), "A");
    await user.click(screen.getByRole("button", { name: "Registrar persona" }));

    expect(
      await screen.findByText("El nombre debe tener al menos 2 caracteres."),
    ).toBeInTheDocument();
  });

  it("submits a valid person with contact and notes successfully", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: "person-1",
        name: "María López",
        contact: "5512345678",
        notes: "Compañera de departamento",
        isActive: true,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<PersonForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Nombre completo o alias"), "María López");
    await user.type(screen.getByLabelText("Contacto (opcional)"), "5512345678");
    await user.type(screen.getByLabelText("Notas (opcional)"), "Compañera de departamento");
    await user.click(screen.getByRole("button", { name: "Registrar persona" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/people",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: "person-1", name: "María López" }),
    );
  });

  it("displays server error message when request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "No se pudo registrar a la persona." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<PersonForm />);

    await user.type(screen.getByLabelText("Nombre completo o alias"), "Carlos Ruiz");
    await user.click(screen.getByRole("button", { name: "Registrar persona" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo registrar a la persona.");
  });
});
