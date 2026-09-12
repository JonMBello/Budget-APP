import "server-only";
import { z } from "zod";

const schema = z.object({
  apiUrl: z.url().refine((value) => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash && /\/api\/?$/.test(url.pathname);
  }),
  apiKey: z.string().min(1),
  origin: z.url().refine((value) => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && value === url.origin;
  }),
});

export class ConfigurationError extends Error {
  constructor() { super("La conexión con el servicio no está configurada."); }
}

export function parseServerConfig(env: Record<string, string | undefined>) {
  const parsed = schema.safeParse({ apiUrl: env.BUDGET_APP_API_URL, apiKey: env.BUDGET_APP_API_KEY, origin: env.BUDGET_APP_ORIGIN });
  if (!parsed.success) throw new ConfigurationError();
  if (env.NODE_ENV === "production") {
    const upstream = new URL(parsed.data.apiUrl);
    const origin = new URL(parsed.data.origin);
    const localHosts = ["127.0.0.1", "localhost", "[::1]"];
    if ((upstream.protocol !== "https:" && !localHosts.includes(upstream.hostname)) || (origin.protocol !== "https:" && !localHosts.includes(origin.hostname))) throw new ConfigurationError();
  }
  return { ...parsed.data, apiUrl: parsed.data.apiUrl.replace(/\/$/, "") };
}

export function getServerConfig() { return parseServerConfig(process.env); }
