"use client";

import { useState } from "react";
import type {
  NotificationChannel,
  NotificationTestResult,
} from "./contracts";

type NotificationTestCardProps = {
  userEmail: string;
};

export function NotificationTestCard({ userEmail }: NotificationTestCardProps) {
  const [channel, setChannel] = useState<NotificationChannel>("ALL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NotificationTestResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const payload: {
        channel: NotificationChannel;
        title?: string;
        message?: string;
      } = { channel };

      if (title.trim()) payload.title = title.trim();
      if (message.trim()) payload.message = message.trim();

      const res = await fetch("/app/bff/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al enviar la prueba de notificación.");
      }

      const data = (await res.json()) as NotificationTestResult;
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido al realizar la prueba.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="dashboard-card" aria-labelledby="notification-test-title">
      <div className="card-header">
        <div>
          <h2 id="notification-test-title" className="card-title">
            Prueba de Notificaciones y Diagnóstico
          </h2>
          <p className="card-subtitle">
            Comprueba la entrega en tus canales activos. La prueba se envía únicamente a tu correo
            registrado (<strong>{userEmail}</strong>) y a los navegadores autorizados.
          </p>
        </div>
      </div>

      <div className="alert alert-info" style={{ margin: "1rem 0" }}>
        <p>
          <strong>Canales configurados por el servidor:</strong> Los avisos por correo dependen del
          servidor SMTP y los avisos push de las credenciales VAPID del backend. No existen preferencias
          personales ficticias en esta pantalla: lo que ves refleja la conectividad real con los canales
          del servidor.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label htmlFor="test-channel" className="form-label">
            Canal a probar
          </label>
          <select
            id="test-channel"
            className="form-input"
            value={channel}
            onChange={(e) => setChannel(e.target.value as NotificationChannel)}
            disabled={loading}
          >
            <option value="ALL">Todos los canales (Push y Correo)</option>
            <option value="WEB_PUSH">Solo Notificación Web Push</option>
            <option value="EMAIL">Solo Correo Electrónico</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="test-title" className="form-label">
            Título del aviso (opcional)
          </label>
          <input
            id="test-title"
            type="text"
            className="form-input"
            placeholder="Recordatorio de prueba"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="test-message" className="form-label">
            Mensaje del aviso (opcional)
          </label>
          <textarea
            id="test-message"
            className="form-input"
            placeholder="Este es un mensaje de prueba para verificar la entrega de recordatorios."
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={250}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            data-testid="send-test-btn"
          >
            {loading ? "Enviando prueba..." : "Enviar notificación de prueba"}
          </button>
        </div>
      </form>

      {result && (
        <div
          className="notification-results"
          style={{ marginTop: "1.5rem" }}
          data-testid="notification-test-results"
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            Resultado de la prueba ({result.channel})
          </h3>

          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {/* Push result breakdown */}
            {result.pushResult && (
              <div
                className={`result-box ${result.pushResult.sent ? "result-success" : "result-warning"}`}
                data-testid="push-result-box"
              >
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                  🔔 Notificación Push
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Estado: {result.pushResult.sent ? "Enviado con éxito" : "No enviado o no configurado"}
                </div>
                <div style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  Dispositivos destinatarios: {result.pushResult.recipientCount}
                </div>
                {result.pushResult.error && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--danger)", marginTop: "0.25rem" }}>
                    Detalle: {result.pushResult.error}
                  </div>
                )}
              </div>
            )}

            {/* Email result breakdown */}
            {result.emailResult && (
              <div
                className={`result-box ${result.emailResult.sent ? "result-success" : "result-warning"}`}
                data-testid="email-result-box"
              >
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                  ✉️ Correo Electrónico
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  Estado: {result.emailResult.sent ? "Enviado con éxito" : "No enviado o SMTP no disponible"}
                </div>
                {result.emailResult.recipientEmail && (
                  <div style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                    Destinatario: {result.emailResult.recipientEmail}
                  </div>
                )}
                {result.emailResult.error && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--danger)", marginTop: "0.25rem" }}>
                    Detalle: {result.emailResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
