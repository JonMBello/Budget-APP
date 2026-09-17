"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog, EmptyState, ErrorState } from "@/components/ui";
import { formatMoney, formatMonth } from "@/lib/format";
import { clientRequest } from "@/lib/client";
import { PeriodClosedBanner } from "@/features/budgets/period-closed-banner";
import { PeriodSelector } from "@/features/budgets/period-selector";
import { PeriodStatusBadge } from "@/features/budgets/period-status-badge";
import { toPeriodKey, type BudgetPeriod } from "@/features/budgets/contracts";
import { type Card } from "@/features/cards/contracts";
import { type Person } from "@/features/people/contracts";
import {
  type Expense,
  type Income,
  calculateSplitBreakdown,
} from "./contracts";

import { ExpenseCard, EXPENSE_CATEGORY_LABELS } from "./expense-card";
import { ExpenseForm } from "./expense-form";
import { IncomeCard, INCOME_SOURCE_LABELS } from "./income-card";
import { IncomeForm } from "./income-form";
import { CopyIncomesModal } from "./copy-incomes-modal";

type TransactionsListProps =
  | {
      type: "expenses";
      period: BudgetPeriod;
      allPeriods: BudgetPeriod[];
      initialExpenses: Expense[];
      cards: Card[];
      people: Person[];
    }
  | {
      type: "incomes";
      period: BudgetPeriod;
      allPeriods: BudgetPeriod[];
      initialIncomes: Income[];
      cards?: never;
      people: Person[];
    };

