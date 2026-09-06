"use client";

import { formatDate, formatMoney } from "@/lib/format";
import {
  calculateSplitBreakdown,
  type Expense,
  type ExpenseCategory,
} from "./contracts";

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

          <button
            type="button"
            className={`status-pill ${isPaid ? "paid" : "pending"}`}
            disabled={isClosed || pendingAction || !onTogglePaid}
            onClick={() => onTogglePaid?.(expense)}
            title={
              isClosed
                ? "El periodo está cerrado"
                : isPaid
                ? "Marcar como pendiente de pago al banco"
                : "Marcar como pagado al banco"
            }
            aria-label={`Estado: ${
              isPaid ? "Pagado al banco" : "Pendiente de pago al banco"
            }. Haz clic para cambiar.`}
          >
            <span className={`dot ${isPaid ? "green" : "blue"}`} />
            {isPaid ? "Pagado" : "Pendiente"}
          </button>
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

        {!isClosed && (onEdit || onDelete) && (
          <div className="transaction-actions">
            {onEdit && (
              <button
                type="button"
                className="button secondary"
                style={{ minHeight: "36px", padding: "6px 14px", fontSize: "0.8125rem", flex: 1 }}
                disabled={pendingAction}
                onClick={() => onEdit(expense)}
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="button danger"
                style={{ minHeight: "36px", padding: "6px 14px", fontSize: "0.8125rem" }}
                disabled={pendingAction}
                onClick={() => onDelete(expense)}
                aria-label={`Eliminar gasto ${expense.title}`}
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
