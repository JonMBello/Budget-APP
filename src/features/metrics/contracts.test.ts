import { describe, expect, it } from "vitest";
import type { Card } from "@/features/cards/contracts";
import type { Person } from "@/features/people/contracts";
import type { Expense, Income } from "@/features/transactions/contracts";
import {
  buildCashflowAgenda,
  calculateBalanceMetrics,
  calculatePayrollSurplus,
  calculateReceivables,
  payrollSurplusSchema,
} from "./contracts";

describe("Metrics Contracts & Calculations", () => {
  describe("calculateBalanceMetrics (TICKET-FE-08.1)", () => {
    it("calculates projected savings 3000 and cash in pocket 2500 for the certified test case", () => {
      // Scenario: Ahorro 1000, ingreso total 5000/recibido 2000, gasto total 3000/pagado 500
      const carriedSavings = 1000;
      const incomes: Income[] = [
        {
          id: "inc-1",
          userId: "u-1",
          periodId: "p-1",
          title: "Sueldo recibido",
          amount: 2000,
          date: "2026-09-01",
          source: "PAYROLL",
          isReceived: true,
        },
        {
          id: "inc-2",
          userId: "u-1",
          periodId: "p-1",
          title: "Sueldo pendiente",
          amount: 3000,
          date: "2026-09-15",
          source: "PAYROLL",
          isReceived: false,
        },
      ];

      const expenses: Expense[] = [
        {
          id: "exp-1",
          userId: "u-1",
          periodId: "p-1",
          title: "Servicio pagado",
          amount: 500,
          category: "SERVICE",
          date: "2026-09-02",
          isPaid: true,
        },
        {
          id: "exp-2",
          userId: "u-1",
          periodId: "p-1",
          title: "Compra por pagar",
          amount: 2500,
          category: "REGULAR_EXPENSE",
          date: "2026-09-10",
          isPaid: false,
        },
      ];

      const metrics = calculateBalanceMetrics(carriedSavings, incomes, expenses);

      expect(metrics.totalIncome).toBe(5000);
      expect(metrics.totalReceivedIncome).toBe(2000);
      expect(metrics.totalExpenses).toBe(3000);
      expect(metrics.totalPaidExpenses).toBe(500);
      expect(metrics.projectedSavings).toBe(3000);
      expect(metrics.cashInPocketBalance).toBe(2500);
      expect(metrics.netBalance).toBe(3000);
    });

    it("handles negative balances without masking the negative sign", () => {
      const carriedSavings = 500;
      const incomes: Income[] = [
        {
          id: "inc-1",
          userId: "u-1",
          periodId: "p-1",
          title: "Ingreso",
          amount: 1000,
          date: "2026-09-01",
          source: "OTHER",
          isReceived: false,
        },
      ];
      const expenses: Expense[] = [
        {
          id: "exp-1",
          userId: "u-1",
          periodId: "p-1",
          title: "Renta",
          amount: 2500,
          category: "HOUSING",
          date: "2026-09-01",
          isPaid: true,
        },
      ];

      const metrics = calculateBalanceMetrics(carriedSavings, incomes, expenses);
      expect(metrics.projectedSavings).toBe(-1000); // 500 + 1000 - 2500
      expect(metrics.cashInPocketBalance).toBe(-2000); // 500 + 0 - 2500
    });
  });

  describe("calculatePayrollSurplus (TICKET-FE-08.2)", () => {
    it("calculates fijos 6100, inicial 18900, restante 15900 for the certified test case", () => {
      // Scenario: Nómina 25000, servicios 1500, suscripciones 600, MSI 4000, regulares 3000
      const incomes: Income[] = [
        {
          id: "inc-1",
          userId: "u-1",
          periodId: "p-1",
          title: "Nómina quincenal 1",
          amount: 12500,
          date: "2026-09-15",
          source: "PAYROLL",
          isReceived: false,
        },
        {
          id: "inc-2",
          userId: "u-1",
          periodId: "p-1",
          title: "Nómina quincenal 2",
          amount: 12500,
          date: "2026-09-30",
          source: "PAYROLL",
          isReceived: false,
        },
        {
          id: "inc-3",
          userId: "u-1",
          periodId: "p-1",
          title: "Depósito de un amigo",
          amount: 2000,
          date: "2026-09-05",
          source: "DEPOSIT", // Not payroll
          isReceived: true,
        },
      ];

      const expenses: Expense[] = [
        {
          id: "exp-1",
          userId: "u-1",
          periodId: "p-1",
          title: "Luz e Internet",
          amount: 1500,
          category: "SERVICE",
          date: "2026-09-05",
          isPaid: false,
        },
        {
          id: "exp-2",
          userId: "u-1",
          periodId: "p-1",
          title: "Streaming y música",
          amount: 600,
          category: "SUBSCRIPTION",
          date: "2026-09-08",
          isPaid: false,
        },
        {
          id: "exp-3",
          userId: "u-1",
          periodId: "p-1",
          title: "Laptop MSI",
          amount: 4000,
          category: "MSI",
          date: "2026-09-12",
          isPaid: false,
        },
        {
          id: "exp-4",
          userId: "u-1",
          periodId: "p-1",
          title: "Supermercado regular",
          amount: 3000,
          category: "REGULAR_EXPENSE",
          date: "2026-09-15",
          isPaid: false,
        },
        {
          id: "exp-5",
          userId: "u-1",
          periodId: "p-1",
          title: "Comida en restaurante",
          amount: 1200,
          category: "FOOD", // Variable consumption does NOT reduce payroll surplus
          date: "2026-09-20",
          isPaid: false,
        },
      ];

      const surplus = calculatePayrollSurplus(incomes, expenses);

      expect(surplus.totalPayrollIncome).toBe(25000);
      expect(surplus.services).toBe(1500);
      expect(surplus.subscriptions).toBe(600);
      expect(surplus.msi).toBe(4000);
      expect(surplus.fixedCommitments).toBe(6100);
      expect(surplus.initialDiscretionaryPayrollSurplus).toBe(18900);
      expect(surplus.regularExpenses).toBe(3000);
      expect(surplus.remainingDiscretionaryPayrollSurplus).toBe(15900);

      // Verify schema parsing validates successfully
      expect(payrollSurplusSchema.safeParse(surplus).success).toBe(true);
    });
  });

  describe("calculateReceivables", () => {
    it("groups debtors and computes earliest due date and pending count", () => {
      const people: Person[] = [
        { id: "person-1", name: "Carlos Slim", isActive: true },
        { id: "person-2", name: "Ana Gomez", isActive: true },
      ];

      const incomes: Income[] = [
        {
          id: "inc-1",
          userId: "u-1",
          periodId: "p-1",
          title: "Cena dividida",
          amount: 450,
          date: "2026-09-10",
          dueDate: "2026-09-20",
          source: "DEBT_COLLECTION",
          debtorPersonId: "person-1",
          isReceived: false,
        },
        {
          id: "inc-2",
          userId: "u-1",
          periodId: "p-1",
          title: "Taxi dividido",
          amount: 150,
          date: "2026-09-05",
          dueDate: "2026-09-12",
          source: "DEBT_COLLECTION",
          debtorPersonId: "person-1",
          isReceived: false,
        },
        {
          id: "inc-3",
          userId: "u-1",
          periodId: "p-1",
          title: "Regalo ya cobrado",
          amount: 300,
          date: "2026-09-02",
          source: "DEBT_COLLECTION",
          debtorPersonId: "person-2",
          isReceived: true, // already received!
        },
      ];

      const result = calculateReceivables(incomes, people);
      expect(result.pendingDebtCollections).toBe(600);
      expect(result.debtors).toHaveLength(1);
      expect(result.debtors[0]).toMatchObject({
        personId: "person-1",
        name: "Carlos Slim",
        amount: 600,
        earliestDueDate: "2026-09-12",
        pendingCount: 2,
      });
    });
  });

  describe("buildCashflowAgenda (TICKET-FE-08.3)", () => {
    it("partitions unpaid expenses and uncollected incomes into overdue, upcoming, and noDate", () => {
      const cards: Card[] = [
        {
          id: "card-1",
          name: "BBVA Oro",
          type: "CREDIT",
          color: "#004481",
          isActive: true,
          cutoffDay: 10,
          paymentDueDay: 30,
        },
      ];
      const people: Person[] = [
        { id: "p-1", name: "Lucía", isActive: true },
      ];

      const today = "2026-09-15";

      const expenses: Expense[] = [
        {
          id: "e-overdue",
          userId: "u-1",
          periodId: "p-1",
          title: "Agua vencida",
          amount: 200,
          category: "SERVICE",
          date: "2026-09-01",
          paymentDueDate: "2026-09-10", // overdue (< 2026-09-15)
          isPaid: false,
        },
        {
          id: "e-upcoming",
          userId: "u-1",
          periodId: "p-1",
          title: "Tarjeta crédito BBVA",
          amount: 3500,
          category: "REGULAR_EXPENSE",
          date: "2026-09-05",
          paymentDueDate: "2026-09-30", // upcoming
          cardId: "card-1",
          isPaid: false,
        },
        {
          id: "e-paid",
          userId: "u-1",
          periodId: "p-1",
          title: "Gas pagado",
          amount: 600,
          category: "SERVICE",
          date: "2026-09-02",
          paymentDueDate: "2026-09-14",
          isPaid: true, // Should be excluded
        },
      ];

      const incomes: Income[] = [
        {
          id: "i-upcoming",
          userId: "u-1",
          periodId: "p-1",
          title: "Cobro a Lucía",
          amount: 800,
          date: "2026-09-01",
          dueDate: "2026-09-20", // upcoming
          source: "DEBT_COLLECTION",
          debtorPersonId: "p-1",
          isReceived: false,
        },
        {
          id: "i-nodate",
          userId: "u-1",
          periodId: "p-1",
          title: "Venta garage sin fecha",
          amount: 500,
          date: "2026-09-15",
          source: "OTHER",
          isReceived: false,
        },
      ];

      const agenda = buildCashflowAgenda(expenses, incomes, people, cards, today);

      expect(agenda.overdue).toHaveLength(1);
      expect(agenda.overdue[0].id).toBe("e-overdue");

      expect(agenda.upcoming).toHaveLength(2);
      // Sorted chronologically: 2026-09-20 (Lucía) before 2026-09-30 (BBVA)
      expect(agenda.upcoming[0].id).toBe("i-upcoming");
      expect(agenda.upcoming[0].debtorName).toBe("Lucía");
      expect(agenda.upcoming[1].id).toBe("e-upcoming");
      expect(agenda.upcoming[1].cardName).toBe("BBVA Oro");

      expect(agenda.noDate).toHaveLength(1);
      expect(agenda.noDate[0].id).toBe("i-nodate");
    });
  });
});
