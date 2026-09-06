import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Navigation } from "./navigation";
vi.mock("next/navigation", () => ({ usePathname: () => "/incomes", useSearchParams: () => new URLSearchParams("period=2026-09") }));
it("keeps the selected month and announces the active section", () => {
  render(<Navigation />);
  expect(screen.getByRole("link", { name: "Ingresos" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Gastos" })).toHaveAttribute("href", "/expenses?period=2026-09");
  expect(screen.getAllByRole("navigation")).toHaveLength(1);
});
