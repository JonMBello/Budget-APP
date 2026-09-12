"use client";

import { Icon } from "@/components/icon";

export function TransactionCardActions({
  pendingAction = false,
  statusComplete,
  markCompleteLabel,
  markPendingLabel,
  onToggleStatus,
  onEdit,
  onDelete,
  deleteAriaLabel,
  deleteDisabled = false,
  deleteTitle,
}: {
  pendingAction?: boolean;
  statusComplete: boolean;
  markCompleteLabel: string;
  markPendingLabel: string;
  onToggleStatus?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteAriaLabel?: string;
  deleteDisabled?: boolean;
  deleteTitle?: string;
}) {
  if (!onToggleStatus && !onEdit && !onDelete) {
    return null;
  }

  const statusLabel = pendingAction
    ? "Guardando…"
    : statusComplete
      ? markPendingLabel
      : markCompleteLabel;

  return (
    <div className="transaction-actions">
      {onToggleStatus && (
        <button
          type="button"
          className={`transaction-status-action ${statusComplete ? "complete" : "waiting"}`}
          disabled={pendingAction}
          onClick={onToggleStatus}
        >
          <Icon name={statusComplete ? "undo" : "check"} />
          {statusLabel}
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          className="transaction-icon-action"
          disabled={pendingAction}
          onClick={onEdit}
          aria-label="Editar"
          title="Editar"
        >
          <Icon name="edit" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="transaction-icon-action danger"
          disabled={pendingAction || deleteDisabled}
          onClick={onDelete}
          aria-label={deleteAriaLabel ?? "Eliminar"}
          title={deleteTitle ?? deleteAriaLabel ?? "Eliminar"}
        >
          <Icon name="trash" />
        </button>
      )}
    </div>
  );
}
