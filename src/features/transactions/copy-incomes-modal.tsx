"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ErrorState } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { type Income } from "./contracts";

export function CopyIncomesModal({
  open,
  currentPeriodId,
  previousPeriodId,
  previousPeriodName,
  onClose,
  onSuccess,
}: {
  open: boolean;
  currentPeriodId: string;
  previousPeriodId: string;
  previousPeriodName: string;
  onClose: () => void;
  onSuccess: (copied: Income[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

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

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError("");
    setPending(true);

    try {
      const result = await clientRequest<{ success?: boolean; items?: Income[] } | Income[]>(
        "/incomes/copy-from-previous-month",
        {
          method: "POST",
          body: {
            fromPeriodId: previousPeriodId,
            toPeriodId: currentPeriodId,
          },
        },
      );
      const items = Array.isArray(result) ? result : result.items ?? [];
      onSuccess(items);
      onClose();
    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron copiar los ingresos del mes anterior.",
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
        Copiar ingresos del mes anterior
      </h2>

      <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "16px" }}>
        Se importarán los ingresos registrados en{" "}
        <strong style={{ color: "var(--text)" }}>{previousPeriodName}</strong> hacia el
        periodo actual.
      </p>

      <div
        style={{
          background: "#142638",
          border: "1px solid #234567",
          borderRadius: "10px",
          padding: "12px 14px",
          fontSize: "0.8125rem",
          color: "#93c5fd",
          marginBottom: "16px",
        }}
      >
        💡 <strong>Reglas de copia inteligente:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "20px" }}>
          <li>
            Las cobranzas de deudas (<strong>DEBT_COLLECTION</strong>) no se
            copian para evitar deudas duplicadas.
          </li>
          <li>
            Las fechas se ajustarán automáticamente a días válidos del mes
            destino (ej. 31 de enero a 28 de febrero).
          </li>
          <li>
            Todos los ingresos copiados se inicializan como <strong>pendientes</strong> de cobro.
          </li>
          <li>
            Los ingresos que ya existan con el mismo concepto no se duplicarán.
          </li>
        </ul>
      </div>

      <form onSubmit={handleConfirm}>
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
            {pending ? "Copiando ingresos…" : "Confirmar y copiar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
