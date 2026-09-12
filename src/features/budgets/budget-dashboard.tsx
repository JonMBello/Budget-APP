"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { formatMonth, periodHref } from "@/lib/format";
import type { Card } from "@/features/cards/contracts";
import { CashflowAgenda } from "@/features/metrics/cashflow-agenda";
import { CashflowBalanceCards } from "@/features/metrics/cashflow-balance-cards";
import {
  buildCashflowAgenda,
  calculatePayrollSurplus,
  calculateReceivables,
} from "@/features/metrics/contracts";
import { PayrollSurplusWidget } from "@/features/metrics/payroll-surplus-widget";
import { useReactiveSummary } from "@/features/metrics/use-reactive-summary";
import type { Person } from "@/features/people/contracts";
import type { Expense, Income } from "@/features/transactions/contracts";
import { CarriedSavingsEditor } from "./carried-savings-editor";
import {
  toPeriodKey,
  type BudgetPeriod,
  type BudgetStatus,
  type BudgetSummary,
} from "./contracts";
import { InitializeMonthWizard } from "./initialize-month-wizard";
import { PeriodClosedBanner } from "./period-closed-banner";
import { PeriodSelector } from "./period-selector";
import { PeriodStatusBadge } from "./period-status-badge";
import { PeriodStatusControl } from "./period-status-control";

