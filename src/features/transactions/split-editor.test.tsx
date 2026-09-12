import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SplitEditor } from "./split-editor";
import { type Person } from "@/features/people/contracts";

const mockPeople: Person[] = [
  { id: "p-1", name: "Carlos Mendoza", isActive: true },
  { id: "p-2", name: "Laura Sánchez", isActive: true },
];

describe("SplitEditor", () => {
  it("renders disabled state and empty notice when toggle is unchecked", () => {
    const onChange = vi.fn();
    render(
      <SplitEditor
        amount={1000}
        split={null}
        people={mockPeople}
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /dividir este gasto con otra persona/i,
    });
    expect(checkbox).not.toBeChecked();
    expect(screen.queryByLabelText(/persona que debe su parte/i)).not.toBeInTheDocument();
  });

  it("enables split and calculates live breakdown for percentage", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SplitEditor
        amount={1000}
        split={null}
        people={mockPeople}
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /dividir este gasto con otra persona/i,
    });
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        personId: "p-1",
        splitType: "PERCENTAGE",
        splitValue: 50,
      }),
    );

    expect(screen.getByText("Tu parte real:")).toBeInTheDocument();
    expect(screen.getAllByText("$500.00")).toHaveLength(2);
  });

  it("handles fixed amount split and validates limit", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SplitEditor
        amount={800}
        split={{
          personId: "p-2",
          splitType: "FIXED",
          splitValue: 300,
          isDebtActive: true,
        }}
        people={mockPeople}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Parte de Laura Sánchez:")).toBeInTheDocument();
    expect(screen.getByText("$300.00")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();

    const valueInput = screen.getByLabelText("Monto deudor ($)");
    await user.clear(valueInput);
    await user.type(valueInput, "950");

    expect(
      screen.getByText("El monto a compartir no puede ser mayor al gasto total."),
    ).toBeInTheDocument();
  });

  it("unchecking the toggle calls onChange with null", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SplitEditor
        amount={500}
        split={{
          personId: "p-1",
          splitType: "PERCENTAGE",
          splitValue: 50,
          isDebtActive: true,
        }}
        people={mockPeople}
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /dividir este gasto con otra persona/i,
    });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
