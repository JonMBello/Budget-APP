"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Field, ErrorState } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { clientRequest } from "@/lib/client";
import { type RecurringTemplate } from "./contracts";

export function MsiAdvanceModal({
  open,
  template,
  onClose,
  onSuccess,
}: {
  open: boolean;
  template: RecurringTemplate;
  onClose: () => void;
  onConfirm?: () => void;
  onSuccess: (updated: RecurringTemplate) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  const totalInstallments = template.totalInstallments ?? 1;
  const currentInstallment = template.currentInstallment ?? 1;
  const remainingInstallments = Math.max(0, totalInstallments - currentInstallment);

  const [mode, setMode] = useState<"count" | "all">("count");
  const [installmentsCount, setInstallmentsCount] = useState<string>("1");
  const [notes, setNotes] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Calculate estimated amount to advance
  const countNum = mode === "all" ? remainingInstallments : Number(installmentsCount) || 1;
  const estimatedAmount = countNum * template.amount;

  async function handleAdvance(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError("");

    if (mode === "count") {
      const count = Number(installmentsCount);
      if (!count || count < 1) {
        setError("Indica al menos 1 cuota para adelantar.");
        return;
      }
      if (count > remainingInstallments) {
        setError(`No puedes adelantar más de las ${remainingInstallments} cuotas restantes.`);
        return;
      }
    }

    setPending(true);
    try {
      const body =
        mode === "all"
          ? { payAll: true, notes: notes.trim() || undefined }
          : {
              installmentsCount: Number(installmentsCount),
              notes: notes.trim() || undefined,
            };

      const updated = await clientRequest<RecurringTemplate>(
        `/recurring/${template.id}/advance`,
        {
          method: "POST",
          body,
        },
      );
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos procesar el adelanto del plan MSI.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <dialog
      className="confirm-dialog"
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
      style={{ maxWidth: "520px" }}
    >
      <h2 id={headingId} style={{ fontSize: "1.35rem", marginBottom: "12px" }}>
        Adelantar o liquidar MSI
      </h2>

      <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "16px" }}>
        Plan: <strong style={{ color: "var(--text)" }}>{template.title}</strong> —
        Cuota actual: {currentInstallment} de {totalInstallments} ({remainingInstallments}{" "}
        {remainingInstallments === 1 ? "cuota restante" : "cuotas restantes"}).
      </p>

      {template.split && (
        <div
          style={{
            background: "#2a2215",
            border: "1px solid #78521a",
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "0.8125rem",
            color: "#fde047",
            marginBottom: "16px",
          }}
        >
          ⚠️ <strong>Plan compartido:</strong> Este compromiso está dividido con otra
          persona. Adelantar cuotas o liquidar el saldo afectará la deuda pendiente
          asociada.
        </div>
      )}

      <form onSubmit={handleAdvance}>
        <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="advance-mode"
              checked={mode === "count"}
              onChange={() => setMode("count")}
            />
            <span>Adelantar número de cuotas específicas</span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="advance-mode"
              checked={mode === "all"}
              onChange={() => setMode("all")}
            />
            <span>Liquidar todo el saldo restante por completo</span>
          </label>
        </div>

        {mode === "count" && (
          <div style={{ marginBottom: "16px" }}>
            <Field
              label="Número de cuotas a adelantar"
              type="number"
              min={1}
              max={remainingInstallments}
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
              required
            />
          </div>
        )}

        <div
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "0.875rem",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--muted)" }}>Importe a pagar:</span>
            <strong style={{ color: "var(--text)" }}>
              ~{formatMoney(estimatedAmount, template.currency)}
            </strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "6px",
              fontSize: "0.8125rem",
              color: "var(--muted)",
            }}
          >
            <span>Nueva cuota resultante:</span>
            <span>
              {mode === "all"
                ? `${totalInstallments} de ${totalInstallments} (Finalizado)`
                : `${Math.min(totalInstallments, currentInstallment + countNum)} de ${totalInstallments}`}
            </span>
          </div>
        </div>

        <div className="field" style={{ marginBottom: "16px" }}>
          <label htmlFor="advance-notes">Motivo o notas (opcional)</label>
          <input
            id="advance-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ej. Bonificación recibida, pago directo en app bancaria"
          />
        </div>

        {error && <ErrorState message={error} />}

        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            disabled={pending}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button type="submit" className="button" disabled={pending}>
            {pending ? "Procesando…" : "Confirmar adelanto"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
