import "server-only";
import { getServerConfig } from "./config";

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: "upstream" | "network" | "timeout" = "upstream") {
    super(status === 401 ? "Tu sesión terminó. Inicia sesión de nuevo." : status === 400 ? "Revisa los datos e inténtalo de nuevo." : status === 403 ? "Esta acción no está disponible para tu cuenta." : status === 404 ? "No encontramos este registro." : status === 409 ? "El registro ya existe o cambió. Actualiza la página." : status === 429 ? "Hay muchas solicitudes. Espera un momento." : "No pudimos conectar con el servicio. Inténtalo de nuevo.");
  }
}

type ApiOptions = { method?: "GET" | "POST" | "PATCH" | "DELETE"; token?: string; body?: unknown; signal?: AbortSignal };
const publicRoutes = new Set(["/auth/login", "/auth/register", "/auth/refresh", "/health"]);

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  // Server callers supply paths; a browser request must never control the upstream origin.
  if (!/^\/[a-z][a-z0-9/-]*(\?[a-zA-Z0-9_=&%.-]+)?$/.test(path) || path.includes("..")) throw new ApiError(400);
  if (!publicRoutes.has(path.split("?")[0]) && !options.token) throw new ApiError(401);
  const config = getServerConfig();
  const headers: Record<string, string> = { "x-api-key": config.apiKey, Accept: "application/json" };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      method: options.method ?? "GET", headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store", redirect: "error",
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    throw new ApiError(503, timedOut ? "timeout" : "network");
  }
  if (!response.ok) throw new ApiError(response.status);
  if (response.status === 204) return undefined as T;
  try { return await response.json() as T; } catch { throw new ApiError(502); }
}
