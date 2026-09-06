import { describe, expect, it } from "vitest";
import {
  advanceMsiSchema,
  calculateMsiInstallments,
  createRecurringSchema,
  instantiateRecurringSchema,
  recurringTemplateSchema,
  updateRecurringSchema,
} from "./contracts";

describe("recurring contracts", () => {
  it("validates SERVICE and SUBSCRIPTION creation", () => {
    const valid = createRecurringSchema.parse({
      title: "Internet Fibra",
      category: "SERVICE",
      amount: 650,
      startDate: "2026-01-15",
    });
    expect(valid.title).toBe("Internet Fibra");
    expect(valid.category).toBe("SERVICE");
    expect(valid.amount).toBe(650);

    expect(() =>
      createRecurringSchema.parse({
        title: "A",
        category: "SUBSCRIPTION",
        amount: 199,
        startDate: "2026-01-01",
      }),
    ).toThrow();
  });

  it("validates MSI plan creation and rejects invalid installments or missing total", () => {
    const validMsi = createRecurringSchema.parse({
      title: "Laptop de trabajo",
      category: "MSI",
      amount: 1500,
      totalAmount: 18000,
      totalInstallments: 12,
      currentInstallment: 1,
      startDate: "2026-02-05",
    });
    expect(validMsi.totalInstallments).toBe(12);

    // Rejects totalInstallments < 2
    expect(() =>
      createRecurringSchema.parse({
        title: "Teléfono",
        category: "MSI",
        amount: 1000,
        totalAmount: 1000,
        totalInstallments: 1,
        startDate: "2026-02-05",
      }),
    ).toThrow();

    // Rejects currentInstallment > totalInstallments
    expect(() =>
      createRecurringSchema.parse({
        title: "Cámara",
        category: "MSI",
        amount: 500,
        totalAmount: 6000,
        totalInstallments: 12,
        currentInstallment: 13,
        startDate: "2026-02-05",
      }),
    ).toThrow();
  });

  it("accurately computes regular and final installments with cent rounding (GAP-01)", () => {
    // 1000 / 3 = 333.33 each with 333.34 on the last installment
    const msi3 = calculateMsiInstallments(1000, 3);
    expect(msi3.regularAmount).toBe(333.33);
    expect(msi3.finalInstallmentAmount).toBe(333.34);
    expect(msi3.regularAmount * 2 + msi3.finalInstallmentAmount).toBe(1000);

    // 18000 / 12 = 1500 exactly
    const msi12 = calculateMsiInstallments(18000, 12);
    expect(msi12.regularAmount).toBe(1500);
    expect(msi12.finalInstallmentAmount).toBe(1500);
  });

  it("validates split constraints for percentage and fixed amount", () => {
    // Valid percentage split
    const validPercent = createRecurringSchema.parse({
      title: "Spotify Familiar",
      category: "SUBSCRIPTION",
      amount: 200,
      startDate: "2026-01-01",
      split: { personId: "p-1", splitType: "PERCENTAGE", splitValue: 50 },
    });
    expect(validPercent.split?.splitValue).toBe(50);

    // Rejects percentage > 100
    expect(() =>
      createRecurringSchema.parse({
        title: "Spotify",
        category: "SUBSCRIPTION",
        amount: 200,
        startDate: "2026-01-01",
        split: { personId: "p-1", splitType: "PERCENTAGE", splitValue: 120 },
      }),
    ).toThrow();

    // Rejects fixed split > monthly amount
    expect(() =>
      createRecurringSchema.parse({
        title: "Spotify",
        category: "SUBSCRIPTION",
        amount: 200,
        startDate: "2026-01-01",
        split: { personId: "p-1", splitType: "FIXED", splitValue: 250 },
      }),
    ).toThrow();
  });

  it("validates advanceMsiSchema with installmentsCount or payAll", () => {
    expect(advanceMsiSchema.parse({ installmentsCount: 3 }).installmentsCount).toBe(3);
    expect(advanceMsiSchema.parse({ payAll: true }).payAll).toBe(true);

    // Rejects if neither is specified
    expect(() => advanceMsiSchema.parse({ notes: "Solo nota" })).toThrow();
  });

  it("validates recurringTemplateSchema and updateRecurringSchema", () => {
    const full = recurringTemplateSchema.parse({
      id: "rec-1",
      userId: "u-1",
      title: "Gimnasio",
      category: "SERVICE",
      amount: 800,
      currency: "MXN",
      startDate: "2026-01-01",
      isActive: true,
      isCancelled: false,
    });
    expect(full.title).toBe("Gimnasio");

    const update = updateRecurringSchema.parse({
      amount: 850,
      isActive: false,
    });
    expect(update.amount).toBe(850);
    expect(update.isActive).toBe(false);
  });

  it("validates instantiateRecurringSchema", () => {
    const parsed = instantiateRecurringSchema.parse({ year: 2026, month: 9 });
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(9);

    expect(() => instantiateRecurringSchema.parse({ year: 2026, month: 13 })).toThrow();
  });
});
