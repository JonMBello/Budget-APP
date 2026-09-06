import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LogoutButton, ProfileForm } from "./profile-form";
import type { User } from "./contracts";

const userFixture: User = {
  id: "user-123",
  name: "Usuario Inicial",
  email: "usuario@example.test",
  currency: "MXN",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ProfileForm", () => {
  it("renders user information in read-only and editable fields", () => {
    render(<ProfileForm user={userFixture} />);
    expect(screen.getByLabelText("Nombre")).toHaveValue("Usuario Inicial");
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("usuario@example.test");
    expect(screen.getByLabelText("Correo electrónico")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Moneda")).toHaveValue("MXN");
  });

  it("submits updated profile and displays success confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...userFixture, name: "Nuevo Nombre" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ProfileForm user={userFixture} />);

    const nameInput = screen.getByLabelText("Nombre");
    await user.clear(nameInput);
    await user.type(nameInput, "Nuevo Nombre");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Nuevo Nombre", currency: "MXN" }),
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Tu perfil se guardó.");
  });

  it("displays an error state when the profile update fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: "La moneda no puede cambiar cuando ya tienes presupuestos o movimientos." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ProfileForm user={userFixture} />);

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("La moneda no puede cambiar");
  });

  it("validates field constraints before submitting", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ProfileForm user={userFixture} />);

    const nameInput = screen.getByLabelText("Nombre");
    await user.clear(nameInput);
    await user.type(nameInput, "a");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("Revisa tu nombre y moneda.");
  });
});

describe("LogoutButton", () => {
  it("calls logout BFF and replaces location on success", async () => {
    const replaceMock = vi.fn();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { replace: replaceMock, assign: vi.fn() },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
    expect(replaceMock).toHaveBeenCalledWith("/app/login");
  });

  it("displays an error state if logout network call fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network failure"));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Necesitas conexión para cerrar la sesión de este dispositivo.");
  });
});
