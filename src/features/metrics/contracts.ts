import { z } from "zod";
import type { Card } from "@/features/cards/contracts";
import type { Person } from "@/features/people/contracts";
import type { Expense, Income } from "@/features/transactions/contracts";

export const payrollSurplusSchema = z.object({
  totalPayrollIncome: z.number().finite().default(0),
  fixedCommitments: z.number().finite().default(0),
  services: z.number().finite().default(0),
  subscriptions: z.number().finite().default(0),
  msi: z.number().finite().default(0),
  initialDiscretionaryPayrollSurplus: z.number().finite().default(0),
  regularExpenses: z.number().finite().default(0),
  remainingDiscretionaryPayrollSurplus: z.number().finite().default(0),
});
export type PayrollSurplus = z.infer<typeof payrollSurplusSchema>;

export const debtorSummarySchema = z.object({
  personId: z.string(),
  name: z.string(),
  amount: z.number().finite(),
  earliestDueDate: z.string().nullable().optional(),
  pendingCount: z.number().int().nonnegative().default(0),
});
export type DebtorSummary = z.infer<typeof debtorSummarySchema>;

export const receivablesSummarySchema = z.object({
  pendingDebtCollections: z.number().finite().default(0),
  debtors: z.array(debtorSummarySchema).default([]),
});
export type ReceivablesSummary = z.infer<typeof receivablesSummarySchema>;

export const cashflowAgendaItemSchema = z.object({
  id: z.string(),
  type: z.enum(["EXPENSE", "INCOME"]),
  title: z.string(),
  amount: z.number().finite(),
  date: z.string(),
  dueDate: z.string().nullable().optional(),
  isPaid: z.boolean().optional(),
  isReceived: z.boolean().optional(),
  cardId: z.string().nullable().optional(),
  cardName: z.string().nullable().optional(),
  debtorPersonId: z.string().nullable().optional(),
  debtorName: z.string().nullable().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
});
export type CashflowAgendaItem = z.infer<typeof cashflowAgendaItemSchema>;

export interface AgendaSections {
  overdue: CashflowAgendaItem[];
  upcoming: CashflowAgendaItem[];
  noDate: CashflowAgendaItem[];
}

export function calculateBalanceMetrics(
  carriedSavings: number,
  incomes: Income[],
  expenses: Expense[],
) {
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalReceivedIncome = incomes
    .filter((i) => i.isReceived)
    .reduce((sum, i) => sum + i.amount, 0);
  const totalPaidExpenses = expenses
    .filter((e) => e.isPaid)
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = carriedSavings + totalIncome - totalExpenses;
  const projectedSavings = netBalance;
  const cashInPocketBalance =
    carriedSavings + totalReceivedIncome - totalPaidExpenses;

  return {
    totalIncome,
    totalExpenses,
    totalReceivedIncome,
    totalPaidExpenses,
    netBalance,
    projectedSavings,
    cashInPocketBalance,
  };
}

export function calculatePayrollSurplus(
  incomes: Income[],
  expenses: Expense[],
): PayrollSurplus {
  const totalPayrollIncome = incomes
    .filter((i) => i.source === "PAYROLL")
    .reduce((sum, i) => sum + i.amount, 0);

  const services = expenses
    .filter((e) => e.category === "SERVICE")
    .reduce((sum, e) => sum + e.amount, 0);

  const subscriptions = expenses
    .filter((e) => e.category === "SUBSCRIPTION")
    .reduce((sum, e) => sum + e.amount, 0);

  const msi = expenses
    .filter((e) => e.category === "MSI")
    .reduce((sum, e) => sum + e.amount, 0);

  const fixedCommitments = services + subscriptions + msi;
  const initialDiscretionaryPayrollSurplus = totalPayrollIncome - fixedCommitments;

  const regularExpenses = expenses
    .filter((e) => e.category === "REGULAR_EXPENSE")
    .reduce((sum, e) => sum + e.amount, 0);

  const remainingDiscretionaryPayrollSurplus =
    initialDiscretionaryPayrollSurplus - regularExpenses;

  return {
    totalPayrollIncome,
    fixedCommitments,
    services,
    subscriptions,
    msi,
    initialDiscretionaryPayrollSurplus,
    regularExpenses,
    remainingDiscretionaryPayrollSurplus,
  };
}

export function calculateReceivables(
  incomes: Income[],
  people: Person[],
): ReceivablesSummary {
  const peopleMap = new Map(people.map((p) => [p.id, p.name]));
  const pendingIncomes = incomes.filter(
    (i) => !i.isReceived && (i.source === "DEBT_COLLECTION" || i.debtorPersonId),
  );

  const pendingDebtCollections = pendingIncomes.reduce(
    (sum, i) => sum + i.amount,
    0,
  );

  const debtorsMap = new Map<string, DebtorSummary>();
  for (const inc of pendingIncomes) {
    const personId = inc.debtorPersonId || "unknown";
    const name = peopleMap.get(personId) || "Persona";
    const dueDate = inc.dueDate || inc.date || null;

    if (!debtorsMap.has(personId)) {
      debtorsMap.set(personId, {
        personId,
        name,
        amount: 0,
        earliestDueDate: dueDate,
        pendingCount: 0,
      });
    }

    const debtor = debtorsMap.get(personId)!;
    debtor.amount += inc.amount;
    debtor.pendingCount += 1;
    if (dueDate && (!debtor.earliestDueDate || dueDate < debtor.earliestDueDate)) {
      debtor.earliestDueDate = dueDate;
    }
  }

  return {
    pendingDebtCollections,
    debtors: Array.from(debtorsMap.values()),
  };
}

export function buildCashflowAgenda(
  expenses: Expense[],
  incomes: Income[],
  people: Person[] = [],
  cards: Card[] = [],
  todayCivilDate?: string,
): AgendaSections {
  const today =
    todayCivilDate || new Date().toISOString().slice(0, 10);
  const peopleMap = new Map(people.map((p) => [p.id, p.name]));
  const cardsMap = new Map(cards.map((c) => [c.id, c.name]));

  const items: CashflowAgendaItem[] = [];

  // Unpaid expenses
  for (const exp of expenses) {
    if (exp.isPaid) continue;
    const dueDate = exp.paymentDueDate ?? null;
    items.push({
      id: exp.id,
      type: "EXPENSE",
      title: exp.title,
      amount: exp.amount,
      date: exp.date,
      dueDate,
      isPaid: false,
      cardId: exp.cardId ?? null,
      cardName: exp.cardId ? cardsMap.get(exp.cardId) ?? "Tarjeta" : null,
      category: exp.category,
    });
  }

  // Unreceived incomes
  for (const inc of incomes) {
    if (inc.isReceived) continue;
    const dueDate = inc.dueDate ?? null;
    items.push({
      id: inc.id,
      type: "INCOME",
      title: inc.title,
      amount: inc.amount,
      date: inc.date,
      dueDate,
      isReceived: false,
      debtorPersonId: inc.debtorPersonId ?? null,
      debtorName: inc.debtorPersonId
        ? peopleMap.get(inc.debtorPersonId) ?? "Persona"
        : null,
      source: inc.source,
    });
  }

  const overdue: CashflowAgendaItem[] = [];
  const upcoming: CashflowAgendaItem[] = [];
  const noDate: CashflowAgendaItem[] = [];

  for (const item of items) {
    if (!item.dueDate) {
      noDate.push(item);
    } else if (item.dueDate < today) {
      overdue.push(item);
    } else {
      upcoming.push(item);
    }
  }

  overdue.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  upcoming.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  return { overdue, upcoming, noDate };
}
