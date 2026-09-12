import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PayrollSurplus } from "./contracts";
import { PayrollSurplusWidget } from "./payroll-surplus-widget";

describe("PayrollSurplusWidget (HU-FE-08.2)", () => {
  it("renders empty state notice when no payroll income is registered", () => {
    render(<PayrollSurplusWidget payrollSurplus={null} />);

    expect(screen.getByTestId("payroll-surplus-empty")).toBeInTheDocument();
    expect(
      screen.getByText(/No hay ingresos por nómina registrados en este periodo/),
    ).toBeInTheDocument();
  });

  it("renders fijos 6100, inicial 18900, restante 15900 and disclaimers for certified test case", () => {
    // Scenario: Nómina 25000, servicios 1500, suscripciones 600, MSI 4000, regulares 3000
    const surplus: PayrollSurplus = {
      totalPayrollIncome: 25000,
      fixedCommitments: 6100,
      services: 1500,
      subscriptions: 600,
      msi: 4000,
      initialDiscretionaryPayrollSurplus: 18900,
      regularExpenses: 3000,
      remainingDiscretionaryPayrollSurplus: 15900,
    };

    render(<PayrollSurplusWidget payrollSurplus={surplus} />);

    expect(screen.getByTestId("payroll-surplus-widget")).toBeInTheDocument();

    expect(screen.getByTestId("payroll-total-amount")).toHaveTextContent("$25,000.00");
    expect(screen.getByTestId("payroll-fixed-amount")).toHaveTextContent("$6,100.00");
    expect(screen.getByTestId("payroll-initial-surplus")).toHaveTextContent("$18,900.00");
    expect(screen.getByTestId("payroll-regular-amount")).toHaveTextContent("$3,000.00");
    expect(
      screen.getByTestId("remaining-payroll-surplus-amount"),
    ).toHaveTextContent("$15,900.00");

    // Breakdown components
    expect(screen.getByText(/Servicios:/)).toHaveTextContent("Servicios: $1,500.00");
    expect(screen.getByText(/Suscripciones:/)).toHaveTextContent("Suscripciones: $600.00");
    expect(screen.getByText(/MSI:/)).toHaveTextContent("MSI: $4,000.00");

    // Mandatory contractual disclaimers
    expect(
      screen.getByText(/La fórmula considera toda la nómina presupuestada para el mes/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Categorías de consumo diario o variable \(como Alimentos, Transporte o Salud\) no reducen este remanente/),
    ).toBeInTheDocument();
  });

  it("highlights remaining surplus with negative class when remaining is less than zero", () => {
    const surplus: PayrollSurplus = {
      totalPayrollIncome: 10000,
      fixedCommitments: 8000,
      services: 3000,
      subscriptions: 1000,
      msi: 4000,
      initialDiscretionaryPayrollSurplus: 2000,
      regularExpenses: 3500,
      remainingDiscretionaryPayrollSurplus: -1500,
    };

    render(<PayrollSurplusWidget payrollSurplus={surplus} />);

    const remainingEl = screen.getByTestId("remaining-payroll-surplus-amount");
    expect(remainingEl).toHaveTextContent("-$1,500.00");
    expect(remainingEl).toHaveClass("negative");
  });
});
