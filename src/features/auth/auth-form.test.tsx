import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AuthForm } from "./auth-form";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
afterEach(() => vi.unstubAllGlobals());
it("validates locally and preserves entries on a rejected login", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: "Revisa tu correo y contraseña." }) });
  vi.stubGlobal("fetch", fetchMock); const user = userEvent.setup(); render(<AuthForm />);
  await user.click(screen.getByRole("button", { name: "Entrar a mi presupuesto" })); expect(fetchMock).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("Correo electrónico"), "test@example.test"); await user.type(screen.getByLabelText("Contraseña"), "wrong-password");
  await user.click(screen.getByRole("button", { name: "Entrar a mi presupuesto" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Revisa tu correo y contraseña.");
  expect(screen.getByLabelText("Correo electrónico")).toHaveValue("test@example.test");
  expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");
});
it("hides unavailable registration and supports password managers", () => {
  render(<AuthForm />); expect(screen.queryByRole("link", { name: "Crear cuenta" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Contraseña")).toHaveAttribute("autocomplete", "current-password");
});
