import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransactionCardActions } from "./transaction-actions";

describe("TransactionCardActions", () => {
  it("shows status text and icon-only edit and delete actions", async () => {
    const user = userEvent.setup();
    const onToggleStatus = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <TransactionCardActions
        statusComplete={false}
        markCompleteLabel="Marcar como pagado"
        markPendingLabel="Marcar como pendiente"
        onToggleStatus={onToggleStatus}
        onEdit={onEdit}
        onDelete={onDelete}
        deleteAriaLabel="Eliminar gasto Cena"
      />,
    );

    expect(screen.getByText("Marcar como pagado")).toBeInTheDocument();
    expect(screen.queryByText("Editar")).not.toBeInTheDocument();
    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Marcar como pagado" }));
    expect(onToggleStatus).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(onEdit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Eliminar gasto Cena" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("uses undo label when the movement is already complete", () => {
    render(
      <TransactionCardActions
        statusComplete
        markCompleteLabel="Marcar como cobrado"
        markPendingLabel="Marcar como pendiente"
        onToggleStatus={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Marcar como pendiente" })).toBeInTheDocument();
    expect(screen.getByText("Marcar como pendiente")).toBeInTheDocument();
  });
});
