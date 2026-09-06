import { describe, expect, it } from "vitest";
import {
  createExpenseSchema,
  createIncomeSchema,
  calculateSplitBreakdown,
  copyIncomesSchema,
} from "./contracts";

describe("Transactions contracts", () => {
  it("validates valid expense creation", () => {
    const valid = createExpenseSchema.safeParse({
      periodId: "p-2026-09",
      title: "Supermercado Semanal",
      amount: 1450.5,
      category: "FOOD",
      date: "2026-09-05",
      isPaid: true,
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid expense amount and civil date", () => {
    const invalid = createExpenseSchema.safeParse({
      periodId: "p-2026-09",
      title: "Gasto Erróneo",
      amount: -50,
      category: "FOOD",
      date: "2026-02-31", // invalid civil date
    });
    expect(invalid.success).toBe(false);
  });

  it("validates split range: percentage <= 100% and fixed amount <= total", () => {
    const overPercentage = createExpenseSchema.safeParse({
      periodId: "p-2026-09",
      title: "Cena amigos",
      amount: 1000,
      category: "FOOD",
      date: "2026-09-05",
      split: {
        personId: "p-1",
        splitType: "PERCENTAGE",
        splitValue: 120, // invalid > 100
      },
    });
    expect(overPercentage.success).toBe(false);

    const overFixed = createExpenseSchema.safeParse({
      periodId: "p-2026-09",
      title: "Cena amigos",
      amount: 1000,
      category: "FOOD",
      date: "2026-09-05",
      split: {
        personId: "p-1",
        splitType: "FIXED",
        splitValue: 1500, // invalid > 1000
      },
    });
    expect(overFixed.success).toBe(false);

    const validSplit = createExpenseSchema.safeParse({
      periodId: "p-2026-09",
      title: "Cena amigos",
      amount: 1000,
      category: "FOOD",
      date: "2026-09-05",
      split: {
        personId: "p-1",
        splitType: "PERCENTAGE",
        splitValue: 50,
      },
    });
    expect(validSplit.success).toBe(true);
  });

  it("calculates decimal split breakdown accurately with cent rounding", () => {
    // 1000 al 40%
    const res1 = calculateSplitBreakdown(1000, {
      personId: "p-1",
      splitType: "PERCENTAGE",
      splitValue: 40,
    });
    expect(res1.debtorShare).toBe(400);
    expect(res1.yourShare).toBe(600);

    // 100 al 33.33% -> 33.33 y 66.67
    const res2 = calculateSplitBreakdown(100, {
      personId: "p-1",
      splitType: "PERCENTAGE",
      splitValue: 33.33,
    });
    expect(res2.debtorShare).toBe(33.33);
    expect(res2.yourShare).toBe(66.67);
  });

  it("validates income creation and copy schema", () => {
    const validIncome = createIncomeSchema.safeParse({
      periodId: "p-2026-09",
      title: "Quincena 1",
      amount: 15000,
      date: "2026-09-15",
      source: "PAYROLL",
      isReceived: true,
    });
    expect(validIncome.success).toBe(true);

    const validCopy = copyIncomesSchema.safeParse({
      fromPeriodId: "p-2026-08",
      toPeriodId: "p-2026-09",
    });
    expect(validCopy.success).toBe(true);
  });
});
