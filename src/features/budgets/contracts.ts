import { z } from "zod";

export const budgetStatusSchema = z.enum(["OPEN", "CLOSED"]);
export type BudgetStatus = z.infer<typeof budgetStatusSchema>;

export const budgetPeriodSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  status: budgetStatusSchema,
  carriedSavings: z.number().finite(),
  totalIncome: z.number().finite(),
  totalExpenses: z.number().finite(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type BudgetPeriod = z.infer<typeof budgetPeriodSchema>;

export const initializeBudgetSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  carriedSavings: z.number().finite().optional().default(0),
  totalIncome: z.number().finite().optional(),
  totalExpenses: z.number().finite().optional(),
  notes: z.string().trim().max(500).optional(),
});
export type InitializeBudgetInput = z.infer<typeof initializeBudgetSchema>;

export const updateSavingsSchema = z.object({
  carriedSavings: z.number().finite(),
  notes: z.string().trim().max(500).optional(),
});
export type UpdateSavingsInput = z.infer<typeof updateSavingsSchema>;

export const updateStatusSchema = z.object({
  status: budgetStatusSchema,
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const budgetSummarySchema = z.object({
  periodId: z.string().optional(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  status: budgetStatusSchema.optional().default("OPEN"),
  totalIncome: z.number().finite().default(0),
  totalExpenses: z.number().finite().default(0),
  netBalance: z.number().finite().default(0),
  carriedSavings: z.number().finite().default(0),
  projectedSavings: z.number().finite().default(0),
  cashInPocketBalance: z.number().finite().optional(),
  totalExpectedIncome: z.number().finite().optional(),
  totalReceivedIncome: z.number().finite().optional(),
  totalCommittedExpenses: z.number().finite().optional(),
  totalPaidExpenses: z.number().finite().optional(),
  pendingDebtAmount: z.number().finite().optional(),
  hasPendingTransactions: z.boolean().optional(),
});
export type BudgetSummary = z.infer<typeof budgetSummarySchema>;

export function toPeriodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parsePeriodKey(key: string): { year: number; month: number } | null {
  const match = key.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function getNextPeriod(year: number, month: number): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

export function getPreviousPeriod(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}
