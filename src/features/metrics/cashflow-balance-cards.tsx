"use client";

import { Money } from "@/components/ui";
import type { BudgetSummary } from "@/features/budgets/contracts";

export function CashflowBalanceCards({
  summary,
}: {
  summary: BudgetSummary;
}) {
  const projectedSavings =
    summary.projectedSavings ??
    summary.carriedSavings + summary.totalIncome - summary.totalExpenses;

  const totalExpectedIncome =
    summary.totalExpectedIncome ?? summary.totalIncome;
  const totalReceivedIncome = summary.totalReceivedIncome ?? 0;
  const totalCommittedExpenses =
    summary.totalCommittedExpenses ?? summary.totalExpenses;
  const totalPaidExpenses = summary.totalPaidExpenses ?? 0;

  const cashInPocket =
    summary.cashInPocketBalance ??
    summary.carriedSavings + totalReceivedIncome - totalPaidExpenses;

  const isProjectedNegative = projectedSavings < 0;
  const isCashNegative = cashInPocket < 0;

  return (
    <div className="balance-cards-container" data-testid="cashflow-balance-cards">
      {/* Card 1: Balance proyectado */}
      <div className={`metric-card balance-card ${isProjectedNegative ? "border-negative" : ""}`}>
        <div className="balance-card-header">
          <div>
            <p className="label">Balance proyectado</p>
            <p
              className={`amount ${isProjectedNegative ? "negative" : "blue"}`}
              data-testid="projected-savings-amount"
            >
              <Money amount={projectedSavings} />
            </p>
          </div>
          <span className="badge-subtle">Fin de mes</span>
        </div>

        <p className="balance-card-desc">
          Saldo estimado al finalizar el periodo si se cumplen todos los ingresos y gastos proyectados.
        </p>

        <div className="balance-breakdown">
          <div className="breakdown-row">
            <span className="breakdown-label">Ahorro inicial acarreado:</span>
            <span className="breakdown-value">
              <Money amount={summary.carriedSavings} />
            </span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">(+) Ingresos previstos:</span>
            <span className="breakdown-value green">
              <Money amount={totalExpectedIncome} />
            </span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">(-) Gastos comprometidos:</span>
            <span className="breakdown-value">
              <Money amount={totalCommittedExpenses} />
            </span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">Balance neto del periodo:</span>
            <span
              className={`breakdown-value ${
                totalExpectedIncome - totalCommittedExpenses < 0
                  ? "negative"
                  : "blue"
              }`}
            >
              <Money amount={totalExpectedIncome - totalCommittedExpenses} />
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Efectivo según registros */}
      <div className={`metric-card balance-card ${isCashNegative ? "border-negative" : ""}`}>
        <div className="balance-card-header">
          <div>
            <p className="label">Efectivo según registros</p>
            <p
              className={`amount ${isCashNegative ? "negative" : "green"}`}
              data-testid="cash-in-pocket-amount"
            >
              <Money amount={cashInPocket} />
            </p>
          </div>
          <span className="badge-subtle">A la fecha</span>
        </div>

        <p className="balance-card-desc">
          Liquidez calculada con base en los ingresos efectivamente cobrados y gastos pagados.
        </p>

        <div className="balance-breakdown">
          <div className="breakdown-row">
            <span className="breakdown-label">Ahorro inicial acarreado:</span>
            <span className="breakdown-value">
              <Money amount={summary.carriedSavings} />
            </span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">(+) Ingresos cobrados:</span>
            <span className="breakdown-value green">
              <Money amount={totalReceivedIncome} />
            </span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">(-) Gastos pagados:</span>
            <span className="breakdown-value">
              <Money amount={totalPaidExpenses} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