export function TransactionsList(props: TransactionsListProps) {
  const { period, allPeriods, people } = props;
  const isExpenses = props.type === "expenses";
  const cards = useMemo(
    () => (props.type === "expenses" ? props.cards : []),
    [props],
  );


  const [expenses, setExpenses] = useState<Expense[]>(
    isExpenses ? props.initialExpenses : [],
  );
  const [incomes, setIncomes] = useState<Income[]>(
    !isExpenses ? props.initialIncomes : [],
  );

  const [expenseSort, setExpenseSort] = useState("createdAt-desc");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DONE" | "PENDING">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const isClosed = period.status === "CLOSED";
  const periodKey = toPeriodKey(period.year, period.month);

  // Determine previous period if available
  const previousPeriod = useMemo(() => {
    let prevYear = period.year;
    let prevMonth = period.month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const prevKey = toPeriodKey(prevYear, prevMonth);
    return allPeriods.find((p) => toPeriodKey(p.year, p.month) === prevKey) ?? null;
  }, [period, allPeriods]);

  // Lookup helpers
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c.name])), [cards]);
  const peopleMap = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);

  // Filtering for expenses
  const filteredExpenses = useMemo(() => {
    if (!isExpenses) return [];
    return expenses.filter((e) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesNotes = e.notes ? e.notes.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesNotes) return false;
      }
      if (statusFilter === "DONE" && !e.isPaid) return false;
      if (statusFilter === "PENDING" && e.isPaid) return false;
      if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
      return true;
    }).sort((a, b) => {
      const [field, direction] = expenseSort.split("-");
      const value = (expense: Expense): number | null => {
        if (field === "amount") return expense.amount;
        const date = field === "createdAt" ? expense.createdAt : expense.paymentDueDate;
        const timestamp = date ? Date.parse(date) : NaN;
        return Number.isFinite(timestamp) ? timestamp : null;
      };
      const left = value(a);
      const right = value(b);
      if (left === null) return right === null ? 0 : 1;
      if (right === null) return -1;
      return (left - right) * (direction === "asc" ? 1 : -1);
    });
  }, [isExpenses, expenses, search, statusFilter, categoryFilter, expenseSort]);

  // Filtering for incomes
  const filteredIncomes = useMemo(() => {
    if (isExpenses) return [];
    return incomes.filter((inc) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesTitle = inc.title.toLowerCase().includes(q);
        const matchesNotes = inc.notes ? inc.notes.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesNotes) return false;
      }
      if (statusFilter === "DONE" && !inc.isReceived) return false;
      if (statusFilter === "PENDING" && inc.isReceived) return false;
      if (categoryFilter !== "ALL" && inc.source !== categoryFilter) return false;
      return true;
    });
  }, [isExpenses, incomes, search, statusFilter, categoryFilter]);

  // Metrics calculation
  const metrics = useMemo(() => {
    if (isExpenses) {
      let total = 0;
      let paid = 0;
      let pending = 0;
      let shared = 0;
      for (const e of expenses) {
        total += e.amount;
        if (e.isPaid) paid += e.amount;
        else pending += e.amount;
        if (e.split) {
          const breakdown = calculateSplitBreakdown(e.amount, e.split);
          shared += breakdown.debtorShare;
        }
      }
      return { total, paid, pending, shared, received: 0, debts: 0 };
    } else {
      let total = 0;
      let received = 0;
      let pending = 0;
      let debts = 0;
      for (const inc of incomes) {
        total += inc.amount;
        if (inc.isReceived) received += inc.amount;
        else pending += inc.amount;
        if (inc.source === "DEBT_COLLECTION") debts += inc.amount;
      }
      return { total, paid: 0, pending, shared: 0, received, debts };
    }
  }, [isExpenses, expenses, incomes]);

  // Toggle paid handler for expense
  async function handleTogglePaid(expense: Expense) {
    if (isClosed || pendingActionId) return;
    setPendingActionId(expense.id);
    setActionError("");
    try {
      const updated = await clientRequest<Expense>(`/expenses/${expense.id}`, {
        method: "PATCH",
        body: { isPaid: !expense.isPaid },
      });
      setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al actualizar el estado del gasto.",
      );
    } finally {
      setPendingActionId(null);
    }
  }

  // Toggle received handler for income
  async function handleToggleReceived(income: Income) {
    if (isClosed || pendingActionId) return;
    setPendingActionId(income.id);
    setActionError("");
    try {
      const updated = await clientRequest<Income>(`/incomes/${income.id}`, {
        method: "PATCH",
        body: { isReceived: !income.isReceived },
      });
      setIncomes((prev) => prev.map((inc) => (inc.id === updated.id ? updated : inc)));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al actualizar el estado del ingreso.",
      );
    } finally {
      setPendingActionId(null);
    }
  }

  // Delete expense
  async function confirmDeleteExpense() {
    if (!deletingExpense || isClosed) return;
    setPendingActionId(deletingExpense.id);
    setActionError("");
    try {
      await clientRequest(`/expenses/${deletingExpense.id}`, {
        method: "DELETE",
      });
      setExpenses((prev) => prev.filter((e) => e.id !== deletingExpense.id));
      setDeletingExpense(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al eliminar el gasto.",
      );
    } finally {
      setPendingActionId(null);
    }
  }

  // Delete income
  async function confirmDeleteIncome() {
    if (!deletingIncome || isClosed) return;
    setPendingActionId(deletingIncome.id);
    setActionError("");
    try {
      await clientRequest(`/incomes/${deletingIncome.id}`, {
        method: "DELETE",
      });
      setIncomes((prev) => prev.filter((inc) => inc.id !== deletingIncome.id));
      setDeletingIncome(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al eliminar el ingreso.",
      );
    } finally {
      setPendingActionId(null);
    }
  }

  return (
    <div className="page-container">
      <div className="period-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: "6px" }}>
            {isExpenses ? "EGRESOS DEL MES" : "INGRESOS DEL MES"}
          </p>
          <div className="period-title-group">
            <h1 style={{ margin: 0 }}>
              {isExpenses ? "Gastos" : "Ingresos"} — {formatMonth(periodKey)}
            </h1>
            <PeriodStatusBadge status={period.status} />
          </div>
        </div>

        <div className="period-actions">
          <PeriodSelector periods={allPeriods} currentPeriod={period} />
        </div>
      </div>

      {isClosed && <PeriodClosedBanner />}

      {actionError && <ErrorState message={actionError} />}

      {/* Metrics summary bar */}
      <div className="totals-summary-bar">
        <div className="metric-card">
          <p className="label">Total {isExpenses ? "gastos" : "ingresos"}</p>
          <p className={`amount ${isExpenses ? "negative" : "green"}`}>
            {formatMoney(metrics.total)}
          </p>
        </div>

        <div className="metric-card">
          <p className="label">
            {isExpenses ? "Pagado al banco" : "Cobrado / En cuenta"}
          </p>
          <p className="amount green">
            {formatMoney(isExpenses ? metrics.paid : metrics.received)}
          </p>
        </div>

        <div className="metric-card">
          <p className="label">
            {isExpenses ? "Pendiente de pago" : "Pendiente de cobro"}
          </p>
          <p className="amount" style={{ color: "#f59e0b" }}>
            {formatMoney(metrics.pending)}
          </p>
        </div>

        <div className="metric-card">
          <p className="label">
            {isExpenses ? "Por cobrar a otros (Splits)" : "Cobranzas de deudas"}
          </p>
          <p className="amount blue">
            {formatMoney(isExpenses ? metrics.shared : metrics.debts)}
          </p>
        </div>
      </div>


      {/* Action buttons and filter bar */}
      <div className="actions-bar">
        <h2 className="transactions-heading">Movimientos del mes</h2>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {!isExpenses && previousPeriod && !isClosed && (
            <button
              type="button"
              className="button secondary"
              onClick={() => setShowCopyModal(true)}
            >
              Copiar del mes anterior
            </button>
          )}

          {!isClosed && (
            <button
              type="button"
              className="button"
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true });
                setEditingExpense(null);
                setEditingIncome(null);
                setShowForm(true);
              }}
            >
              + {isExpenses ? "Registrar gasto" : "Registrar ingreso"}
            </button>
          )}
        </div>
      </div>

      <section className="transaction-filters" aria-label="Filtros de movimientos">
        <div className="transaction-filter-fields">
          <label className="transaction-filter-field">
            <span>Buscar</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar en ${isExpenses ? "gastos" : "ingresos"}…`}
              aria-label={`Buscar ${isExpenses ? "gastos" : "ingresos"}`} />
          </label>
          <div className="transaction-filter-field">
            <span>Estado</span>
          <div className="transaction-status-options" role="group" aria-label="Estado">
            <button
              type="button"
              className="filter-tab"
              aria-pressed={statusFilter === "ALL"}
              onClick={() => setStatusFilter("ALL")}
            >
              Todos
            </button>
            <button
              type="button"
              className="filter-tab"
              aria-pressed={statusFilter === "DONE"}
              onClick={() => setStatusFilter("DONE")}
            >
              {isExpenses ? "Pagados" : "Cobrados"}
            </button>
            <button
              type="button"
              className="filter-tab"
              aria-pressed={statusFilter === "PENDING"}
              onClick={() => setStatusFilter("PENDING")}
            >
              Pendientes
            </button>
          </div>

          </div>
          <label className="transaction-filter-field">
            <span>{isExpenses ? "Categoría" : "Origen del ingreso"}</span>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="ALL">{isExpenses ? "Todas las categorías" : "Todos los orígenes"}</option>
              {Object.entries(isExpenses ? EXPENSE_CATEGORY_LABELS : INCOME_SOURCE_LABELS).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
          </label>
          {isExpenses && (
            <label className="transaction-filter-field">
              <span>Ordenar por</span>
              <select value={expenseSort} onChange={(e) => setExpenseSort(e.target.value)}>
                <option value="createdAt-desc">Registro: más recientes primero</option>
                <option value="createdAt-asc">Registro: más antiguos primero</option>
                <option value="paymentDueDate-asc">Vencimiento: más próximos primero</option>
                <option value="paymentDueDate-desc">Vencimiento: más lejanos primero</option>
                <option value="amount-asc">Importe: menor a mayor</option>
                <option value="amount-desc">Importe: mayor a menor</option>
              </select>
            </label>
          )}
        </div>
        <div className="transaction-filter-summary">
          <span role="status" aria-live="polite">
            Mostrando {isExpenses ? filteredExpenses.length : filteredIncomes.length} de {isExpenses ? expenses.length : incomes.length} {isExpenses ? "gastos" : "ingresos"}
          </span>
          {(search || statusFilter !== "ALL" || categoryFilter !== "ALL") && (
            <button type="button" className="transaction-filter-reset" onClick={() => {
              setSearch(""); setStatusFilter("ALL"); setCategoryFilter("ALL");
            }}>Limpiar filtros</button>
          )}
        </div>
      </section>

      {/* Forms modal or inline view */}
      {showForm && isExpenses && (
        <ExpenseForm
          modal
          periodId={period.id}
          expense={editingExpense}
          cards={cards}
          people={people}
          isClosed={isClosed}
          onSuccess={(saved) => {
            setExpenses((prev) => {
              const exists = prev.some((e) => e.id === saved.id);
              return exists ? prev.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev];
            });
            setShowForm(false);
            setEditingExpense(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
        />
      )}

      {showForm && !isExpenses && (
        <IncomeForm
          modal
          periodId={period.id}
          income={editingIncome}
          people={people}
          isClosed={isClosed}
          onSuccess={(saved) => {
            setIncomes((prev) => {
              const exists = prev.some((inc) => inc.id === saved.id);
              return exists ? prev.map((inc) => (inc.id === saved.id ? saved : inc)) : [saved, ...prev];
            });
            setShowForm(false);
            setEditingIncome(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingIncome(null);
          }}
        />
      )}

      {/* Items list */}
      {isExpenses ? (
        filteredExpenses.length === 0 ? (
          <EmptyState
            title={
              expenses.length === 0
                ? "No hay gastos registrados en este mes"
                : "No hay gastos con los filtros aplicados"
            }
            action={
              !isClosed && (
                <button
                  type="button"
                  className="button"
                  onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); setShowForm(true); }}
                >
                  Registrar mi primer gasto
                </button>
              )
            }
          >
            {expenses.length === 0
              ? "Captura tus pagos, compras cotidianas o gastos divididos para tener control de tus egresos."
              : "Prueba seleccionando otra categoría o cambiando el término de búsqueda."}
          </EmptyState>
        ) : (
          <div className="transactions-grid">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                cardName={expense.cardId ? cardMap.get(expense.cardId) : undefined}
                personName={
                  expense.split ? peopleMap.get(expense.split.personId) : undefined
                }
                isClosed={isClosed}
                pendingAction={pendingActionId === expense.id}
                onTogglePaid={handleTogglePaid}
                onEdit={(exp) => {
                  setEditingExpense(exp);
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDelete={(exp) => setDeletingExpense(exp)}
              />
            ))}
          </div>
        )
      ) : filteredIncomes.length === 0 ? (
        <EmptyState
          title={
            incomes.length === 0
              ? "No hay ingresos registrados en este mes"
              : "No hay ingresos con los filtros aplicados"
          }
          action={
            !isClosed && (
              <button
                type="button"
                className="button"
                onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); setShowForm(true); }}
              >
                Registrar mi primer ingreso
              </button>
            )
          }
        >
          {incomes.length === 0
            ? "Captura tu sueldo, cobros o depósitos esperados para presupuestar tus recursos."
            : "Prueba seleccionando otra fuente de ingreso o cambiando el término de búsqueda."}
        </EmptyState>
      ) : (
        <div className="transactions-grid">
          {filteredIncomes.map((income) => (
            <IncomeCard
              key={income.id}
              income={income}
              debtorPersonName={
                income.debtorPersonId
                  ? peopleMap.get(income.debtorPersonId)
                  : undefined
              }
              isClosed={isClosed}
              pendingAction={pendingActionId === income.id}
              onToggleReceived={handleToggleReceived}
              onEdit={(inc) => {
                setEditingIncome(inc);
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onDelete={(inc) => setDeletingIncome(inc)}
            />
          ))}
        </div>
      )}

      {/* Confirm Delete Expense Modal */}
      {deletingExpense && (
        <ConfirmDialog
          open={Boolean(deletingExpense)}
          title="¿Eliminar este gasto?"
          pending={pendingActionId === deletingExpense.id}
          onCancel={() => setDeletingExpense(null)}
          onConfirm={confirmDeleteExpense}
        >
          <p>
            ¿Estás seguro de que deseas eliminar{" "}
            <strong>{deletingExpense.title}</strong> por{" "}
            <strong>{formatMoney(deletingExpense.amount)}</strong>?
          </p>
          {deletingExpense.split && (
            <p style={{ color: "#fca5a5", fontSize: "0.875rem" }}>
              ⚠️ Este gasto está dividido. Al eliminarlo, también se cancelará el
              ingreso por cobranza pendiente asociado a la deuda.
            </p>
          )}
        </ConfirmDialog>
      )}

      {/* Confirm Delete Income Modal */}
      {deletingIncome && (
        <ConfirmDialog
          open={Boolean(deletingIncome)}
          title="¿Eliminar este ingreso?"
          pending={pendingActionId === deletingIncome.id}
          onCancel={() => setDeletingIncome(null)}
          onConfirm={confirmDeleteIncome}
        >
          <p>
            ¿Estás seguro de que deseas eliminar{" "}
            <strong>{deletingIncome.title}</strong> por{" "}
            <strong>{formatMoney(deletingIncome.amount)}</strong>?
          </p>
          {deletingIncome.linkedExpenseId && (
            <p style={{ color: "#fca5a5", fontSize: "0.875rem" }}>
              ⚠️ Este cobro está vinculado a un gasto compartido.
            </p>
          )}
        </ConfirmDialog>
      )}

      {/* Copy Incomes Modal */}
      {showCopyModal && previousPeriod && (
        <CopyIncomesModal
          open={showCopyModal}
          currentPeriodId={period.id}
          previousPeriodId={previousPeriod.id}
          previousPeriodName={formatMonth(
            toPeriodKey(previousPeriod.year, previousPeriod.month),
          )}
          onClose={() => setShowCopyModal(false)}
          onSuccess={(copiedList) => {
            setIncomes((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const newItems = copiedList.filter((i) => !existingIds.has(i.id));
              return [...prev, ...newItems];
            });
          }}
        />
      )}
    </div>
  );
}
