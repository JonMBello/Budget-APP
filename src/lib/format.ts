export type Currency = "MXN" | "USD";

export function formatMoney(value: number, currency: Currency = "MXN"): string {
  if (!Number.isFinite(value)) return "No disponible";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function parseAmount(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isSafeInteger(Math.round(amount * 100)) ? amount : null;
}

export function isCivilDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function formatDate(value: string | null): string {
  if (!value || !isCivilDate(value)) return "Sin fecha disponible";
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export function validPeriod(value: string | null): string | null {
  return value && /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value) ? value : null;
}

export function periodHref(path: string, period: string | null): string {
  const safePeriod = validPeriod(period);
  return safePeriod ? `${path}?period=${safePeriod}` : path;
}

export function formatMonth(period: string | null): string {
  const safe = validPeriod(period);
  if (!safe) return "Sin fecha disponible";
  const [year, month] = safe.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 15));
  const text = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
