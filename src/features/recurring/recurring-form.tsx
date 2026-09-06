"use client";

import { useState } from "react";
import { z } from "zod";
import { Field, AmountField, DateField, ErrorState } from "@/components/ui";
import { ClientError, clientRequest } from "@/lib/client";
import { type Card } from "@/features/cards/contracts";
import { type Person } from "@/features/people/contracts";
import {
  createRecurringSchema,
  updateRecurringSchema,
  calculateMsiInstallments,
  type RecurringTemplate,
  type RecurringCategory,
} from "./contracts";

export function RecurringForm({
  template,
  cards = [],
  people = [],
  onSuccess,
  onCancel,
}: {
  template?: RecurringTemplate;
  cards?: Card[];
  people?: Person[];
  onSuccess?: (saved: RecurringTemplate) => void;
  onCancel?: () => void;
}) {
  const isEditing = Boolean(template);
  const today = new Date().toISOString().slice(0, 10);

  const [category, setCategory] = useState<RecurringCategory>(
    template?.category ?? "SERVICE",
  );
  const [totalAmount, setTotalAmount] = useState<string>(
    template?.totalAmount ? String(template.totalAmount) : "",
  );
  const [totalInstallments, setTotalInstallments] = useState<string>(
    template?.totalInstallments ? String(template.totalInstallments) : "12",
  );
  const [currentInstallment, setCurrentInstallment] = useState<string>(
    template?.currentInstallment ? String(template.currentInstallment) : "1",
  );
  const [amount, setAmount] = useState<string>(
    template?.amount ? String(template.amount) : "",
  );

  // Split state
  const [hasSplit, setHasSplit] = useState<boolean>(Boolean(template?.split));
  const [splitPersonId, setSplitPersonId] = useState<string>(
    template?.split?.personId ?? (people[0]?.id || ""),
  );
  const [splitType, setSplitType] = useState<"PERCENTAGE" | "FIXED">(
    template?.split?.splitType ?? "PERCENTAGE",
  );
  const [splitValue, setSplitValue] = useState<string>(
    template?.split?.splitValue ? String(template.split.splitValue) : "50",
  );

  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});

  // Auto-calculate regular installment for MSI when totalAmount or totalInstallments change
  function handleMsiChange(newTotalStr: string, newInstallmentsStr: string) {
    const totalNum = Number(newTotalStr);
    const instNum = Number(newInstallmentsStr);
    if (totalNum > 0 && instNum >= 2) {
      const { regularAmount } = calculateMsiInstallments(totalNum, instNum);
      setAmount(String(regularAmount));
    }
  }

  // Calculated preview for MSI installments
  const previewCalculation =
    category === "MSI" && Number(totalAmount) > 0 && Number(totalInstallments) >= 2
      ? calculateMsiInstallments(Number(totalAmount), Number(totalInstallments))
      : null;

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setMessage("");
    setFields({});

    const formData = new FormData(event.currentTarget);

    if (isEditing) {
      const rawUpdate: Record<string, unknown> = {
        title: formData.get("title"),
        amount: formData.get("amount") ? Number(formData.get("amount")) : undefined,
        cardId: formData.get("cardId") || undefined,
        notes: formData.get("notes") || undefined,
      };

      if (hasSplit && splitPersonId && splitValue) {
        rawUpdate.split = {
          personId: splitPersonId,
          splitType,
          splitValue: Number(splitValue),
        };
      } else {
        rawUpdate.split = null;
      }

      const validation = updateRecurringSchema.safeParse(rawUpdate);
      if (!validation.success) {
        setFields(z.flattenError(validation.error).fieldErrors);
        return;
      }

      setPending(true);
      try {
        const saved = await clientRequest<RecurringTemplate>(
          `/recurring/${template!.id}`,
          {
            method: "PATCH",
            body: validation.data,
          },
        );
        if (onSuccess) onSuccess(saved);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "No pudimos actualizar el compromiso.",
        );
        if (error instanceof ClientError && error.fields) {
          setFields(error.fields);
        }
        setPending(false);
      }
    } else {
      // Create new recurring
      const rawCreate: Record<string, unknown> = {
        title: formData.get("title"),
        category,
        amount: Number(amount || formData.get("amount")),
        currency: formData.get("currency") || "MXN",
        startDate: formData.get("startDate") || today,
        cardId: formData.get("cardId") || undefined,
        notes: formData.get("notes") || undefined,
      };

      if (category === "MSI") {
        rawCreate.totalAmount = Number(totalAmount);
        rawCreate.totalInstallments = Number(totalInstallments);
        rawCreate.currentInstallment = Number(currentInstallment) || 1;
      }

      if (hasSplit && splitPersonId && splitValue) {
        rawCreate.split = {
          personId: splitPersonId,
          splitType,
          splitValue: Number(splitValue),
        };
      }

      const validation = createRecurringSchema.safeParse(rawCreate);
      if (!validation.success) {
        setFields(z.flattenError(validation.error).fieldErrors);
        return;
      }

      setPending(true);
      try {
        const saved = await clientRequest<RecurringTemplate>("/recurring", {
          method: "POST",
          body: validation.data,
        });
        if (onSuccess) onSuccess(saved);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "No pudimos crear el compromiso recurrente.",
        );
        if (error instanceof ClientError && error.fields) {
          setFields(error.fields);
        }
        setPending(false);
      }
    }
  }

  return (
    <form className="profile-card" onSubmit={submit} noValidate aria-busy={pending}>
      <h2 style={{ fontSize: "1.35rem", marginBottom: "16px" }}>
        {isEditing ? "Editar compromiso recurrente" : "Nuevo compromiso recurrente"}
      </h2>

      <Field
        label="Título del compromiso o servicio"
        name="title"
        defaultValue={template?.title}
        placeholder="ej. Internet Fibra, Spotify, Lavadora MSI"
        required
        maxLength={120}
        error={fields.title?.[0]}
      />

      {!isEditing && (
        <div className="field">
          <label htmlFor="recurring-category">Tipo de compromiso</label>
          <select
            id="recurring-category"
            name="category"
            value={category}
            onChange={(e) => {
              const newCat = e.target.value as RecurringCategory;
              setCategory(newCat);
              if (newCat === "MSI") {
                handleMsiChange(totalAmount, totalInstallments);
              }
            }}
          >
            <option value="SERVICE">Servicio mensual (ej. luz, agua, internet)</option>
            <option value="SUBSCRIPTION">Suscripción digital (ej. streaming, apps)</option>
            <option value="MSI">Meses Sin Intereses (compra a plazos fijos)</option>
            <option value="OTHER_RECURRING">Otro compromiso recurrente</option>
          </select>
          <p className="field-hint">
            Los planes MSI finalizan automáticamente al liquidar todas las cuotas.
          </p>
        </div>
      )}

      {/* MSI-specific fields on creation */}
      {!isEditing && category === "MSI" && (
        <div
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "18px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ fontSize: "1rem", margin: "0 0 14px", color: "var(--text)" }}>
            Configuración del plan MSI
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field
              label="Monto total de la compra"
              name="totalAmount"
              type="number"
              step="0.01"
              value={totalAmount}
              onChange={(e) => {
                setTotalAmount(e.target.value);
                handleMsiChange(e.target.value, totalInstallments);
              }}
              placeholder="12000.00"
              required
              error={fields.totalAmount?.[0]}
            />

            <Field
              label="Plazo total (meses)"
              name="totalInstallments"
              type="number"
              min={2}
              max={72}
              value={totalInstallments}
              onChange={(e) => {
                setTotalInstallments(e.target.value);
                handleMsiChange(totalAmount, e.target.value);
              }}
              placeholder="12"
              required
              error={fields.totalInstallments?.[0]}
            />
          </div>

          <Field
            label="Cuota que se cobrará primero (generalmente 1)"
            name="currentInstallment"
            type="number"
            min={1}
            max={Number(totalInstallments) || 72}
            value={currentInstallment}
            onChange={(e) => setCurrentInstallment(e.target.value)}
            hint="Si ya pagaste cuotas previas en tu tarjeta antes de registrarlo en la app, indica la cuota actual."
            error={fields.currentInstallment?.[0]}
          />

          {previewCalculation && (
            <div
              style={{
                fontSize: "0.8125rem",
                color: "var(--muted)",
                marginTop: "10px",
                padding: "10px 12px",
                background: "var(--background)",
                borderRadius: "8px",
              }}
            >
              <span>Cuota calculada: </span>
              <strong style={{ color: "var(--text)" }}>
                ${previewCalculation.regularAmount.toFixed(2)}
              </strong>
              {previewCalculation.finalInstallmentAmount !==
                previewCalculation.regularAmount && (
                <span>
                  {" "}
                  (ajuste en última cuota: $
                  {previewCalculation.finalInstallmentAmount.toFixed(2)})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px" }}>
        <AmountField
          label={category === "MSI" ? "Monto de cuota mensual" : "Monto mensual estimado"}
          name="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500.00"
          required
          error={fields.amount?.[0]}
        />

        {!isEditing && (
          <div className="field">
            <label htmlFor="recurring-currency">Moneda</label>
            <select id="recurring-currency" name="currency" defaultValue="MXN">
              <option value="MXN">MXN ($)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        )}
      </div>

      {!isEditing && (
        <DateField
          label="Fecha de inicio / primer cargo"
          name="startDate"
          defaultValue={template?.startDate ?? today}
          required
          error={fields.startDate?.[0]}
        />
      )}

      <div className="field">
        <label htmlFor="recurring-card">Tarjeta / Cuenta de cobro (opcional)</label>
        <select
          id="recurring-card"
          name="cardId"
          defaultValue={template?.cardId ?? ""}
        >
          <option value="">Sin tarjeta asociada</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type}) {c.last4Digits ? `•••• ${c.last4Digits}` : ""}
            </option>
          ))}
        </select>
        <p className="field-hint">
          Vincula el cargo con tu tarjeta para seguir fechas de corte y simular pagos.
        </p>
      </div>

      {/* Split section */}
      <div
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "18px",
          marginBottom: "20px",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.9375rem",
          }}
        >
          <input
            type="checkbox"
            checked={hasSplit}
            onChange={(e) => setHasSplit(e.target.checked)}
          />
          Dividir este compromiso con otra persona
        </label>

        {hasSplit && (
          <div style={{ marginTop: "16px", display: "grid", gap: "14px" }}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="split-person">Persona responsable</label>
              <select
                id="split-person"
                value={splitPersonId}
                onChange={(e) => setSplitPersonId(e.target.value)}
              >
                {people.length === 0 ? (
                  <option value="">No tienes personas registradas</option>
                ) : (
                  people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
              {fields["split.personId"] && (
                <p className="field-error">{fields["split.personId"][0]}</p>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: "12px",
              }}
            >
              <div className="field" style={{ margin: 0 }}>
                <label htmlFor="split-type">Tipo de división</label>
                <select
                  id="split-type"
                  value={splitType}
                  onChange={(e) =>
                    setSplitType(e.target.value as "PERCENTAGE" | "FIXED")
                  }
                >
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED">Monto fijo ($)</option>
                </select>
              </div>

              <Field
                label={splitType === "PERCENTAGE" ? "Porcentaje" : "Monto asignado"}
                type="number"
                step="0.01"
                value={splitValue}
                onChange={(e) => setSplitValue(e.target.value)}
                placeholder={splitType === "PERCENTAGE" ? "50" : "200.00"}
                required
                error={fields["split.splitValue"]?.[0]}
              />
            </div>
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="recurring-notes">Notas u observaciones (opcional)</label>
        <textarea
          id="recurring-notes"
          name="notes"
          rows={3}
          defaultValue={template?.notes ?? ""}
          placeholder="ej. Se renueva cada día 15, incluye seguro adicional"
          maxLength={500}
        />
      </div>

      {message && <ErrorState message={message} />}

      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
          marginTop: "24px",
        }}
      >
        {onCancel && (
          <button
            type="button"
            className="button secondary"
            disabled={pending}
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
        <button type="submit" className="button" disabled={pending}>
          {pending
            ? "Guardando…"
            : isEditing
              ? "Actualizar compromiso"
              : "Crear compromiso"}
        </button>
      </div>
    </form>
  );
}
