"use client";

import { useEffect, useState, useCallback } from "react";

export type PushPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [permission, setPermission] = useState<PushPermissionState>("unsupported");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSupportAndSubscription = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setIsSupported(false);
      setPermission("unsupported");
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/app/");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(Boolean(subscription));
      }
    } catch {
      // Ignore initial subscription probe failure
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void checkSupportAndSubscription();
    });
  }, [checkSupportAndSubscription]);

  const subscribe = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!isSupported) {
        throw new Error("Las notificaciones push no están soportadas en este navegador o contexto.");
      }

      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        throw new Error(
          perm === "denied"
            ? "Permiso denegado. Para recibir avisos, habilita las notificaciones en los ajustes del sistema/navegador."
            : "No se otorgó permiso para notificaciones.",
        );
      }

      // Ensure SW registration is ready
      const registration = await navigator.serviceWorker.ready;

      // Fetch VAPID public key from BFF
      const keyRes = await fetch("/app/bff/notifications/web-push/public-key");
      if (!keyRes.ok) {
        const errJson = await keyRes.json().catch(() => ({}));
        throw new Error(errJson.message || "No se pudo obtener la clave pública del servidor de notificaciones.");
      }
      const keyData = await keyRes.json();
      const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);

      // Subscribe to PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("La suscripción devuelta por el navegador es incompleta.");
      }

      // Register subscription on backend via BFF
      const saveRes = await fetch("/app/bff/notifications/web-push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
          userAgent: navigator.userAgent,
        }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.message || "Error al registrar la suscripción en el servidor.");
      }

      setIsSubscribed(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al activar avisos.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setError(null);
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/app/");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();

          // Inform backend to delete device registration
          await fetch("/app/bff/notifications/web-push/unsubscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint }),
          }).catch(() => {
            // Unsubscription in browser succeeded even if server call has network issue
          });
        }
      }
      setIsSubscribed(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al desactivar avisos.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    isSupported,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
  };
}
