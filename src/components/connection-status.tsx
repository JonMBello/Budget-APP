"use client";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => { window.removeEventListener("online", callback); window.removeEventListener("offline", callback); };
}
export function ConnectionStatus() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  return online ? null : <div className="offline-banner" role="status">Sin conexión. Tus cambios necesitan internet para guardarse.</div>;
}
