"use client";

import { useState } from "react";
import { clientRequest } from "@/lib/client";
import { parseAmount } from "@/lib/format";
import { getNextPeriod, type BudgetPeriod } from "./contracts";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function InitializeMonthWizard({
  lastPeriod,
  onCreated,
  onCancel,
}: {
  lastPeriod?: BudgetPeriod | null;
  onCreated?: (period: BudgetPeriod) => void;
  onCancel?: () => void;
}) {
  const currentCalDate = new Date();
  const defaultSuggestion = lastPeriod
    ? getNextPeriod(lastPeriod.year, lastPeriod.month)
    : {
        year: currentCalDate.getUTCFullYear(),
        month: currentCalDate.getUTCMonth() + 1,
      };

  const [year, setYear] = useState(defaultSuggestion.year);
  const [month, setMonth] = useState(defaultSuggestion.month);

  // Suggested carried savings from previous month if available
  const suggestedSavings =
    lastPeriod !== undefined && lastPeriod !== null
      ? (lastPeriod.carriedSavings || 0) + (lastPeriod.totalIncome || 0) - (lastPeriod.totalExpenses || 0)
      : 0;

  const [carriedSavingsStr, setCarriedSavingsStr] = useState(String(suggestedSavings));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const isNegative = carriedSavingsStr.trim().startsWith("-");
    const rawNumStr = isNegative ? carriedSavingsStr.trim().slice(1) : carriedSavingsStr.trim();
    const parsedAbs = parseAmount(rawNumStr);
    if (parsedAbs === null && rawNumStr !== "0") {
      setError("Ingresa un monto de ahorro válido (ej. 0, 1500 o -300).");
      return;
    }
    const finalSavings = isNegative ? -(parsedAbs ?? 0) : (parsedAbs ?? 0);

    setLoading(true);
    try {
      const period = await clientRequest<BudgetPeriod>("/budgets/initialize", {
        method: "POST",
        body: {
          year: Number(year),
          month: Number(month),
          carriedSavings: finalSavings,
          notes: notes.trim() || undefined,
        },
      });
      onCreated?.(period);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos inicializar este periodo presupuestario.",
      );
    } finally {
      setLoading(false);
    }
  }

  const currentYear = new Date().getUTCFullYear();
  const yearOptions = [
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(3, 8, 18, 0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
      }}
    >
      <div
        className="auth-card"
        style={{
          maxWidth: "520px",
          width: "100%",
          boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
      >
        <p className="card-kicker">PLANIFICACIÓN FINANCIERA</p>
        <h2 id="wizard-title" style={{ fontSize: "1.75rem", marginBottom: "8px" }}>
          Abrir periodo presupuestario
        </h2>
        <p className="muted" style={{ fontSize: "0.9375rem", marginBottom: "24px" }}>
          Selecciona el mes y año a presupuestar y confirma el saldo que trasladas
          del periodo anterior.
        </p>

        {error && (
          <div className="error-state" style={{ marginBottom: "20px" }}>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "16px" }}>
            <div className="field">
              <label htmlFor="wizard-year">Año</label>
              <select
                id="wizard-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="wizard-month">Mes</label>
              <select
                id="wizard-month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                required
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name} ({String(idx + 1).padStart(2, "0")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="wizard-savings">Ahorro o déficit acarreado</label>
            <input
              id="wizard-savings"
              type="text"
              inputMode="decimal"
              value={carriedSavingsStr}
              onChange={(e) => setCarriedSavingsStr(e.target.value)}
              placeholder="0.00"
              required
            />
            <span className="field-hint">
              {Number(carriedSavingsStr) < 0
                ? "Déficit trasladado: se restará de la disponibilidad del nuevo mes."
                : "Remanente o ahorro que transfieres para iniciar este mes."}
            </span>
          </div>

          <div className="field">
            <label htmlFor="wizard-notes">Notas del periodo (opcional)</label>
            <input
              id="wizard-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Vacaciones, aguinaldo o gastos escolares"
              maxLength={200}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "28px",
            }}
          >
            {onCancel && (
              <button
                type="button"
                className="button secondary"
                disabled={loading}
                onClick={onCancel}
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Inicializando mes…" : "Abrir periodo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
