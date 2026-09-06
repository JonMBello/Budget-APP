import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, isCivilDate, parseAmount, periodHref } from "./format";

describe("money and dates", () => {
  it("distinguishes missing/nonfinite amounts from a real zero or negative balance", () => {
    expect(formatMoney(NaN)).toBe("No disponible");
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(-1500.5)).toBe("-$1,500.50");
  });
  it.each(["1e3", "", "  ", "-1", "1,000", "12.345", "Infinity", "0x12"])("rejects ambiguous amount %s", (input) => expect(parseAmount(input)).toBeNull());
  it("keeps valid decimal cents and zero", () => { expect(parseAmount(" 12.50 ")).toBe(12.5); expect(parseAmount("0")).toBe(0); });
  it("checks actual calendar dates including leap years", () => {
    expect(isCivilDate("2024-02-29")).toBe(true);
    expect(isCivilDate("2026-02-29")).toBe(false);
    expect(isCivilDate("2026-04-31")).toBe(false);
    expect(isCivilDate("2026-9-01")).toBe(false);
    expect(formatDate("2026-09-01")).toMatch(/^1 sep/);
    expect(formatDate(null)).toBe("Sin fecha disponible");
  });
  it("preserves only validated month context in navigation", () => {
    expect(periodHref("/incomes", "2026-09")).toBe("/incomes?period=2026-09");
    expect(periodHref("/incomes", "2026-13")).toBe("/incomes");
    expect(periodHref("/incomes", "2026-09&userId=other")).toBe("/incomes");
  });
});
