import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PersonList } from "./person-list";
import type { Person } from "./contracts";

const peopleFixture: Person[] = [
  {
    id: "p-1",
    name: "Ana Morales",
    contact: "anam@example.test",
    notes: "Colega",
    isActive: true,
  },
  {
    id: "p-2",
    name: "Roberto Silva",
    contact: "5599887766",
    notes: "Gimnasio",
    isActive: true,
  },
  {
    id: "p-3",
    name: "Inactivo Pasado",
    contact: "antiguo@example.test",
    isActive: false,
  },
];

describe("PersonList", () => {
  it("renders active persons by default and switches to all with tab", async () => {
    const user = userEvent.setup();
    render(<PersonList initialPeople={peopleFixture} />);

    expect(screen.getByText("Ana Morales")).toBeInTheDocument();
    expect(screen.getByText("Roberto Silva")).toBeInTheDocument();
    expect(screen.queryByText("Inactivo Pasado")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Todas (3)" }));

    expect(screen.getByText("Inactivo Pasado")).toBeInTheDocument();
  });

  it("filters persons in real time by name and contact", async () => {
    const user = userEvent.setup();
    render(<PersonList initialPeople={peopleFixture} />);

    const searchInput = screen.getByLabelText("Buscar persona");
    await user.type(searchInput, "Ana");

    expect(screen.getByText("Ana Morales")).toBeInTheDocument();
    expect(screen.queryByText("Roberto Silva")).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, "559988");

    expect(screen.queryByText("Ana Morales")).not.toBeInTheDocument();
    expect(screen.getByText("Roberto Silva")).toBeInTheDocument();
  });

  it("toggles person registration form", async () => {
    const user = userEvent.setup();
    render(<PersonList initialPeople={peopleFixture} />);

    expect(screen.queryByLabelText("Nombre completo o alias")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ Agregar persona" }));
    expect(screen.getByLabelText("Nombre completo o alias")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByLabelText("Nombre completo o alias")).not.toBeInTheDocument();
  });
});
