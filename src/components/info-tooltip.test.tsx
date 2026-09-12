import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { InfoTooltip } from "./info-tooltip";

it("shows help on hover and hides it on pointer exit", async () => {
  const user = userEvent.setup();
  render(<InfoTooltip label="Nómina">Detalle del cálculo</InfoTooltip>);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  const button = screen.getByRole("button", { name: "Información sobre Nómina" });
  await user.hover(button);
  expect(screen.getByRole("tooltip")).toBeVisible();
  await user.unhover(button);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});

it("supports keyboard focus, Escape and clicking outside", async () => {
  const user = userEvent.setup();
  render(<InfoTooltip label="Nómina">Detalle del cálculo</InfoTooltip>);
  await user.tab();
  expect(screen.getByRole("tooltip")).toBeVisible();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button"));
  expect(screen.getByRole("tooltip")).toBeVisible();
  await user.click(document.body);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});
