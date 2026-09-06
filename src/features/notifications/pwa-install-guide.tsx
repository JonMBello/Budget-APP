"use client";

import { useEffect, useState } from "react";

export function PwaInstallGuide() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [activePlatform, setActivePlatform] = useState<"ios" | "mac" | "other">("ios");

  useEffect(() => {
    queueMicrotask(() => {
      const isStandaloneMode =
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(display-mode: standalone)").matches) ||
        // @ts-expect-error - navigator.standalone exists on iOS Safari
        window.navigator.standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));

      // Auto-detect platform for default tab
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setActivePlatform("ios");
      } else if (/macintosh|mac os x/.test(userAgent)) {
        setActivePlatform("mac");
      } else {
        setActivePlatform("other");
      }
    });
  }, []);

  return (
    <section className="dashboard-card" aria-labelledby="pwa-install-title">
      <div className="card-header">
        <div>
          <h2 id="pwa-install-title" className="card-title">
            Instalación como App (PWA)
          </h2>
          <p className="card-subtitle">
            Añade Budget a tu dispositivo para acceder rápidamente y habilitar notificaciones push.
          </p>
        </div>
        {isStandalone && (
          <span className="badge badge-success" data-testid="pwa-installed-badge">
            ✓ Instalada en modo App
          </span>
        )}
      </div>

      {isStandalone ? (
        <div className="alert alert-info" style={{ marginTop: "1rem" }}>
          <p>
            Ya estás usando Budget en modo pantalla completa / app instalada. En este modo disfrutas
            de una experiencia más limpia y soporte nativo para avisos.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          <div className="tabs-nav" role="tablist" aria-label="Instrucciones por plataforma">
            <button
              type="button"
              role="tab"
              aria-selected={activePlatform === "ios"}
              className={`tab-btn ${activePlatform === "ios" ? "tab-btn-active" : ""}`}
              onClick={() => setActivePlatform("ios")}
            >
              iPhone / iPad (iOS)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePlatform === "mac"}
              className={`tab-btn ${activePlatform === "mac" ? "tab-btn-active" : ""}`}
              onClick={() => setActivePlatform("mac")}
            >
              Mac (Safari / Dock)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activePlatform === "other"}
              className={`tab-btn ${activePlatform === "other" ? "tab-btn-active" : ""}`}
              onClick={() => setActivePlatform("other")}
            >
              Android / Chrome
            </button>
          </div>

          <div className="tab-content" style={{ marginTop: "1rem" }}>
            {activePlatform === "ios" && (
              <div data-testid="guide-ios" className="step-guide">
                <ol className="steps-list">
                  <li>
                    Abre <strong>Budget</strong> en Safari en tu iPhone o iPad.
                  </li>
                  <li>
                    Toca el botón <strong>Compartir</strong> (el ícono del cuadrado con la flecha hacia arriba en la barra de navegación).
                  </li>
                  <li>
                    Desplázate por el menú y selecciona <strong>Añadir a la pantalla de inicio</strong>.
                  </li>
                  <li>
                    Toca <strong>Añadir</strong> en la esquina superior derecha.
                  </li>
                </ol>
                <p className="hint-text">
                  <em>Nota para iOS 16.4+:</em> Apple requiere añadir la app a la pantalla de inicio para poder autorizar y recibir notificaciones Web Push.
                </p>
              </div>
            )}

            {activePlatform === "mac" && (
              <div data-testid="guide-mac" className="step-guide">
                <ol className="steps-list">
                  <li>
                    Abre <strong>Budget</strong> en Safari en tu Mac (macOS Sonoma o posterior).
                  </li>
                  <li>
                    En la barra de menús superior, haz clic en <strong>Archivo</strong>.
                  </li>
                  <li>
                    Selecciona <strong>Añadir al Dock…</strong> (o usa el botón Compartir y elige <em>Añadir al Dock</em>).
                  </li>
                  <li>
                    Haz clic en <strong>Añadir</strong> para crear el acceso directo en tu Dock.
                  </li>
                </ol>
                <p className="hint-text">
                  La app se abrirá en su propia ventana aislada con soporte para notificaciones del sistema macOS.
                </p>
              </div>
            )}

            {activePlatform === "other" && (
              <div data-testid="guide-other" className="step-guide">
                <ol className="steps-list">
                  <li>
                    Abre <strong>Budget</strong> en Google Chrome, Edge u otro navegador compatible.
                  </li>
                  <li>
                    Toca el menú de tres puntos (o el icono de instalar en la barra de direcciones).
                  </li>
                  <li>
                    Selecciona <strong>Instalar Budget</strong> o <strong>Añadir a la pantalla principal</strong>.
                  </li>
                  <li>
                    Confirma la instalación en el cuadro de diálogo.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
