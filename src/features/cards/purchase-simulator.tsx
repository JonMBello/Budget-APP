"use client";

import { useEffect, useRef, useState } from "react";
import { DateField, ErrorState } from "@/components/ui";
import { clientRequest } from "@/lib/client";
import { formatMonth } from "@/lib/format";
import { type StatementPreview } from "./contracts";

function todayCivilDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PurchaseSimulator({ cardId }: { cardId: string }) {
  const [purchaseDate, setPurchaseDate] = useState<string>(todayCivilDate);
  const [preview, setPreview] = useState<StatementPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!cardId || !purchaseDate) return;
    let ignore = false;
    const currentRequestId = ++requestIdRef.current;

    clientRequest<StatementPreview>(
      `/cards/${cardId}/preview?date=${encodeURIComponent(purchaseDate)}`,
    )
      .then((data) => {
        if (!ignore && currentRequestId === requestIdRef.current) {
          setPreview(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore && currentRequestId === requestIdRef.current) {
          setError(
            err instanceof Error ? err.message : "Error al simular la fecha.",
          );
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [cardId, purchaseDate]);

  const monthFormatted = preview
    ? formatMonth(
        `${preview.impactBudgetYear}-${String(preview.impactBudgetMonth).padStart(2, "0")}`,
      )
    : "";

  return (
    <section className="simulator-box" aria-labelledby="simulator-title">
      <p className="eyebrow" style={{ marginBottom: "8px" }}>
        PLANIFICACIÓN DE COMPRAS
      </p>
      <h2 id="simulator-title" style={{ fontSize: "1.375rem" }}>
        Simulador de fecha de compra
      </h2>
      <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "20px" }}>
        Ingresa la fecha en la que planeas hacer un gasto para calcular en qué corte entra,
        cuándo vence y qué mes del presupuesto impacta.
      </p>

      <div style={{ maxWidth: "260px" }}>
        <DateField
          label="Fecha de la compra"
          value={purchaseDate}
          onChange={(e) => {
            setLoading(true);
            setError("");
            setPurchaseDate(e.target.value);
          }}
        />
      </div>

      {loading && (
        <p className="muted" style={{ fontSize: "0.875rem", marginTop: "12px" }}>
          Calculando ciclo bancario…
        </p>
      )}

      {error && (
        <div style={{ marginTop: "16px" }}>
          <ErrorState message={error} />
        </div>
      )}

      {preview && !loading && (
        <div className="simulator-grid" aria-live="polite">
          <div className="simulator-metric">
            <p className="label">Corte bancario</p>
            <p className="val">{preview.statementCutoffDate}</p>
          </div>

          <div className="simulator-metric">
            <p className="label">Límite de pago</p>
            <p className="val blue">{preview.paymentDueDate}</p>
          </div>

          <div className="simulator-metric">
            <p className="label">Mes presupuestario</p>
            <p className="val green">{monthFormatted}</p>
          </div>

          <div className="simulator-metric">
            <p className="label">Tiempo para pagar</p>
            <p className="val">
              {preview.daysUntilDue}{" "}
              <span style={{ fontSize: "0.875rem", fontWeight: 400 }}>días</span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
