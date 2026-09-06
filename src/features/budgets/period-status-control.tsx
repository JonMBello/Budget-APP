"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import type { BudgetPeriod, BudgetStatus } from "./contracts";

export function PeriodStatusControl({
  period,
  onStatusChange,
}: {
  period: Pick<BudgetPeriod, "year" | "month" | "status">;
  onStatusChange?: (newStatus: BudgetStatus) => void;
}) {
  const [currentStatus, setCurrentStatus] = useState<BudgetStatus>(period.status);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isOpen = currentStatus === "OPEN";

  function handleTriggerClick(target: BudgetStatus) {
    setPendingStatus(target);
    setIsConfirming(true);
    setError("");
  }

  async function handleConfirm() {
    if (!pendingStatus) return;
    setLoading(true);
    setError("");
    try {
      const updated = await clientRequest<BudgetPeriod>(
        `/budgets/${period.year}/${period.month}/status`,
        {
          method: "PATCH",
          body: { status: pendingStatus },
        },
      );
      setCurrentStatus(updated.status);
      onStatusChange?.(updated.status);
      setIsConfirming(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos actualizar el estado del periodo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ display: "inline-flex", flexDirection: "column", gap: "6px" }}>
        {isOpen ? (
          <button
            type="button"
            className="button secondary"
            style={{ minHeight: "40px", padding: "8px 16px", fontSize: "0.875rem" }}
            onClick={() => handleTriggerClick("CLOSED")}
          >
            Cerrar mes
          </button>
        ) : (
          <button
            type="button"
            className="button secondary"
            style={{ minHeight: "40px", padding: "8px 16px", fontSize: "0.875rem" }}
            onClick={() => handleTriggerClick("OPEN")}
          >
            Reabrir mes
          </button>
        )}
        {error && (
          <span className="field-error" style={{ fontSize: "0.75rem" }} role="alert">
            {error}
          </span>
        )}
      </div>

      <ConfirmDialog
        open={isConfirming}
        title={
          pendingStatus === "CLOSED"
            ? "¿Cerrar este periodo presupuestario?"
            : "¿Reabrir este periodo presupuestario?"
        }
        pending={loading}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!loading) {
            setIsConfirming(false);
            setPendingStatus(null);
          }
        }}
      >
        <p style={{ margin: "12px 0 0" }}>
          {pendingStatus === "CLOSED"
            ? "Al cerrar el periodo se bloquearán altas, ediciones y eliminaciones de movimientos para proteger el historial financiero. Podrás reabrirlo más adelante si lo necesitas."
            : "Al reabrir el periodo podrás volver a registrar ingresos, gastos y editar el presupuesto correspondiente a este mes."}
        </p>
      </ConfirmDialog>
    </>
  );
}
