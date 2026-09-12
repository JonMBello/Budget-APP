import { describe, expect, it } from "vitest";
import {
  budgetPeriodSchema,
  budgetSummarySchema,
  getNextPeriod,
  getPreviousPeriod,
  initializeBudgetSchema,
  parsePeriodKey,
  toPeriodKey,
  updateSavingsSchema,
  updateStatusSchema,
} from "./contracts";

describe("budgets contracts", () => {
  it("validates initializeBudgetSchema with valid and default data", () => {
    const parsed = initializeBudgetSchema.parse({
      year: 2026,
      month: 9,
    });
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(9);
    expect(parsed.carriedSavings).toBe(0);
  });

  it("permits negative carriedSavings for deficit carry-over", () => {
    const parsed = initializeBudgetSchema.parse({
      year: 2026,
      month: 10,
      carriedSavings: -750.5,
      notes: "Déficit del mes anterior",
    });
    expect(parsed.carriedSavings).toBe(-750.5);
    expect(parsed.notes).toBe("Déficit del mes anterior");
  });

  it("rejects invalid month numbers in initializeBudgetSchema", () => {
    expect(() =>
      initializeBudgetSchema.parse({ year: 2026, month: 0 }),
    ).toThrow();
    expect(() =>
      initializeBudgetSchema.parse({ year: 2026, month: 13 }),
    ).toThrow();
    expect(() =>
      initializeBudgetSchema.parse({ year: 1999, month: 5 }),
    ).toThrow();
  });

  it("validates updateSavingsSchema with notes and negative values", () => {
    const valid = updateSavingsSchema.parse({
      carriedSavings: -250,
      notes: "Ajuste por gasto inesperado",
    });
    expect(valid.carriedSavings).toBe(-250);
    expect(valid.notes).toBe("Ajuste por gasto inesperado");
  });

  it("validates updateStatusSchema with OPEN and CLOSED only", () => {
    expect(updateStatusSchema.parse({ status: "OPEN" }).status).toBe("OPEN");
    expect(updateStatusSchema.parse({ status: "CLOSED" }).status).toBe("CLOSED");
    expect(() => updateStatusSchema.parse({ status: "ARCHIVED" })).toThrow();
  });

  it("validates budgetPeriodSchema and budgetSummarySchema", () => {
    const period = budgetPeriodSchema.parse({
      id: "b-2026-09",
      userId: "u-123",
      year: 2026,
      month: 9,
      status: "OPEN",
      carriedSavings: 1500,
      totalIncome: 25000,
      totalExpenses: 18000,
      notes: "Mes de septiembre",
    });
    expect(period.status).toBe("OPEN");

    const summary = budgetSummarySchema.parse({
      year: 2026,
      month: 9,
      totalIncome: 25000,
      totalExpenses: 18000,
      netBalance: 8500,
      carriedSavings: 1500,
    });
    expect(summary.netBalance).toBe(8500);
  });

  it("correctly computes toPeriodKey, parsePeriodKey, and crossover transitions", () => {
    expect(toPeriodKey(2026, 9)).toBe("2026-09");
    expect(toPeriodKey(2026, 12)).toBe("2026-12");

    expect(parsePeriodKey("2026-09")).toEqual({ year: 2026, month: 9 });
    expect(parsePeriodKey("invalid")).toBeNull();

    // December to January rollover
    expect(getNextPeriod(2026, 12)).toEqual({ year: 2027, month: 1 });
    expect(getNextPeriod(2026, 9)).toEqual({ year: 2026, month: 10 });

    // January to December rollback
    expect(getPreviousPeriod(2027, 1)).toEqual({ year: 2026, month: 12 });
    expect(getPreviousPeriod(2026, 10)).toEqual({ year: 2026, month: 9 });
  });
});

it("requires the documented netBalance and preserves zero and negative balances", () => {
  const input = { year: 2026, month: 7, carriedSavings: 100,
    totalIncome: 500, totalExpenses: 900 };
  expect(() => budgetSummarySchema.parse(input)).toThrow();
  expect(budgetSummarySchema.parse({ ...input, netBalance: -300 }).netBalance).toBe(-300);
  expect(budgetSummarySchema.parse({ ...input, netBalance: 0 }).netBalance).toBe(0);
});
