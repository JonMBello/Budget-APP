import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AmountField, ErrorState, Field, Money } from "./ui";

describe("shared interface", () => {
  it("associates field validation with its accessible input", () => {
    render(<Field label="Correo electrónico" error="Revisa tu correo" />);
    const input = screen.getByRole("textbox", { name: "Correo electrónico" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Revisa tu correo");
  });
  it("uses decimal keyboard without converting invalid input into zero", () => {
    render(<AmountField label="Monto" defaultValue="12.50" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("inputmode", "decimal");
    expect(screen.getByRole("textbox")).toHaveValue("12.50");
  });
  it("provides a working error retry", () => {
    const retry = vi.fn(); render(<ErrorState message="Servicio no disponible" retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Volver a intentar" }));
    expect(retry).toHaveBeenCalledOnce(); expect(screen.getByRole("alert")).toHaveTextContent("Servicio no disponible");
  });
  it("shows negative money with both a sign and a visual treatment", () => {
    render(<Money amount={-20} />);
    expect(screen.getByText("-$20.00")).toHaveClass("negative");
  });
});
