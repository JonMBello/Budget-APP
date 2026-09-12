import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { MoreNav } from "./more-nav";

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

it("stays hidden on primary sections", () => {
  render(<MoreNav />);
  expect(screen.queryByRole("navigation", { name: "Más opciones" })).not.toBeInTheDocument();
});

it("stays visible on a Más destination and marks the current option", () => {
  usePathname.mockReturnValue("/cards");
  render(<MoreNav />);

  const links = screen.getAllByRole("link");
  expect(links[0]).toHaveAccessibleName("Perfil y sesión");
  expect(screen.getByRole("navigation", { name: "Más opciones" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Tarjetas y cuentas" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Tarjetas y cuentas" })).toHaveAttribute("href", "/cards?period=2026-09");
  expect(screen.getByRole("link", { name: "Directorio de personas" })).not.toHaveAttribute("aria-current");
});

it("selects Perfil y sesión as the default Más destination", () => {
  usePathname.mockReturnValue("/settings/profile");
  render(<MoreNav />);

  expect(screen.getByRole("link", { name: "Perfil y sesión" })).toHaveAttribute("aria-current", "page");
});

it("keeps the submenu on a detail page of the same section", () => {
  usePathname.mockReturnValue("/people/person-1");
  render(<MoreNav />);

  expect(screen.getByRole("link", { name: "Directorio de personas" })).toHaveAttribute("aria-current", "page");
});
