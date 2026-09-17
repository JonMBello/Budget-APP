import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PersonDetail } from "./person-detail";
import type { Person } from "./contracts";

const personFixture: Person = {
  id: "person-detail-1",
  name: "Valeria Ortiz",
  email: "valeria@example.test",
  notes: "Roomie",
  isActive: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PersonDetail", () => {
  it("renders person detail and debt summary view", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          totalDebt: 0,
          immediateDueAmount: 0,
          periods: [],
          msiInstallments: [],
          recurringServices: [],
          singleExpenses: [],
        }),
      }),
    );

    render(<PersonDetail initialPerson={personFixture} />);
    expect(screen.getAllByText("Valeria Ortiz")[0]).toBeInTheDocument();
    expect(screen.getByText("Cuentas por cobrar")).toBeInTheDocument();
  });

  it("toggles edit form", async () => {
    const user = userEvent.setup();
    render(<PersonDetail initialPerson={personFixture} />);

    expect(screen.queryByLabelText("Nombre completo o alias")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editar información" }));
    expect(screen.getByLabelText("Nombre completo o alias")).toBeInTheDocument();
  });

  it("archives person upon confirmation", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/debts")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            totalDebt: 0,
            immediateDueAmount: 0,
            periods: [],
            msiInstallments: [],
            recurringServices: [],
            singleExpenses: [],
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ...personFixture, isActive: false }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<PersonDetail initialPerson={personFixture} />);

    await user.click(screen.getByRole("button", { name: "Archivar persona" }));
    expect(screen.getByText("¿Archivar esta persona?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/app/bff/people/person-detail-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(await screen.findByText("Archivada")).toBeInTheDocument();
  });
});
