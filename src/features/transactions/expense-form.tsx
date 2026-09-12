"use client";

import { useEffect, useState } from "react";
import { Field, AmountField, DateField, ErrorState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { clientRequest } from "@/lib/client";
import { type Card } from "@/features/cards/contracts";
import { type Person } from "@/features/people/contracts";
import {
  type Expense,
  type ExpenseCategory,
  type TransactionSplit,
} from "./contracts";
import { SplitEditor } from "./split-editor";
import { EXPENSE_CATEGORY_LABELS } from "./expense-card";

export function ExpenseForm({
  periodId,
  expense,
  cards,
  people,
  isClosed = false,
  onSuccess,
  onCancel,
}: {
  periodId: string;
  expense?: Expense | null;
  cards: Card[];
  people: Person[];
  isClosed?: boolean;
  onSuccess: (expense: Expense) => void;
  onCancel: () => void;
}) {
  const isEditing = Boolean(expense);
  const today = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(
    expense?.category ?? "REGULAR_EXPENSE",
  );
  const [date, setDate] = useState(expense?.date ?? today);

  const [cardId, setCardId] = useState(expense?.cardId ?? "");
  const [paymentDueDate, setPaymentDueDate] = useState(
    expense?.paymentDueDate ?? "",
  );
  const [isPaid, setIsPaid] = useState(expense?.isPaid ?? false);
  const [split, setSplit] = useState<TransactionSplit | null>(
    expense?.split ?? null,
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");

  const [cardPreview, setCardPreview] = useState<{
    paymentDueDate: string;
    impactBudgetMonth: number;
    impactBudgetYear: number;
  } | null>(null);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const selectedCard = cards.find((c) => c.id === cardId);
  const isCreditCard = selectedCard?.type === "CREDIT";

  function handleCardChange(newCardId: string) {
    setCardId(newCardId);
    if (!newCardId) setCardPreview(null);
  }

  // When credit card and date are selected, fetch preview
  useEffect(() => {
    if (!cardId || !isCreditCard || !date) {
      return;
    }
    let cancelled = false;
    clientRequest<{
      paymentDueDate: string;
      impactBudgetMonth: number;
      impactBudgetYear: number;
    }>(`/cards/${cardId}/preview?date=${encodeURIComponent(date)}`)
      .then((res) => {
        if (!cancelled && res) {
          setCardPreview(res);
          if (!expense) {
            // Only auto-fill if user is creating or hasn't manually altered
            setPaymentDueDate(res.paymentDueDate);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setCardPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [cardId, isCreditCard, date, expense]);


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
      setError("Debes ingresar una fecha válida de gasto.");
      return;
    }

    if (split) {
      if (split.splitType === "PERCENTAGE" && split.splitValue > 100) {
        setError("El porcentaje de división no puede superar el 100%.");
        return;
      }
      if (split.splitType === "FIXED" && split.splitValue > parsedAmount) {
        setError("El monto de división no puede superar el importe total.");
        return;
      }
    }

    setPending(true);

    try {
      const payload = {
        periodId,
        title: title.trim(),
        amount: parsedAmount,
        category,
        date,
        cardId: cardId || null,
        paymentDueDate: paymentDueDate || null,
        isPaid,
        split: split ?? null,
        notes: notes.trim() || (isEditing ? null : undefined),
      };

      let result: Expense;
      if (isEditing && expense) {
        result = await clientRequest<Expense>(`/expenses/${expense.id}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        result = await clientRequest<Expense>("/expenses", {
          method: "POST",
          body: payload,
        });
      }

      onSuccess(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el gasto. Revisa los datos e intenta nuevamente.",
      );
    } finally {
      setPending(false);
    }
  }

  const numericAmount = parseFloat(amount) || 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="profile-card"
      style={{ maxWidth: "640px", margin: "0 auto 32px" }}
      aria-label={isEditing ? "Editar gasto" : "Registrar nuevo gasto"}
    >
      <h2 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>
        {isEditing ? "Editar gasto" : "Registrar gasto"}
      </h2>
      <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "20px" }}>
        {isEditing
          ? "Modifica los detalles del gasto. Si contiene división con un tercero, su saldo por cobrar se actualizará."
          : "Captura una compra, pago de servicio o consumo en este periodo presupuestario."}
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
          gastos en un mes cerrado.
        </div>
      )}

      <Field
        label="Título o concepto del gasto"
        id="expense-title"
        name="title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="ej. Despensa semanal, Cena con amigos, Luz"
        required
        disabled={isClosed || pending}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <AmountField
          label="Importe ($)"
          id="expense-amount"
          name="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={isClosed || pending}
        />

        <div className="field">
          <label htmlFor="expense-category">Categoría</label>
          <select
            id="expense-category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            disabled={isClosed || pending}
            required
          >
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([catKey, meta]) => (
              <option key={catKey} value={catKey}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <DateField
          label="Fecha de la compra"
          id="expense-date"
          name="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          disabled={isClosed || pending}
        />

        <div className="field">
          <label htmlFor="expense-card">Método de pago / Tarjeta</label>
          <select
            id="expense-card"
            name="cardId"
            value={cardId}
            onChange={(e) => handleCardChange(e.target.value)}
            disabled={isClosed || pending}
          >
            <option value="">Efectivo / Sin tarjeta</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === "CREDIT" ? "Crédito" : c.type === "DEBIT" ? "Débito" : "Efectivo"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {cardPreview && (
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
          💳 <strong>Cálculo bancario proyectado:</strong> Fecha límite de pago:{" "}
          <strong>{formatDate(cardPreview.paymentDueDate)}</strong> (Impacta en
          presupuesto {cardPreview.impactBudgetYear}-
          {String(cardPreview.impactBudgetMonth).padStart(2, "0")}).
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <DateField
          label="Fecha de vencimiento (opcional)"
          id="expense-payment-due-date"
          name="paymentDueDate"
          value={paymentDueDate}
          onChange={(e) => setPaymentDueDate(e.target.value)}
          disabled={isClosed || pending}
          hint="Fecha límite para liquidar este cargo."
        />

        <div
          className="field"
          style={{
            justifyContent: "center",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <label
            htmlFor="expense-is-paid"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: isClosed ? "not-allowed" : "pointer",
              margin: 0,
            }}
          >
            <input
              type="checkbox"
              id="expense-is-paid"
              name="isPaid"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              disabled={isClosed || pending}
            />
            <span>Ya pagado al banco / proveedor</span>
          </label>
          <p className="field-hint" style={{ marginTop: "4px" }}>
            Marca si ya realizaste el desembolso real.
          </p>
        </div>
      </div>

      <SplitEditor
        amount={numericAmount}
        split={split}
        people={people}
        onChange={setSplit}
        disabled={isClosed || pending}
      />

      <div className="field">
        <label htmlFor="expense-notes">Notas adicionales (opcional)</label>
        <textarea
          id="expense-notes"
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ej. Ticket #1234, garantía o aclaraciones"
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
            : "Registrar gasto"}
        </button>
      </div>
    </form>
  );
}
