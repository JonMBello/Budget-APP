"use client";

import { personContact } from "@/features/people/contracts";

import { useState } from "react";
import { Field, AmountField, DateField, ErrorState } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { type Person } from "@/features/people/contracts";
import {
  type Income,
  type IncomeSource,
} from "./contracts";
import { INCOME_SOURCE_LABELS } from "./income-card";

export function IncomeForm({
  periodId,
  income,
  people,
  isClosed = false,
  onSuccess,
  onCancel,
}: {
  periodId: string;
  income?: Income | null;
  people: Person[];
  isClosed?: boolean;
  onSuccess: (income: Income) => void;
  onCancel: () => void;
}) {
  const isEditing = Boolean(income);
  const isLinked = Boolean(income?.linkedExpenseId);
  const today = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState(income?.title ?? "");
  const [amount, setAmount] = useState(income ? String(income.amount) : "");
  const [source, setSource] = useState<IncomeSource>(
    income?.source ?? "PAYROLL",
  );
  const [date, setDate] = useState(income?.date ?? today);

  const [isReceived, setIsReceived] = useState(income?.isReceived ?? false);
  const [dueDate, setDueDate] = useState(income?.dueDate ?? "");
  const [debtorPersonId, setDebtorPersonId] = useState(
    income?.debtorPersonId ?? "",
  );
  const [notes, setNotes] = useState(income?.notes ?? "");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isClosed || pending) return;
    setError("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("El importe debe ser un número mayor a cero.");
      return;
    }

    if (!title.trim() || title.trim().length < 2) {
      setError("El título debe tener al menos 2 caracteres.");
      return;
    }

    if (!date) {
      setError("Debes ingresar una fecha válida de ingreso.");
      return;
    }

    setPending(true);

    try {
      const payload = {
        periodId,
        title: title.trim(),
        amount: parsedAmount,
        source,
        date,
        isReceived,
        dueDate: dueDate || null,
        debtorPersonId: source === "DEBT_COLLECTION" ? (debtorPersonId || null) : null,
        notes: notes.trim() || (isEditing ? null : undefined),
      };

      let result: Income;
      if (isEditing && income) {
        result = await clientRequest<Income>(`/incomes/${income.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        result = await clientRequest<Income>("/incomes", {
          method: "POST",
          body: payload,
        });
      }

      onSuccess(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el ingreso. Revisa los datos e intenta nuevamente.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="profile-card transaction-form"
      aria-label={isEditing ? "Editar ingreso" : "Registrar nuevo ingreso"}
    >
      <h2 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>
        {isEditing ? "Editar ingreso" : "Registrar ingreso"}
      </h2>
      <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "20px" }}>
        {isEditing
          ? "Modifica los datos del ingreso registrado en tu presupuesto."
          : "Captura tu sueldo, depósitos, rendimientos o cobranzas recibidas en este mes."}
      </p>

      {isClosed && (
        <div
          style={{
            background: "#262c38",
            border: "1px solid #4a5a70",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "0.875rem",
          }}
        >
          🔒 <strong>Periodo cerrado:</strong> No se pueden registrar ni modificar
          ingresos en un mes cerrado.
        </div>
      )}

      {isLinked && (
        <div
          style={{
            background: "#142638",
            border: "1px solid #234567",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "0.8125rem",
            color: "#93c5fd",
          }}
        >
          ℹ️ <strong>Cobro vinculado:</strong> Este registro proviene de una división
          de gasto. Modificar el título o importe aquí actualizará el registro de cobranza.
        </div>
      )}

      <Field
        label="Título o concepto del ingreso"
        id="income-title"
        name="title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="ej. Sueldo quincenal, Bono, Pago de Juan"
        required
        disabled={isClosed || pending}
      />

      <div className="transaction-form-row">
        <AmountField
          label="Importe ($)"
          id="income-amount"
          name="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={isClosed || pending}
        />

        <div className="field">
          <label htmlFor="income-source">Fuente de ingreso</label>
          <select
            id="income-source"
            name="source"
            value={source}
            onChange={(e) => setSource(e.target.value as IncomeSource)}
            disabled={isClosed || pending || isLinked}
            required
          >
            {Object.entries(INCOME_SOURCE_LABELS).map(([srcKey, meta]) => (
              <option key={srcKey} value={srcKey}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="transaction-form-row">
        <DateField
          label="Fecha de ingreso"
          id="income-date"
          name="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          disabled={isClosed || pending}
        />

        <DateField
          label="Fecha estimada de cobro (opcional)"
          id="income-due-date"
          name="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={isClosed || pending}
        />
      </div>

      {source === "DEBT_COLLECTION" && !isLinked && (
        <div className="field">
          <label htmlFor="income-debtor">Persona que debe pagar (opcional)</label>
          <select
            id="income-debtor"
            name="debtorPersonId"
            value={debtorPersonId}
            onChange={(e) => setDebtorPersonId(e.target.value)}
            disabled={isClosed || pending}
          >
            <option value="">Sin deudor asignado</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {personContact(p) ? `(${personContact(p)})` : ""}
              </option>

            ))}
          </select>
        </div>
      )}

      <div className="field" style={{ margin: "12px 0 16px" }}>
        <label
          htmlFor="income-is-received"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: isClosed ? "not-allowed" : "pointer",
          }}
        >
          <input
            type="checkbox"
            id="income-is-received"
            name="isReceived"
            checked={isReceived}
            onChange={(e) => setIsReceived(e.target.checked)}
            disabled={isClosed || pending}
          />
          <span>Ya ingresado / cobrado en cuenta</span>
        </label>
        <p className="field-hint">
          Marca si ya dispones de este dinero en tu saldo.
        </p>
      </div>

      <div className="field">
        <label htmlFor="income-notes">Notas adicionales (opcional)</label>
        <textarea
          id="income-notes"
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ej. Referencia de transferencia, desglose de impuestos o extras"
          disabled={isClosed || pending}
        />
      </div>

      {error && <ErrorState message={error} />}

      <div className="dialog-actions" style={{ marginTop: "24px" }}>
        <button
          type="button"
          className="button secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="button"
          disabled={isClosed || pending}
        >
          {pending
            ? "Guardando…"
            : isEditing
            ? "Guardar cambios"
            : "Registrar ingreso"}
        </button>
      </div>
    </form>
  );
}
