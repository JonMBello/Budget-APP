import "server-only";
import { z } from "zod";
import { ApiError } from "./api";
import { ConfigurationError, getServerConfig } from "./config";

export function privateJson(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" } }); }
export function failure(error: unknown): Response {
  if (error instanceof z.ZodError) return privateJson({ message: "Revisa los datos del formulario.", fields: z.flattenError(error).fieldErrors }, 400);
  if (error instanceof ApiError) return privateJson({ message: error.message, code: error.code }, error.status >= 500 ? 503 : error.status);
  if (error instanceof ConfigurationError) return privateJson({ message: "El servicio no está disponible por el momento." }, 503);
  return privateJson({ message: "No pudimos completar la operación. Inténtalo de nuevo." }, 503);
}
export function checkOrigin(request: Request) {
  const { origin } = getServerConfig();
  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403);
}
export async function readJson(request: Request, maximum = 8192): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(400);
  if (Number(request.headers.get("content-length")) > maximum) throw new ApiError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400);
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > maximum) { await reader.cancel(); throw new ApiError(413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new ApiError(400); }
}
