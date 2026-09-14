"use client";

import { personContact } from "@/features/people/contracts";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { type Person } from "@/features/people/contracts";
import {
  calculateSplitBreakdown,
  type TransactionSplit,
} from "./contracts";

export function SplitEditor({
  amount,
  split,
  people,
  onChange,
  disabled = false,
}: {
  amount: number;
  split?: TransactionSplit | null;
  people: Person[];
  onChange: (split: TransactionSplit | null) => void;
  disabled?: boolean;
}) {
  const [enabled, setEnabled] = useState<boolean>(Boolean(split));
  const [personId, setPersonId] = useState<string>(split?.personId ?? (people[0]?.id || ""));
  const [splitType, setSplitType] = useState<"PERCENTAGE" | "FIXED">(
    split?.splitType ?? "PERCENTAGE",
  );
  const [splitValue, setSplitValue] = useState<number>(
    split?.splitValue ?? 50,
  );

  function handleToggle(checked: boolean) {
    setEnabled(checked);
    if (!checked) {
      onChange(null);
    } else {
      const selectedPerson = personId || people[0]?.id || "";
      const val = splitType === "PERCENTAGE" ? 50 : Math.round((amount / 2) * 100) / 100;
      setSplitValue(val);
      onChange({
        personId: selectedPerson,
        splitType,
        splitValue: val,
        isDebtActive: true,
      });
    }
  }

  function updateSplit(
    nextPersonId: string,
    nextType: "PERCENTAGE" | "FIXED",
    nextValue: number,
  ) {
    setPersonId(nextPersonId);
    setSplitType(nextType);
    setSplitValue(nextValue);
    onChange({
      personId: nextPersonId,
      splitType: nextType,
      splitValue: nextValue,
      isDebtActive: true,
    });
  }

  const currentSplit: TransactionSplit | null = enabled
    ? {
        personId,
        splitType,
        splitValue,
        isDebtActive: true,
      }
    : null;

  const { yourShare, debtorShare } = calculateSplitBreakdown(
    amount > 0 ? amount : 0,
    currentSplit,
  );

  const selectedPerson = people.find((p) => p.id === personId);
  const personDisplayName = selectedPerson ? selectedPerson.name : "la otra persona";

  const isPercentageOver = splitType === "PERCENTAGE" && splitValue > 100;
  const isFixedOver = splitType === "FIXED" && splitValue > amount;

  return (
    <div className="split-box" aria-label="División de gasto con otra persona">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          type="checkbox"
          id="split-toggle"
          checked={enabled}
          disabled={disabled}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        <label
          htmlFor="split-toggle"
          style={{ fontWeight: 600, fontSize: "0.9375rem", cursor: disabled ? "not-allowed" : "pointer" }}
        >
          Dividir este gasto con otra persona (Split)
        </label>
      </div>

      {enabled && (
        <div style={{ marginTop: "16px", display: "grid", gap: "14px" }}>
          {people.length === 0 ? (
            <p className="muted" style={{ fontSize: "0.875rem", margin: 0 }}>
              No tienes contactos registrados aún. Registra primero una persona en tu directorio para poder dividir gastos.
            </p>
          ) : (
            <>
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="split-person-select">Persona que debe su parte</label>
                <select
                  id="split-person-select"
                  value={personId}
                  disabled={disabled}
                  onChange={(e) => updateSplit(e.target.value, splitType, splitValue)}
                  required
                >
                  <option value="" disabled>
                    Selecciona una persona…
                  </option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {personContact(p) ? `(${personContact(p)})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="split-type-select">Tipo de división</label>
                  <select
                    id="split-type-select"
                    value={splitType}
                    disabled={disabled}
                    onChange={(e) => {
                      const nextType = e.target.value as "PERCENTAGE" | "FIXED";
                      const nextVal =
                        nextType === "PERCENTAGE"
                          ? 50
                          : Math.round((amount / 2) * 100) / 100;
                      updateSplit(personId, nextType, nextVal);
                    }}
                  >
                    <option value="PERCENTAGE">Por porcentaje (%)</option>
                    <option value="FIXED">Por monto fijo ($)</option>
                  </select>
                </div>

                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="split-value-input">
                    {splitType === "PERCENTAGE" ? "Porcentaje deudor (%)" : "Monto deudor ($)"}
                  </label>
                  <input
                    id="split-value-input"
                    type="number"
                    step={splitType === "PERCENTAGE" ? "any" : "0.01"}
                    min={splitType === "PERCENTAGE" ? "1" : "0.01"}
                    max={splitType === "PERCENTAGE" ? "100" : String(amount)}
                    value={isNaN(splitValue) ? "" : splitValue}
                    disabled={disabled}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      updateSplit(personId, splitType, val);
                    }}
                    required
                  />
                </div>
              </div>

              {(isPercentageOver || isFixedOver) && (
                <p className="field-error" role="alert">
                  {isPercentageOver
                    ? "El porcentaje a compartir no puede ser mayor al 100%."
                    : "El monto a compartir no puede ser mayor al gasto total."}
                </p>
              )}

              <div className="split-breakdown" aria-label="Desglose de división">
                <div>
                  <span className="muted" style={{ display: "block", fontSize: "0.75rem" }}>
                    Tu parte real:
                  </span>
                  <strong style={{ color: "var(--text)", fontSize: "1rem" }}>
                    {formatMoney(yourShare)}
                  </strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="muted" style={{ display: "block", fontSize: "0.75rem" }}>
                    Parte de {personDisplayName}:
                  </span>
                  <strong style={{ color: "var(--green)", fontSize: "1rem" }}>
                    {formatMoney(debtorShare)}
                  </strong>
                </div>
              </div>

              <p className="muted" style={{ fontSize: "0.8125rem", margin: 0 }}>
                💡 Se creará automáticamente un ingreso por cobro (<strong>DEBT_COLLECTION</strong>)
                vinculado a {personDisplayName} en este periodo presupuestario.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
