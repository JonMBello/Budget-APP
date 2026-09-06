"use client";

import { useState } from "react";
import { Money } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { parseAmount } from "@/lib/format";
import type { BudgetPeriod } from "./contracts";

export function CarriedSavingsEditor({
  period,
  onSaved,
  disabled = false,
}: {
  period: Pick<BudgetPeriod, "year" | "month" | "carriedSavings" | "notes" | "status">;
  onSaved?: (updated: BudgetPeriod) => void;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [amountStr, setAmountStr] = useState(String(period.carriedSavings));
  const [notes, setNotes] = useState(period.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentSavings, setCurrentSavings] = useState(period.carriedSavings);
  const [currentNotes, setCurrentNotes] = useState(period.notes ?? "");

  const isClosed = period.status === "CLOSED" || disabled;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const isNegative = amountStr.trim().startsWith("-");
    const rawNumStr = isNegative ? amountStr.trim().slice(1) : amountStr.trim();
    const parsedAbs = parseAmount(rawNumStr);
    if (parsedAbs === null && rawNumStr !== "0") {
      setError("Ingresa un importe numérico válido (ej. 1500 o -250.50).");
      return;
    }
    const finalAmount = isNegative ? -(parsedAbs ?? 0) : (parsedAbs ?? 0);

    setLoading(true);
    try {
      const updated = await clientRequest<BudgetPeriod>(
        `/budgets/${period.year}/${period.month}/savings`,
        {
          method: "PATCH",
          body: {
            carriedSavings: finalAmount,
            notes: notes.trim() || undefined,
          },
        },
      );
      setCurrentSavings(updated.carriedSavings);
      setCurrentNotes(updated.notes ?? "");
      setIsEditing(false);
      onSaved?.(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos actualizar el ahorro acarreado.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="metric-card" style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="label">Ahorro acarreado</p>
          <p
            className={`amount ${currentSavings < 0 ? "negative" : "green"}`}
            style={{ margin: "4px 0" }}
          >
            <Money amount={currentSavings} />
          </p>
          {currentSavings < 0 && (
            <p className="muted" style={{ fontSize: "0.8125rem", margin: "2px 0 0" }}>
              Déficit trasladado del mes anterior
            </p>
          )}
          {currentNotes && (
            <p className="muted" style={{ fontSize: "0.8125rem", margin: "4px 0 0", fontStyle: "italic" }}>
              Nota: {currentNotes}
            </p>
          )}
        </div>
        {!isClosed && !isEditing && (
          <button
            type="button"
            className="button secondary"
            style={{ minHeight: "36px", padding: "6px 14px", fontSize: "0.8125rem" }}
            onClick={() => {
              setAmountStr(String(currentSavings));
              setNotes(currentNotes);
              setIsEditing(true);
              setError("");
            }}
          >
            Ajustar ahorro
          </button>
        )}
      </div>

      {isEditing && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="field">
            <label htmlFor="carried-savings-input">Monto de ahorro o déficit</label>
            <input
              id="carried-savings-input"
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              required
            />
            <span className="field-hint">
              Valores negativos representan un déficit heredado.
            </span>
          </div>

          <div className="field">
            <label htmlFor="carried-savings-notes">Motivo o notas del ajuste (opcional)</label>
            <input
              id="carried-savings-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Ajuste por bono o remanente recalculado"
              maxLength={200}
            />
          </div>

          {error && <p className="field-error" role="alert">{error}</p>}

          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
            <button
              type="submit"
              className="button"
              style={{ minHeight: "38px", padding: "8px 16px", fontSize: "0.875rem" }}
              disabled={loading}
            >
              {loading ? "Guardando…" : "Guardar ajuste"}
            </button>
            <button
              type="button"
              className="button secondary"
              style={{ minHeight: "38px", padding: "8px 16px", fontSize: "0.875rem" }}
              disabled={loading}
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
