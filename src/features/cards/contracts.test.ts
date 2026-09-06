import { describe, expect, it } from "vitest";
import { createCardSchema, statementPreviewSchema, updateCardSchema } from "./contracts";

describe("card contracts", () => {
  it("validates CASH card without cutoff or payment day", () => {
    const result = createCardSchema.safeParse({
      name: "Efectivo Cartera",
      type: "CASH",
      color: "#10b981",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Efectivo Cartera");
      expect(result.data.cutoffDay).toBeUndefined();
      expect(result.data.paymentDueDay).toBeUndefined();
    }
  });

  it("validates DEBIT card with optional last4Digits", () => {
    const result = createCardSchema.safeParse({
      name: "Nómina Santander",
      type: "DEBIT",
      color: "#3b82f6",
      last4Digits: "1234",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.last4Digits).toBe("1234");
    }
  });

  it("rejects CREDIT card if cutoffDay or paymentDueDay are missing", () => {
    const missingCutoff = createCardSchema.safeParse({
      name: "Tarjeta Banorte",
      type: "CREDIT",
      color: "#ef4444",
      paymentDueDay: 5,
    });
    expect(missingCutoff.success).toBe(false);

    const missingPayment = createCardSchema.safeParse({
      name: "Tarjeta Banorte",
      type: "CREDIT",
      color: "#ef4444",
      cutoffDay: 15,
    });
    expect(missingPayment.success).toBe(false);
  });

  it("accepts CREDIT card with valid cutoff and payment days", () => {
    const result = createCardSchema.safeParse({
      name: "Tarjeta BBVA",
      type: "CREDIT",
      color: "#6366f1",
      last4Digits: "9876",
      creditLimit: "15000",
      cutoffDay: "15",
      paymentDueDay: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cutoffDay).toBe(15);
      expect(result.data.paymentDueDay).toBe(5);
      expect(result.data.creditLimit).toBe(15000);
    }
  });

  it("rejects invalid days or malformed last4Digits", () => {
    expect(
      createCardSchema.safeParse({
        name: "Test",
        type: "CREDIT",
        cutoffDay: 32,
        paymentDueDay: 0,
      }).success,
    ).toBe(false);

    expect(
      createCardSchema.safeParse({
        name: "Test",
        type: "DEBIT",
        last4Digits: "123",
      }).success,
    ).toBe(false);

    expect(
      createCardSchema.safeParse({
        name: "Test",
        type: "DEBIT",
        color: "invalid-color",
      }).success,
    ).toBe(false);
  });

  it("validates updateCardSchema partially", () => {
    const result = updateCardSchema.safeParse({
      name: "Nuevo Nombre Tarjeta",
      creditLimit: 25000,
    });
    expect(result.success).toBe(true);
  });

  it("validates statementPreviewSchema", () => {
    const result = statementPreviewSchema.safeParse({
      statementCutoffDate: "2026-09-15",
      paymentDueDate: "2026-10-05",
      impactBudgetYear: 2026,
      impactBudgetMonth: 10,
      daysUntilDue: 29,
    });
    expect(result.success).toBe(true);
  });
});
