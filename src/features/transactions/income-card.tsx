"use client";

import { formatDate, formatMoney } from "@/lib/format";
import {
  type Income,
  type IncomeSource,
} from "./contracts";

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

          <button
            type="button"
            className={`status-pill ${isReceived ? "received" : "pending"}`}
            disabled={isClosed || pendingAction || !onToggleReceived}
            onClick={() => onToggleReceived?.(income)}
            title={
              isClosed
                ? "El periodo está cerrado"
                : isReceived
                ? "Marcar como pendiente de cobro"
                : "Marcar como cobrado / recibido"
            }
            aria-label={`Estado: ${
              isReceived ? "Recibido / Cobrado" : "Pendiente de cobro"
            }. Haz clic para cambiar.`}
          >
            <span className={`dot ${isReceived ? "green" : "blue"}`} />
            {isReceived ? "Recibido" : "Pendiente"}
          </button>
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

        {!isClosed && (onEdit || onDelete) && (
          <div className="transaction-actions">
            {onEdit && (
              <button
                type="button"
                className="button secondary"
                style={{ minHeight: "36px", padding: "6px 14px", fontSize: "0.8125rem", flex: 1 }}
                disabled={pendingAction}
                onClick={() => onEdit(income)}
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="button danger"
                style={{ minHeight: "36px", padding: "6px 14px", fontSize: "0.8125rem" }}
                disabled={pendingAction || (isLinked && isReceived)}
                onClick={() => onDelete(income)}
                title={
                  isLinked && isReceived
                    ? "No se puede eliminar un cobro de deuda ya recibido."
                    : "Eliminar ingreso"
                }
                aria-label={`Eliminar ingreso ${income.title}`}
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
