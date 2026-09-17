import { describe, expect, it } from "vitest";
import {
  createPersonSchema,
  personSchema,
  debtSummarySchema,
  apiDebtSummarySchema,
  periodDebtsSchema,
  settleDebtSchema,
  updatePersonSchema,
} from "./contracts";

describe("people contracts", () => {
  it("validates valid person with name and optional contact and notes", () => {
    const result = createPersonSchema.safeParse({
      name: "Laura Gómez",
      phone: "5512345678",
      notes: "Amiga de la universidad",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Laura Gómez");
      expect(result.data.phone).toBe("5512345678");
      expect(result.data.notes).toBe("Amiga de la universidad");
    }
  });

  it("normalizes empty string contact and notes to undefined", () => {
    const result = createPersonSchema.safeParse({
      name: "Carlos Ruiz",
      phone: "",
      notes: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
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

  it("accepts nullable optional fields returned by the API", () => {
    expect(personSchema.parse({
      id: "person-1", name: "Laura", phoneCode: null, phone: null,
      email: null, notes: null, isActive: true,
    }).notes).toBeNull();
  });

  it("validates email and omits empty optional creation fields", () => {
    expect(createPersonSchema.safeParse({ name: "Laura", email: "invalid" }).success).toBe(false);
    const body = createPersonSchema.parse({ name: "Laura", phoneCode: " ", phone: "", email: "", notes: " " });
    expect(JSON.parse(JSON.stringify(body))).toEqual({ name: "Laura" });
    expect(updatePersonSchema.parse({ email: "" })).toEqual({ email: null });
  });

  it("validates debtSummarySchema with all sections", () => {
    const result = debtSummarySchema.safeParse({
      totalDebt: 3500.5,
      immediateDueAmount: 1200,
      nextPaymentDueDate: "2026-10-05",
      periods: [
        {
          period: "2026-09",
          year: 2026,
          month: 9,
          periodName: "Septiembre 2026",
          periodId: "p-1",
          totalDebt: 1200,
          msiInstallments: [
            {
              title: "MacBook Pro",
              currentInstallment: 2,
              totalInstallments: 6,
              amount: 1500,
              remainingAmount: 6000,
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
        },
      ],
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

  it("validates and transforms upstream apiDebtSummarySchema V2", () => {
    const parsed = apiDebtSummarySchema.parse({
      personId: "person-99",
      name: "Ilse López",
      totalDebt: 3723.4,
      periods: [
        {
          period: "2026-09",
          year: 2026,
          month: 9,
          periodName: "Septiembre 2026",
          periodId: "p-sept",
          totalDebt: 1193,
          msiInstallments: [
            {
              id: "msi-1",
              title: "Ben & Frank",
              cardName: "Credit Card",
              currentInstallment: 2,
              totalInstallments: 2,
              installmentAmount: 1193,
              remainingAmount: 1193,
              nextDueDate: "2026-09-30",
            },
          ],
          recurringServices: [],
          singleExpenses: [],
        },
        {
          period: "2026-10",
          year: 2026,
          month: 10,
          periodName: "Octubre 2026",
          periodId: null,
          totalDebt: 2530.4,
          msiInstallments: [
            {
              id: "msi-2",
              title: "Macbook Pro de Ilse",
              cardName: "Credit Card",
              currentInstallment: 4,
              totalInstallments: 5,
              installmentAmount: 2530.4,
              remainingAmount: 5060.8,
              nextDueDate: "2026-10-30",
            },
          ],
          recurringServices: [],
          singleExpenses: [],
        },
      ],
    });

    expect(parsed.totalDebt).toBe(3723.4);
    expect(parsed.immediateDueAmount).toBe(1193);
    expect(parsed.nextPaymentDueDate).toBe("2026-09-30");
    expect(parsed.periods).toHaveLength(2);
    expect(parsed.periods[0].msiInstallments[0].amount).toBe(1193);
    expect(parsed.periods[0].msiInstallments[0].paymentDueDate).toBe("2026-09-30");
    expect(parsed.periods[1].periodId).toBeNull();
  });

  it("validates individual periodDebtsSchema", () => {
    const valid = periodDebtsSchema.safeParse({
      period: "2026-09",
      year: 2026,
      month: 9,
      periodName: "Septiembre 2026",
      totalDebt: 500,
      msiInstallments: [],
      recurringServices: [],
      singleExpenses: [],
    });
    expect(valid.success).toBe(true);
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
