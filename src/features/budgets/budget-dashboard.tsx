"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState, Money } from "@/components/ui";
import { formatMonth, periodHref } from "@/lib/format";
import { CarriedSavingsEditor } from "./carried-savings-editor";
import { InitializeMonthWizard } from "./initialize-month-wizard";
import { PeriodClosedBanner } from "./period-closed-banner";
import { PeriodSelector } from "./period-selector";
import { PeriodStatusBadge } from "./period-status-badge";
import { PeriodStatusControl } from "./period-status-control";
import { toPeriodKey, type BudgetPeriod, type BudgetStatus } from "./contracts";

export function BudgetDashboard({
  userName,
  initialPeriod,
  allPeriods,
}: {
  userName: string;
  initialPeriod: BudgetPeriod | null;
  allPeriods: BudgetPeriod[];
}) {
  const [period, setPeriod] = useState<BudgetPeriod | null>(initialPeriod);
  const [periods, setPeriods] = useState<BudgetPeriod[]>(allPeriods);
  const [showWizard, setShowWizard] = useState(false);

  if (!period) {
    return (
      <div className="page-container">
        <p className="eyebrow">TU ESPACIO PERSONAL</p>
        <h1>Hola, {userName}.</h1>
        <EmptyState
          title="Crear primer mes"
          action={
            <button
              type="button"
              className="button"
              onClick={() => setShowWizard(true)}
            >
              Abrir mi primer periodo
            </button>
          }
        >
          No tienes ningún periodo presupuestario activo. Comienza abriendo tu
          primer mes para registrar tus ingresos, gastos y metas de ahorro.
        </EmptyState>

        {showWizard && (
          <InitializeMonthWizard
            onCancel={() => setShowWizard(false)}
            onCreated={(newPeriod) => {
              setPeriod(newPeriod);
              setPeriods([newPeriod]);
              setShowWizard(false);
            }}
          />
        )}
      </div>
    );
  }

  const periodKey = toPeriodKey(period.year, period.month);
  const net = period.totalIncome - period.totalExpenses;
  const isClosed = period.status === "CLOSED";

  function handleStatusChange(newStatus: BudgetStatus) {
    if (!period) return;
    const updated = { ...period, status: newStatus };
    setPeriod(updated);
    setPeriods((prev) =>
      prev.map((p) => (toPeriodKey(p.year, p.month) === periodKey ? updated : p)),
    );
  }

  function handleSavingsSaved(updated: BudgetPeriod) {
    setPeriod(updated);
    setPeriods((prev) =>
      prev.map((p) => (toPeriodKey(p.year, p.month) === periodKey ? updated : p)),
    );
  }

  function handlePeriodCreated(newPeriod: BudgetPeriod) {
    setPeriod(newPeriod);
    setPeriods((prev) => [newPeriod, ...prev]);
  }

  return (
    <div className="page-container">
      <div className="period-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: "6px" }}>
            PRESUPUESTO MENSUAL
          </p>
          <div className="period-title-group">
            <h1 style={{ margin: 0 }}>{formatMonth(periodKey)}</h1>
            <PeriodStatusBadge status={period.status} />
          </div>
        </div>

        <div className="period-actions">
          <PeriodSelector
            periods={periods}
            currentPeriod={period}
            onPeriodCreated={handlePeriodCreated}
          />
          <PeriodStatusControl
            period={period}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      {isClosed && <PeriodClosedBanner />}

      <div className="period-metrics">
        <div className="metric-card">
          <p className="label">Ingresos registrados</p>
          <p className="amount green">
            <Money amount={period.totalIncome} />
          </p>
        </div>

        <div className="metric-card">
          <p className="label">Gastos registrados</p>
          <p className="amount">
            <Money amount={period.totalExpenses} />
          </p>
        </div>

        <div className="metric-card">
          <p className="label">Balance neto</p>
          <p className={`amount ${net < 0 ? "negative" : "blue"}`}>
            <Money amount={net} />
          </p>
        </div>

        <CarriedSavingsEditor
          period={period}
          onSaved={handleSavingsSaved}
          disabled={isClosed}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "32px",
        }}
      >
        <Link
          className="button secondary"
          href={periodHref("/incomes", periodKey)}
        >
          Ver ingresos del mes
        </Link>
        <Link
          className="button secondary"
          href={periodHref("/expenses", periodKey)}
        >
          Ver gastos del mes
        </Link>
        <Link className="button secondary" href="/budgets">
          Historial completo de meses
        </Link>
      </div>
    </div>
  );
}
