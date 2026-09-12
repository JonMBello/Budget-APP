"use client";

import { usePushSubscription } from "./use-push-subscription";

export function PushSubscriptionCard() {
  const {
    permission,
    isSupported,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
  } = usePushSubscription();

  return (
    <section className="dashboard-card" aria-labelledby="push-settings-title">
      <div className="card-header">
        <div>
          <h2 id="push-settings-title" className="card-title">
            Notificaciones Web Push en este dispositivo
          </h2>
          <p className="card-subtitle">
            Autoriza avisos directos en este navegador para no perderte fechas de vencimiento.
          </p>
        </div>
        <div>
          {isSubscribed ? (
            <span className="badge badge-success" data-testid="push-status-badge">
              ✓ Activo en este dispositivo
            </span>
          ) : (
            <span className="badge badge-neutral" data-testid="push-status-badge">
              Inactivo en este dispositivo
            </span>
          )}
        </div>
      </div>

      <div style={{ margin: "1rem 0" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Las notificaciones push se gestionan por cada navegador y dispositivo de manera
          independiente. Si usas Budget en tu teléfono y en tu computadora, puedes activar los
          avisos en ambos o solo en el que prefieras.
        </p>
      </div>

      {!isSupported && (
        <div className="alert alert-warning" role="alert">
          Tu navegador o entorno actual no soporta la API de notificaciones Web Push. Si estás en un
          iPhone o iPad, asegúrate de haber añadido primero la app a la pantalla de inicio (iOS 16.4+).
        </div>
      )}

      {permission === "denied" && (
        <div className="alert alert-error" role="alert">
          El permiso para enviar notificaciones fue bloqueado o denegado en este navegador. Para
          reactivarlo, debes cambiar los permisos del sitio en los ajustes de tu navegador o sistema
          operativo.
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-actions" style={{ marginTop: "1rem" }}>
        {isSubscribed ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={unsubscribe}
            disabled={loading}
            data-testid="unsubscribe-push-btn"
          >
            {loading ? "Desactivando..." : "Desactivar avisos en este dispositivo"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={subscribe}
            disabled={loading || !isSupported || permission === "denied"}
            data-testid="subscribe-push-btn"
          >
            {loading ? "Solicitando autorización..." : "Activar avisos en este dispositivo"}
          </button>
        )}
      </div>
    </section>
  );
}
