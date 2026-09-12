// Service Worker for Budget-APP
const CACHE_NAME = "budget-app-v1";

// Static assets safe to cache (no private financial data)
const STATIC_ASSETS = [
  "/app/icon-192.png",
  "/app/icon-512.png",
  "/app/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Tolerant if some assets fail during install
      });
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never intercept non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Never cache API routes, BFF routes, or Next.js RSC requests
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/app/bff/") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }

  // Network-first strategy for all navigations and assets
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache valid static asset responses (images, fonts, css, js)
        if (
          response.ok &&
          request.destination &&
          ["style", "script", "image", "font"].includes(request.destination)
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        // Check cache on network failure
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        // For navigation requests when offline, return fallback response
        if (request.mode === "navigate") {
          return new Response(
            `<!DOCTYPE html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión · Budget</title><style>body{background:#0b1220;color:#f8fafc;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:1rem;text-align:center}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#94a3b8;max-width:24rem;line-height:1.5}a{color:#38bdf8;text-decoration:none}</style></head><body><div><h1>Sin conexión a internet</h1><p>Budget requiere conexión activa para proteger y sincronizar tus finanzas de manera segura.</p><p><a href="/app/">Reintentar conexión</a></p></div></body></html>`,
            {
              headers: { "Content-Type": "text/html; charset=utf-8" },
              status: 200,
            },
          );
        }

        return new Response("Offline", { status: 503, statusText: "Offline" });
      }),
  );
});

// Push notification handling
self.addEventListener("push", (event) => {
  let data = {
    title: "Budget",
    body: "Tienes un recordatorio financiero pendiente.",
    url: "/app/",
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = {
        title: json.title || data.title,
        body: json.message || json.body || data.body,
        url: json.url || data.url,
      };
    } catch {
      const text = event.data.text();
      if (text) {
        data.body = text;
      }
    }
  }

  // Ensure URL is within /app/ scope
  let validUrl = "/app/";
  try {
    const parsed = new URL(data.url, self.location.origin);
    if (parsed.pathname.startsWith("/app")) {
      validUrl = parsed.pathname + parsed.search;
    }
  } catch {
    validUrl = "/app/";
  }

  const options = {
    body: data.body,
    icon: "/app/icon-192.png",
    badge: "/app/icon-192.png",
    data: { url: validUrl },
    tag: "budget-reminder",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Push notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  let targetUrl = "/app/";
  if (event.notification.data && event.notification.data.url) {
    try {
      const parsed = new URL(event.notification.data.url, self.location.origin);
      if (parsed.pathname.startsWith("/app")) {
        targetUrl = parsed.pathname + parsed.search;
      }
    } catch {
      targetUrl = "/app/";
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes("/app") && "focus" in client) {
          if ("navigate" in client && targetUrl !== "/app/") {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