export function BudgetDashboard({
  userName,
  initialPeriod,
  allPeriods,
  initialSummary = null,
  initialExpenses = [],
  initialIncomes = [],
  initialCards = [],
  initialPeople = [],
}: {
  userName: string;
  initialPeriod: BudgetPeriod | null;
  allPeriods: BudgetPeriod[];
  initialSummary?: BudgetSummary | null;
  initialExpenses?: Expense[];
  initialIncomes?: Income[];
  initialCards?: Card[];
  initialPeople?: Person[];
}) {
  const [period, setPeriod] = useState<BudgetPeriod | null>(initialPeriod);
  const [periods, setPeriods] = useState<BudgetPeriod[]>(allPeriods);
  const [showWizard, setShowWizard] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [incomes, setIncomes] = useState<Income[]>(initialIncomes);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [people, setPeople] = useState<Person[]>(initialPeople);

  // Fallback summary when initialSummary is null
  const fallbackSummary: BudgetSummary = useMemo(() => {
    if (initialSummary) return initialSummary;
    if (!period) {
      return {
        year: 2026,
        month: 1,
        status: "OPEN",
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        carriedSavings: 0,

        cashInPocketBalance: 0,
      };
    }
    const net = period.totalIncome - period.totalExpenses;
    return {
      periodId: period.id,
      year: period.year,
      month: period.month,
      status: period.status,
      totalIncome: period.totalIncome,
      totalExpenses: period.totalExpenses,
      netBalance: period.carriedSavings + net,
      carriedSavings: period.carriedSavings,

      cashInPocketBalance: period.carriedSavings + net,
      totalExpectedIncome: period.totalIncome,
      totalReceivedIncome: period.totalIncome,
      totalCommittedExpenses: period.totalExpenses,
      totalPaidExpenses: period.totalExpenses,
      hasPendingTransactions: false,
    };
  }, [initialSummary, period]);

  const { summary, isUpdating, staleNotice, notifyMutation } = useReactiveSummary({
    year: period?.year ?? 2026,
    month: period?.month ?? 1,
    initialSummary: fallbackSummary,
  });

  // Re-fetch transactions, cards, people when period changes
  useEffect(() => {
    if (!period) return;
    let cancelled = false;

    async function loadPeriodData() {
      try {
        const [expData, incData, cardData, peopleData] = await Promise.all([
          clientRequest<Expense[]>(`/expenses?periodId=${period!.id}`).catch(() => []),
          clientRequest<Income[]>(`/incomes?periodId=${period!.id}`).catch(() => []),
          clientRequest<Card[]>("/cards").catch(() => []),
          clientRequest<Person[]>("/people").catch(() => []),
        ]);

        if (!cancelled) {
          setExpenses(expData);
          setIncomes(incData);
          if (cardData.length > 0) setCards(cardData);
          if (peopleData.length > 0) setPeople(peopleData);
        }
      } catch {
        // Silently retain current data
      }
    }

    loadPeriodData();
    return () => {
      cancelled = true;
    };
  }, [period]);

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
  const isClosed = period.status === "CLOSED";

  function handleStatusChange(newStatus: BudgetStatus) {
    if (!period) return;
    const updated = { ...period, status: newStatus };
    setPeriod(updated);
    setPeriods((prev) =>
      prev.map((p) => (toPeriodKey(p.year, p.month) === periodKey ? updated : p)),
    );
    notifyMutation();
  }

  function handleSavingsSaved(updated: BudgetPeriod) {
    setPeriod(updated);
    setPeriods((prev) =>
      prev.map((p) => (toPeriodKey(p.year, p.month) === periodKey ? updated : p)),
    );
    notifyMutation();
  }

  function handlePeriodCreated(newPeriod: BudgetPeriod) {
    setPeriod(newPeriod);
    setPeriods((prev) => [newPeriod, ...prev]);
    notifyMutation();
  }

  // Toggle paid action for expense in agenda
  async function handleTogglePaidExpense(expenseId: string) {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense || isClosed) return;
    try {
      const updated = await clientRequest<Expense>(`/expenses/${expenseId}`, {
        method: "PATCH",
        body: { isPaid: !expense.isPaid },
      });
      setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      notifyMutation();
    } catch {
      // Error handled by clientRequest toast / exception
    }
  }

  // Toggle received action for income in agenda
  async function handleToggleReceivedIncome(incomeId: string) {
    const income = incomes.find((i) => i.id === incomeId);
    if (!income || isClosed) return;
    try {
      const updated = await clientRequest<Income>(`/incomes/${incomeId}`, {
        method: "PATCH",
        body: { isReceived: !income.isReceived },
      });
      setIncomes((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      notifyMutation();
    } catch {
      // Error handled by clientRequest
    }
  }

  // Calculate or use backend metrics
  const payrollSurplus =
    summary.payrollSurplus ?? calculatePayrollSurplus(incomes, expenses);

  const receivables =
    summary.receivables ?? calculateReceivables(incomes, people);

  const agenda = buildCashflowAgenda(expenses, incomes, people, cards);

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
            {isUpdating && (
              <span className="updating-pill" data-testid="updating-indicator">
                Actualizando…
              </span>
            )}
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

      {staleNotice && (
        <div className="stale-alert" role="alert" data-testid="stale-notice">
          ⚠️ {staleNotice}
        </div>
      )}

      {/* Balance Proyectado & Efectivo según registros + Ahorro Acarreado */}
      <section className="dashboard-section" aria-label="Métricas de balance">
        <CashflowBalanceCards summary={summary} />
        <div style={{ marginTop: "16px" }}>
          <CarriedSavingsEditor
            period={{ ...period, carriedSavings: summary.carriedSavings }}
            onSaved={handleSavingsSaved}
            disabled={isClosed}
          />
        </div>
      </section>

      {/* Remanente de nómina */}
      <section className="dashboard-section" aria-label="Remanente de nómina">
        <PayrollSurplusWidget payrollSurplus={payrollSurplus} />
      </section>

      {/* Agenda de pagos y cobros */}
      <section className="dashboard-section" aria-label="Agenda de flujo de caja">
        <CashflowAgenda
          agenda={agenda}
          receivables={receivables}
          cards={cards}
          people={people}
          onTogglePaidExpense={handleTogglePaidExpense}
          onToggleReceivedIncome={handleToggleReceivedIncome}
          isMutating={isClosed}
        />
      </section>

      {/* Navegación rápida */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "36px",
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
