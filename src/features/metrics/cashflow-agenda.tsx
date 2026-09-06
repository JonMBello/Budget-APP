"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, Money } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Card } from "@/features/cards/contracts";
import type { Person } from "@/features/people/contracts";
import type {
  AgendaSections,
  CashflowAgendaItem,
  ReceivablesSummary,
} from "./contracts";

export function CashflowAgenda({
  agenda,
  receivables,
  cards,
  people,
  onTogglePaidExpense,
  onToggleReceivedIncome,
  isMutating = false,
}: {
  agenda: AgendaSections;
  receivables?: ReceivablesSummary | null;
  cards?: Card[];
  people?: Person[];
  onTogglePaidExpense?: (expenseId: string) => Promise<void>;
  onToggleReceivedIncome?: (incomeId: string) => Promise<void>;
  isMutating?: boolean;
}) {
  const [filterType, setFilterType] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [filterCardId, setFilterCardId] = useState<string>("ALL");
  const [filterPersonId, setFilterPersonId] = useState<string>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filterItem = useCallback(
    (item: CashflowAgendaItem): boolean => {
      if (filterType === "EXPENSE" && item.type !== "EXPENSE") return false;
      if (filterType === "INCOME" && item.type !== "INCOME") return false;
      if (filterCardId !== "ALL" && item.cardId !== filterCardId) return false;
      if (filterPersonId !== "ALL" && item.debtorPersonId !== filterPersonId) return false;
      return true;
    },
    [filterType, filterCardId, filterPersonId],
  );

  const overdue = useMemo(() => agenda.overdue.filter(filterItem), [agenda.overdue, filterItem]);
  const upcoming = useMemo(() => agenda.upcoming.filter(filterItem), [agenda.upcoming, filterItem]);
  const noDate = useMemo(() => agenda.noDate.filter(filterItem), [agenda.noDate, filterItem]);

  const totalItemsCount = overdue.length + upcoming.length + noDate.length;

  async function handleToggle(item: CashflowAgendaItem) {
    if (processingId) return;
    setProcessingId(item.id);
    try {
      if (item.type === "EXPENSE" && onTogglePaidExpense) {
        await onTogglePaidExpense(item.id);
      } else if (item.type === "INCOME" && onToggleReceivedIncome) {
        await onToggleReceivedIncome(item.id);
      }
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="agenda-container" data-testid="cashflow-agenda">
      <div className="agenda-header">
        <div>
          <h2 className="agenda-title">Agenda de Flujo de Caja</h2>
          <p className="agenda-subtitle">
            Compromisos de pago y cobros pendientes del mes ordenados cronológicamente.
          </p>
        </div>
      </div>

      {/* Receivables block if there are debtors */}
      {receivables && receivables.debtors.length > 0 && (
        <div className="receivables-summary-box" data-testid="receivables-summary">
          <div className="receivables-header">
            <div>
              <span className="label">Por cobrar a terceros este mes</span>
              <p className="amount green" data-testid="pending-debt-collections-amount">
                <Money amount={receivables.pendingDebtCollections} />
              </p>
            </div>
            <span className="badge-subtle">Cuentas por cobrar</span>
          </div>

          <div className="debtors-grid">
            {receivables.debtors.map((debtor) => (
              <div key={debtor.personId} className="debtor-card" data-testid={`debtor-${debtor.personId}`}>
                <div className="debtor-info">
                  <strong className="debtor-name">{debtor.name}</strong>
                  <span className="debtor-pending-count">
                    {debtor.pendingCount} {debtor.pendingCount === 1 ? "cobro pendiente" : "cobros pendientes"}
                  </span>
                  {debtor.earliestDueDate && (
                    <span className="debtor-due-date">
                      Vence: {formatDate(debtor.earliestDueDate)}
                    </span>
                  )}
                </div>
                <div className="debtor-actions">
                  <span className="debtor-amount green">
                    <Money amount={debtor.amount} />
                  </span>
                  <Link
                    href={`/people/${debtor.personId}`}
                    className="button secondary mini-button"
                  >
                    Ver cuenta global
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="agenda-filters-bar">
        <div className="filter-group">
          <label htmlFor="filter-type" className="filter-label">
            Tipo:
          </label>
          <select
            id="filter-type"
            className="input select-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "ALL" | "EXPENSE" | "INCOME")}
          >
            <option value="ALL">Todos los movimientos</option>
            <option value="EXPENSE">Solo pagos pendientes</option>
            <option value="INCOME">Solo cobros pendientes</option>
          </select>
        </div>

        {cards && cards.length > 0 && (
          <div className="filter-group">
            <label htmlFor="filter-card" className="filter-label">
              Tarjeta / Cuenta:
            </label>
            <select
              id="filter-card"
              className="input select-filter"
              value={filterCardId}
              onChange={(e) => setFilterCardId(e.target.value)}
            >
              <option value="ALL">Todas las tarjetas</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === "CREDIT" ? "Crédito" : "Débito"})
                </option>
              ))}
            </select>
          </div>
        )}

        {people && people.length > 0 && (
          <div className="filter-group">
            <label htmlFor="filter-person" className="filter-label">
              Persona:
            </label>
            <select
              id="filter-person"
              className="input select-filter"
              value={filterPersonId}
              onChange={(e) => setFilterPersonId(e.target.value)}
            >
              <option value="ALL">Todas las personas</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {totalItemsCount === 0 ? (
        <EmptyState title="Sin compromisos pendientes">
          No hay gastos pendientes de pago ni cobros por recibir en este periodo con los filtros seleccionados.
        </EmptyState>
      ) : (
        <div className="agenda-sections">
          {/* Section: Overdue */}
          {overdue.length > 0 && (
            <div className="agenda-section overdue-section" data-testid="agenda-section-overdue">
              <div className="agenda-section-title-wrap">
                <span className="status-dot red-dot" />
                <h3 className="agenda-section-title">Vencidos ({overdue.length})</h3>
              </div>
              <div className="agenda-items-list">
                {overdue.map((item) => (
                  <AgendaItemRow
                    key={item.id}
                    item={item}
                    isOverdue={true}
                    onToggle={() => handleToggle(item)}
                    isProcessing={processingId === item.id || isMutating}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: Upcoming */}
          {upcoming.length > 0 && (
            <div className="agenda-section upcoming-section" data-testid="agenda-section-upcoming">
              <div className="agenda-section-title-wrap">
                <span className="status-dot blue-dot" />
                <h3 className="agenda-section-title">Próximos / Programados ({upcoming.length})</h3>
              </div>
              <div className="agenda-items-list">
                {upcoming.map((item) => (
                  <AgendaItemRow
                    key={item.id}
                    item={item}
                    isOverdue={false}
                    onToggle={() => handleToggle(item)}
                    isProcessing={processingId === item.id || isMutating}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: No Date */}
          {noDate.length > 0 && (
            <div className="agenda-section nodate-section" data-testid="agenda-section-nodate">
              <div className="agenda-section-title-wrap">
                <span className="status-dot gray-dot" />
                <h3 className="agenda-section-title">Sin fecha específica ({noDate.length})</h3>
              </div>
              <div className="agenda-items-list">
                {noDate.map((item) => (
                  <AgendaItemRow
                    key={item.id}
                    item={item}
                    isOverdue={false}
                    onToggle={() => handleToggle(item)}
                    isProcessing={processingId === item.id || isMutating}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="agenda-disclaimer">
        ℹ️ Esta agenda organiza tus registros para planificar tu flujo de caja; <strong>no representa saldo bancario disponible ni el pago mínimo requerido por tu banco</strong>.
      </p>
    </div>
  );
}

function AgendaItemRow({
  item,
  isOverdue,
  onToggle,
  isProcessing,
}: {
  item: CashflowAgendaItem;
  isOverdue: boolean;
  onToggle: () => void;
  isProcessing: boolean;
}) {
  const isExpense = item.type === "EXPENSE";

  return (
    <div
      className={`agenda-item-card ${isOverdue ? "item-overdue" : ""} ${isExpense ? "item-expense" : "item-income"}`}
      data-testid={`agenda-item-${item.id}`}
    >
      <div className="agenda-item-left">
        <span className={`agenda-item-tag ${isExpense ? "tag-expense" : "tag-income"}`}>
          {isExpense ? "Gasto por pagar" : "Cobro por recibir"}
        </span>
        <strong className="agenda-item-title">{item.title}</strong>
        <div className="agenda-item-meta">
          {item.dueDate ? (
            <span className={`agenda-item-date ${isOverdue ? "date-overdue" : ""}`}>
              {isOverdue ? "Venció: " : "Vence: "}
              {formatDate(item.dueDate)}
            </span>
          ) : (
            <span className="agenda-item-date">
              Registrado: {formatDate(item.date)}
            </span>
          )}

          {item.cardName && (
            <span className="agenda-item-pill card-pill">
              💳 {item.cardName}
            </span>
          )}

          {item.debtorName && (
            <span className="agenda-item-pill debtor-pill">
              👤 Deudor: {item.debtorName}
            </span>
          )}
        </div>
      </div>

      <div className="agenda-item-right">
        <span className={`agenda-item-amount ${isExpense ? "red" : "green"}`}>
          {isExpense ? "- " : "+ "}
          <Money amount={item.amount} />
        </span>

        <button
          type="button"
          className="button secondary mini-button"
          onClick={onToggle}
          disabled={isProcessing}
          data-testid={`toggle-button-${item.id}`}
        >
          {isProcessing
            ? "Guardando…"
            : isExpense
              ? "Marcar pagado"
              : "Marcar recibido"}
        </button>
      </div>
    </div>
  );
}
