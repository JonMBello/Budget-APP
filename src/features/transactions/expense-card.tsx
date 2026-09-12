"use client";

import { formatDate, formatMoney } from "@/lib/format";
import {
  calculateSplitBreakdown,
  type Expense,
  type ExpenseCategory,
} from "./contracts";
import { TransactionCardActions } from "./transaction-actions";

export const EXPENSE_CATEGORY_LABELS: Record<
  ExpenseCategory,
  { label: string; className: string }
> = {
  SERVICE: { label: "Servicio", className: "service" },
  SUBSCRIPTION: { label: "Suscripción", className: "subscription" },
  MSI: { label: "MSI", className: "msi" },
  REGULAR_EXPENSE: { label: "Gasto común", className: "regular_expense" },
  FOOD: { label: "Comida", className: "food" },
  TRANSPORT: { label: "Transporte", className: "transport" },
  HOUSING: { label: "Vivienda", className: "housing" },
  HEALTH: { label: "Salud", className: "health" },
  ENTERTAINMENT: { label: "Entretenimiento", className: "entertainment" },
  SHOPPING: { label: "Compras", className: "shopping" },
  OTHER: { label: "Otros", className: "other" },
};

export function ExpenseCard({
  expense,
  cardName,
  personName,
  isClosed = false,
  pendingAction = false,
  onTogglePaid,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  cardName?: string;
  personName?: string;
  isClosed?: boolean;
  pendingAction?: boolean;
  onTogglePaid?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}) {
  const catMeta = EXPENSE_CATEGORY_LABELS[expense.category] ?? {
    label: expense.category,
    className: "other",
  };

  const isPaid = Boolean(expense.isPaid);
  const splitBreakdown = expense.split
    ? calculateSplitBreakdown(expense.amount, expense.split)
    : null;

  return (
    <div
      className={`transaction-card ${isPaid ? "paid" : "pending"}`}
      aria-label={`Gasto: ${expense.title}`}
    >
      <div>
        <div className="transaction-card-top">
          <div className="transaction-tags">
            <span className={`category-tag ${catMeta.className}`}>
              {catMeta.label}
            </span>
            {expense.split && (
              <span className="split-tag">
                Dividido{" "}
                {expense.split.splitType === "PERCENTAGE"
                  ? `${expense.split.splitValue}%`
                  : formatMoney(expense.split.splitValue)}
              </span>
            )}
          </div>

          <span className={`transaction-state ${isPaid ? "complete" : "waiting"}`}>
            <span aria-hidden="true">{isPaid ? "✓" : "◷"}</span>
            {isPaid ? "Pagado" : "Pendiente"}
          </span>
        </div>

        <h3 className="transaction-title">{expense.title}</h3>
        {expense.notes && (
          <p className="muted" style={{ fontSize: "0.8125rem", margin: "0 0 8px" }}>
            {expense.notes}
          </p>
        )}

        <div className="transaction-amount">
          {formatMoney(expense.amount)}
        </div>

        {splitBreakdown && (
          <div
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "0.8125rem",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span className="muted">Tu parte real:</span>
              <strong style={{ color: "var(--text)" }}>
                {formatMoney(splitBreakdown.yourShare)}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">
                Por cobrar a {personName || "deudor"}:
              </span>
              <strong style={{ color: "var(--green)" }}>
                {formatMoney(splitBreakdown.debtorShare)}
              </strong>
            </div>
          </div>
        )}
      </div>

      <div className="transaction-meta">
        <div className="transaction-meta-item">
          <span>Fecha de cargo:</span>
          <strong style={{ color: "var(--text)" }}>
            {formatDate(expense.date)}
          </strong>
        </div>

        {expense.paymentDueDate && (
          <div className="transaction-meta-item">
            <span>Fecha de vencimiento:</span>
            <strong style={{ color: "var(--text)" }}>
              {formatDate(expense.paymentDueDate)}
            </strong>
          </div>
        )}

        {cardName && (
          <div className="transaction-meta-item">
            <span>Método de pago:</span>
            <strong style={{ color: "var(--text)" }}>{cardName}</strong>
          </div>
        )}

        {personName && expense.split && (
          <div className="transaction-meta-item">
            <span>Dividido con:</span>
            <strong style={{ color: "var(--text)" }}>{personName}</strong>
          </div>
        )}

        {!isClosed && (
          <TransactionCardActions
            pendingAction={pendingAction}
            statusComplete={isPaid}
            markCompleteLabel="Marcar como pagado"
            markPendingLabel="Marcar como pendiente"
            onToggleStatus={onTogglePaid ? () => onTogglePaid(expense) : undefined}
            onEdit={onEdit ? () => onEdit(expense) : undefined}
            onDelete={onDelete ? () => onDelete(expense) : undefined}
            deleteAriaLabel={`Eliminar gasto ${expense.title}`}
          />
        )}
      </div>
    </div>
  );
}
