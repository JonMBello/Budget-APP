"use client";

import { useState } from "react";
import type { TriggerRemindersResult } from "./contracts";

export function TriggerRemindersCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TriggerRemindersResult | null>(null);

  const handleTrigger = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/app/bff/notifications/trigger-reminders", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al ejecutar la evaluación de recordatorios.");
      }

      const data = (await res.json()) as TriggerRemindersResult;
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido al procesar recordatorios.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="dashboard-card" aria-labelledby="trigger-reminders-title">
      <div className="card-header">
        <div>
          <h2 id="trigger-reminders-title" className="card-title">
            Evaluación de Recordatorios (Diagnóstico Manual)
          </h2>
          <p className="card-subtitle">
            Herramienta de soporte para forzar la evaluación inmediata de pagos y cobros próximos a vencer.
          </p>
        </div>
      </div>

      <div className="alert alert-warning" style={{ margin: "1rem 0" }}>
        <p>
          <strong>Horario del servidor:</strong> El backend ejecuta la evaluación automática todos los días
          a las <strong>08:00 (hora del servidor)</strong>, revisando los compromisos con vencimiento
          en la ventana de <strong>0 a 3 días</strong>. Este botón es exclusivamente una herramienta de
          diagnóstico manual y no se ejecuta de forma automática.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {result && (
        <div
          className="alert alert-success"
          role="status"
          style={{ marginBottom: "1rem" }}
          data-testid="trigger-reminders-result"
        >
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
            ✓ Evaluación completada
          </div>
          <div>Recordatorios procesados: {result.remindersProcessed}</div>
          {result.timestamp && (
            <div style={{ fontSize: "0.8125rem", marginTop: "0.25rem", color: "var(--text-muted)" }}>
              Hora de ejecución: {new Date(result.timestamp).toLocaleString("es-MX")}
            </div>
          )}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleTrigger}
          disabled={loading}
          data-testid="trigger-reminders-btn"
        >
          {loading ? "Evaluando compromisos..." : "Ejecutar evaluación de recordatorios ahora"}
        </button>
      </div>
    </section>
  );
}
