"use client";

import { useState } from "react";
import { z } from "zod";
import { Field, ErrorState } from "@/components/ui";
import { ClientError, clientRequest } from "@/lib/client";
import {
  createCardSchema,
  updateCardSchema,
  type Card,
  type CardType,
} from "./contracts";

export function CardForm({
  card,
  onSuccess,
  onCancel,
}: {
  card?: Card;
  onSuccess?: (card: Card) => void;
  onCancel?: () => void;
}) {
  const [type, setType] = useState<CardType>(card?.type ?? "CREDIT");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});

  const isEditing = Boolean(card);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setMessage("");
    setFields({});

    const formData = new FormData(event.currentTarget);
    const raw = Object.fromEntries(formData);

    const schema = isEditing ? updateCardSchema : createCardSchema;
    const validation = schema.safeParse(raw);

    if (!validation.success) {
      setFields(z.flattenError(validation.error).fieldErrors);
      return;
    }

    setPending(true);
    try {
      const endpoint = isEditing ? `/cards/${card!.id}` : "/cards";
      const method = isEditing ? "PATCH" : "POST";
      const saved = await clientRequest<Card>(endpoint, {
        method,
        body: validation.data,
      });
      if (onSuccess) onSuccess(saved);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No pudimos guardar el método de pago.",
      );
      if (error instanceof ClientError && error.fields) {
        setFields(error.fields);
      }
      setPending(false);
    }
  }

  return (
    <form className="profile-card" onSubmit={submit} noValidate aria-busy={pending}>
      <Field
        label="Nombre de la tarjeta o cuenta"
        name="name"
        defaultValue={card?.name}
        placeholder="ej. Tarjeta Banorte, Nómina, Efectivo"
        required
        maxLength={80}
        error={fields.name?.[0]}
      />

      <div className="field">
        <label htmlFor="card-type">Tipo de cuenta</label>
        <select
          id="card-type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as CardType)}
        >
          <option value="CREDIT">Tarjeta de crédito</option>
          <option value="DEBIT">Cuenta de débito</option>
          <option value="CASH">Efectivo / Cartera</option>
        </select>
        <p className="field-hint">
          Define si la cuenta requiere seguimiento de fechas de corte y pago.
        </p>
      </div>

      <div className="field">
        <label htmlFor="card-color">Color visual</label>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            id="card-color"
            type="color"
            name="color"
            defaultValue={card?.color ?? "#10b981"}
            style={{ width: "60px", height: "48px", padding: "4px" }}
          />
          <span className="muted" style={{ fontSize: "0.875rem" }}>
            Elige un color distintivo para tus listas y reportes.
          </span>
        </div>
      </div>

      <Field
        label="Últimos 4 dígitos (opcional)"
        name="last4Digits"
        type="text"
        inputMode="numeric"
        placeholder="ej. 4589"
        defaultValue={card?.last4Digits ?? ""}
        maxLength={4}
        hint="Nunca te pediremos los 16 dígitos ni el código de seguridad."
        error={fields.last4Digits?.[0]}
      />

      <Field
        label="Límite de crédito o monto inicial (opcional)"
        name="creditLimit"
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        placeholder="0.00"
        defaultValue={card?.creditLimit ?? ""}
        hint="Informativo para tu planeación."
        error={fields.creditLimit?.[0]}
      />

      {type === "CREDIT" && (
        <>
          <Field
            label="Día de corte (1 al 31)"
            name="cutoffDay"
            type="number"
            min={1}
            max={31}
            defaultValue={card?.cutoffDay ?? ""}
            required
            placeholder="ej. 15"
            hint="Día del mes en el que el banco cierra tu periodo."
            error={fields.cutoffDay?.[0]}
          />

          <Field
            label="Día límite de pago (1 al 31)"
            name="paymentDueDay"
            type="number"
            min={1}
            max={31}
            defaultValue={card?.paymentDueDay ?? ""}
            required
            placeholder="ej. 5"
            hint="Día límite del mes para pagar el saldo del corte."
            error={fields.paymentDueDay?.[0]}
          />
        </>
      )}

      {message && (
        <div className="form-message">
          <ErrorState message={message} />
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <button className="button" type="submit" disabled={pending}>
          {pending
            ? "Guardando…"
            : isEditing
              ? "Guardar cambios"
              : "Agregar método de pago"}
        </button>
        {onCancel && (
          <button
            className="button secondary"
            type="button"
            disabled={pending}
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
