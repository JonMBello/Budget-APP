import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { Navigation } from "./navigation";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/incomes"),
}));

vi.mock("next/navigation", () => ({
  usePathname,
  useSearchParams: () => new URLSearchParams("period=2026-09"),
}));

beforeEach(() => {
  usePathname.mockReturnValue("/incomes");
});

it("keeps the selected month and announces the active section", () => {
  render(<Navigation />);
  expect(screen.getByRole("link", { name: "Ingresos" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Gastos" })).toHaveAttribute("href", "/expenses?period=2026-09");
  expect(screen.getAllByRole("navigation")).toHaveLength(1);
});

it("opens Más on Perfil y sesión and keeps the month", () => {
  render(<Navigation />);
  expect(screen.getByRole("link", { name: "Más" })).toHaveAttribute("href", "/settings/profile?period=2026-09");
});

it("keeps Más marked while visiting a destination of that section", () => {
  usePathname.mockReturnValue("/cards");
  render(<Navigation />);
  expect(screen.getByRole("link", { name: "Más" })).toHaveAttribute("aria-current", "true");
});
