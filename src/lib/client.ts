export class ClientError extends Error {
  constructor(message: string, public readonly status: number, public readonly fields?: Record<string, string[]>) { super(message); }
}
export async function clientRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(`/app/bff${path}`, { method: options.method ?? "GET", credentials: "same-origin", cache: "no-store", headers: options.body === undefined ? undefined : { "Content-Type": "application/json" }, body: options.body === undefined ? undefined : JSON.stringify(options.body) }); } catch {
    throw new ClientError("No hay conexión. Si estabas guardando, comprueba el resultado antes de repetir.", 0);
  }
  let data: unknown;
  try { data = await response.json(); } catch { throw new ClientError("No pudimos leer la respuesta del servicio.", response.status); }
  if (!response.ok) {
    const error = data as { message?: string; fields?: Record<string, string[]> };
    // A full navigation discards in-memory financial data when the session expires.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (response.status === 401 && !path.startsWith("/auth/")) window.location.assign("/app/login");
    throw new ClientError(error.message ?? "No pudimos completar la operación.", response.status, error.fields);
  }
  return data as T;
}
