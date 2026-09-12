"use client";

import { formatDate, formatMoney } from "@/lib/format";
import {
  type Income,
  type IncomeSource,
} from "./contracts";
import { TransactionCardActions } from "./transaction-actions";

export const INCOME_SOURCE_LABELS: Record<
  IncomeSource,
  { label: string; className: string }
> = {
  PAYROLL: { label: "Nómina", className: "payroll" },
  DEBT_COLLECTION: { label: "Cobro de deuda", className: "debt_collection" },
  DEPOSIT: { label: "Depósito", className: "deposit" },
  INVESTMENT: { label: "Inversión", className: "investment" },
  OTHER: { label: "Otros", className: "other" },
};

export function IncomeCard({
  income,
  debtorPersonName,
  isClosed = false,
  pendingAction = false,
  onToggleReceived,
  onEdit,
  onDelete,
}: {
  income: Income;
  debtorPersonName?: string;
  isClosed?: boolean;
  pendingAction?: boolean;
  onToggleReceived?: (income: Income) => void;
  onEdit?: (income: Income) => void;
  onDelete?: (income: Income) => void;
}) {
  const sourceMeta = INCOME_SOURCE_LABELS[income.source] ?? {
    label: income.source,
    className: "other",
  };

  const isReceived = Boolean(income.isReceived);
  const isLinked = Boolean(income.linkedExpenseId);

  return (
    <div
      className={`transaction-card ${isReceived ? "received" : "pending"}`}
      aria-label={`Ingreso: ${income.title}`}
    >
      <div>
        <div className="transaction-card-top">
          <div className="transaction-tags">
            <span className={`source-tag ${sourceMeta.className}`}>
              {sourceMeta.label}
            </span>
            {isLinked && (
              <span className="split-tag">
                Gasto dividido
              </span>
            )}
          </div>

          <span className={`transaction-state ${isReceived ? "complete" : "waiting"}`}>
            <span aria-hidden="true">{isReceived ? "✓" : "◷"}</span>
            {isReceived ? "Cobrado" : "Pendiente"}
          </span>
        </div>

        <h3 className="transaction-title">{income.title}</h3>
        {income.notes && (
          <p className="muted" style={{ fontSize: "0.8125rem", margin: "0 0 8px" }}>
            {income.notes}
          </p>
        )}

        <div className="transaction-amount" style={{ color: "var(--green)" }}>
          +{formatMoney(income.amount)}
        </div>

        {income.source === "DEBT_COLLECTION" && (
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
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">Deudor:</span>
              <strong style={{ color: "var(--text)" }}>
                {debtorPersonName || "Persona registrada"}
              </strong>
            </div>
            {isLinked && (
              <span
                className="muted"
                style={{ display: "block", marginTop: "4px", fontSize: "0.75rem" }}
              >
                Generado automáticamente al dividir un gasto.
              </span>
            )}
          </div>
        )}
      </div>

      <div className="transaction-meta">
        <div className="transaction-meta-item">
          <span>Fecha de ingreso:</span>
          <strong style={{ color: "var(--text)" }}>
            {formatDate(income.date)}
          </strong>
        </div>

        {income.dueDate && (
          <div className="transaction-meta-item">
            <span>Fecha estimada de cobro:</span>
            <strong style={{ color: "var(--text)" }}>
              {formatDate(income.dueDate)}
            </strong>
          </div>
        )}

        {!isClosed && (
          <TransactionCardActions
            pendingAction={pendingAction}
            statusComplete={isReceived}
            markCompleteLabel="Marcar como cobrado"
            markPendingLabel="Marcar como pendiente"
            onToggleStatus={onToggleReceived ? () => onToggleReceived(income) : undefined}
            onEdit={onEdit ? () => onEdit(income) : undefined}
            onDelete={onDelete ? () => onDelete(income) : undefined}
            deleteAriaLabel={`Eliminar ingreso ${income.title}`}
            deleteDisabled={isLinked && isReceived}
            deleteTitle={
              isLinked && isReceived
                ? "No se puede eliminar un cobro de deuda ya recibido."
                : "Eliminar ingreso"
            }
          />
        )}
      </div>
    </div>
  );
}
