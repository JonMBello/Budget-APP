"use client";

import { Money } from "@/components/ui";
import type { PayrollSurplus } from "./contracts";

export function PayrollSurplusWidget({
  payrollSurplus,
}: {
  payrollSurplus?: PayrollSurplus | null;
}) {
  if (!payrollSurplus || payrollSurplus.totalPayrollIncome <= 0) {
    return (
      <div className="payroll-surplus-card" data-testid="payroll-surplus-empty">
        <div className="payroll-header">
          <div>
            <h2 className="payroll-title">Remanente de Nómina</h2>
            <p className="payroll-subtitle">
              Margen de sueldo libre tras cubrir servicios, suscripciones y cuotas MSI.
            </p>
          </div>
        </div>
        <p className="payroll-notice-empty">
          No hay ingresos por nómina registrados en este periodo para calcular el remanente.
        </p>
      </div>
    );
  }

  const {
    totalPayrollIncome,
    fixedCommitments,
    services,
    subscriptions,
    msi,
    initialDiscretionaryPayrollSurplus,
    regularExpenses,
    remainingDiscretionaryPayrollSurplus,
  } = payrollSurplus;

  const fixedPercentage = Math.min(
    100,
    Math.round((fixedCommitments / totalPayrollIncome) * 100),
  );
  const regularPercentage = Math.min(
    100,
    Math.round((regularExpenses / totalPayrollIncome) * 100),
  );
  const remainingPercentage = Math.max(
    0,
    100 - fixedPercentage - regularPercentage,
  );

  const isRemainingNegative = remainingDiscretionaryPayrollSurplus < 0;

  return (
    <div className="payroll-surplus-card" data-testid="payroll-surplus-widget">
      <div className="payroll-header">
        <div>
          <h2 className="payroll-title">Remanente de Nómina</h2>
          <p className="payroll-subtitle">
            Margen de tu sueldo libre tras cubrir compromisos fijos y compras regulares.
          </p>
        </div>
        <div className="payroll-main-badge">
          <span className="label">Remanente restante:</span>
          <span
            className={`amount ${isRemainingNegative ? "negative" : "green"}`}
            data-testid="remaining-payroll-surplus-amount"
          >
            <Money amount={remainingDiscretionaryPayrollSurplus} />
          </span>
        </div>
      </div>

      {/* Visual distribution bar */}
      <div className="payroll-bar-wrap" title="Distribución de la nómina">
        <div
          className="payroll-bar-segment fixed"
          style={{ width: `${fixedPercentage}%` }}
          aria-label={`Compromisos fijos: ${fixedPercentage}%`}
        />
        <div
          className="payroll-bar-segment regular"
          style={{ width: `${regularPercentage}%` }}
          aria-label={`Compras regulares: ${regularPercentage}%`}
        />
        <div
          className="payroll-bar-segment remaining"
          style={{ width: `${remainingPercentage}%` }}
          aria-label={`Remanente libre: ${remainingPercentage}%`}
        />
      </div>

      <div className="payroll-legend">
        <div className="legend-item">
          <span className="legend-bullet fixed" />
          <span>Fijos: {fixedPercentage}%</span>
        </div>
        <div className="legend-item">
          <span className="legend-bullet regular" />
          <span>Regulares: {regularPercentage}%</span>
        </div>
        <div className="legend-item">
          <span className="legend-bullet remaining" />
          <span>Libre: {remainingPercentage}%</span>
        </div>
      </div>

      {/* Step by step numeric breakdown */}
      <div className="payroll-breakdown-grid">
        <div className="breakdown-step-box">
          <span className="step-tag">Paso 1</span>
          <p className="step-title">Nómina total prevista</p>
          <p className="step-amount green" data-testid="payroll-total-amount">
            <Money amount={totalPayrollIncome} />
          </p>
          <span className="step-sub">Ingresos con fuente Nómina</span>
        </div>

        <div className="breakdown-step-box">
          <span className="step-tag">Paso 2</span>
          <p className="step-title">Compromisos fijos</p>
          <p className="step-amount red" data-testid="payroll-fixed-amount">
            <Money amount={fixedCommitments} />
          </p>
          <div className="mini-breakdown">
            <span>Servicios: <Money amount={services} /></span>
            <span>Suscripciones: <Money amount={subscriptions} /></span>
            <span>MSI: <Money amount={msi} /></span>
          </div>
        </div>

        <div className="breakdown-step-box">
          <span className="step-tag">Paso 3</span>
          <p className="step-title">Remanente inicial</p>
          <p className="step-amount blue" data-testid="payroll-initial-surplus">
            <Money amount={initialDiscretionaryPayrollSurplus} />
          </p>
          <span className="step-sub">Nómina − Compromisos fijos</span>
        </div>

        <div className="breakdown-step-box">
          <span className="step-tag">Paso 4</span>
          <p className="step-title">Compras regulares</p>
          <p className="step-amount" data-testid="payroll-regular-amount">
            <Money amount={regularExpenses} />
          </p>
          <span className="step-sub">Gastos con categoría Regular</span>
        </div>
      </div>

      {/* Contractual and regulatory disclaimers */}
      <div className="payroll-disclaimers">
        <p className="disclaimer-text">
          ℹ️ <strong>Nómina total prevista:</strong> La fórmula considera toda la nómina presupuestada para el mes, no únicamente la cobrada a la fecha. No representa saldo líquido bancario garantizado.
        </p>
        <p className="disclaimer-text">
          ℹ️ <strong>Alcance de categorías:</strong> Categorías de consumo diario o variable (como Alimentos, Transporte o Salud) no reducen este remanente de nómina fija; su impacto se refleja directamente en el Balance general proyectado.
        </p>
      </div>
    </div>
  );
}
