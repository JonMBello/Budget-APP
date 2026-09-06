import { describe, expect, it } from "vitest";
import {
  createPersonSchema,
  debtSummarySchema,
  settleDebtSchema,
  updatePersonSchema,
} from "./contracts";

describe("people contracts", () => {
  it("validates valid person with name and optional contact and notes", () => {
    const result = createPersonSchema.safeParse({
      name: "Laura Gómez",
      contact: "5512345678",
      notes: "Amiga de la universidad",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Laura Gómez");
      expect(result.data.contact).toBe("5512345678");
      expect(result.data.notes).toBe("Amiga de la universidad");
    }
  });

  it("normalizes empty string contact and notes to undefined", () => {
    const result = createPersonSchema.safeParse({
      name: "Carlos Ruiz",
      contact: "",
      notes: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contact).toBeUndefined();
      expect(result.data.notes).toBeUndefined();
    }
  });

  it("rejects names with less than 2 characters", () => {
    expect(createPersonSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(createPersonSchema.safeParse({ name: "" }).success).toBe(false);
    expect(createPersonSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("validates updatePersonSchema partially", () => {
    const result = updatePersonSchema.safeParse({
      notes: "Nueva nota de contacto",
    });
    expect(result.success).toBe(true);
  });

  it("validates debtSummarySchema with all sections", () => {
    const result = debtSummarySchema.safeParse({
      totalDebt: 3500.5,
      immediateDueAmount: 1200,
      nextPaymentDueDate: "2026-10-05",
      msiInstallments: [
        {
          title: "MacBook Pro",
          currentInstallment: 2,
          totalInstallments: 6,
          amount: 1500,
          paymentDueDate: "2026-10-05",
          cardName: "Banorte Platino",
        },
      ],
      recurringServices: [
        {
          title: "Netflix 4K",
          amount: 250,
          paymentDueDate: "2026-10-01",
        },
      ],
      singleExpenses: [
        {
          expenseId: "exp-123",
          title: "Cena de cumpleaños",
          amount: 950,
          paymentDueDate: "2026-09-25",
          settled: false,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("validates settleDebtSchema", () => {
    expect(
      settleDebtSchema.safeParse({
        expenseId: "exp-123",
        amount: 500,
        notes: "Pago por transferencia",
      }).success,
    ).toBe(true);

    expect(settleDebtSchema.safeParse({ expenseId: "" }).success).toBe(false);
  });
});
