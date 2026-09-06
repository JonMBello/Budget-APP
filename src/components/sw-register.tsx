"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "test"
    ) {
      return;
    }

    // Register service worker under /app/
    navigator.serviceWorker
      .register("/app/sw.js", { scope: "/app/" })
      .catch((error) => {
        // Silently capture registration error in non-supporting contexts
        if (process.env.NODE_ENV === "development") {
          console.warn("[SW] Registration error:", error);
        }
      });
  }, []);

  return null;
}
