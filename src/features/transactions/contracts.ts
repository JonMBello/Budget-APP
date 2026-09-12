import { z } from "zod";
import { isCivilDate } from "@/lib/format";

export const expenseCategorySchema = z.enum([
  "SERVICE",
  "SUBSCRIPTION",
  "MSI",
  "REGULAR_EXPENSE",
  "FOOD",
  "TRANSPORT",
  "HOUSING",
  "HEALTH",
  "ENTERTAINMENT",
  "SHOPPING",
  "OTHER",
]);
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

export const incomeSourceSchema = z.enum([
  "PAYROLL",
  "DEBT_COLLECTION",
  "DEPOSIT",
  "INVESTMENT",
  "OTHER",
]);
export type IncomeSource = z.infer<typeof incomeSourceSchema>;

export const transactionSplitSchema = z.object({
  personId: z.string().min(1, "Selecciona una persona para dividir el gasto"),
  splitType: z.enum(["PERCENTAGE", "FIXED"]),
  splitValue: z.number().positive("El valor de la división debe ser mayor a cero"),
  isDebtActive: z.boolean().optional().default(true),
});
export type TransactionSplit = z.input<typeof transactionSplitSchema>;


export const expenseSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  periodId: z.string().min(1),
  title: z.string().min(2),
  amount: z.number().positive(),
  category: expenseCategorySchema,
  date: z.string().refine(isCivilDate, "Fecha de gasto inválida (YYYY-MM-DD)"),
  cardId: z.string().nullable().optional(),
  templateId: z.string().nullable().optional(),
  paymentDueDate: z.string().refine(isCivilDate, "Fecha de vencimiento inválida (YYYY-MM-DD)").nullable().optional(),
  isPaid: z.boolean().default(false),
  split: transactionSplitSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Expense = z.infer<typeof expenseSchema>;

export const incomeSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  periodId: z.string().min(1),
  title: z.string().min(2),
  amount: z.number().positive(),
  date: z.string().refine(isCivilDate, "Fecha de ingreso inválida (YYYY-MM-DD)"),
  source: incomeSourceSchema,
  isReceived: z.boolean().default(false),
  dueDate: z.string().refine(isCivilDate, "Fecha de cobro inválida (YYYY-MM-DD)").nullable().optional(),
  debtorPersonId: z.string().nullable().optional(),
  linkedExpenseId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Income = z.infer<typeof incomeSchema>;

export const createExpenseSchema = z
  .object({
    periodId: z.string().min(1, "El periodo presupuestario es obligatorio"),
    title: z.string().trim().min(2, "El título debe tener al menos 2 caracteres").max(100),
    amount: z.number().positive("El importe debe ser mayor a cero"),
    category: expenseCategorySchema,
    date: z.string().refine(isCivilDate, "Fecha de gasto inválida (YYYY-MM-DD)"),
    cardId: z.string().trim().nullable().optional(),
    paymentDueDate: z.string().refine(isCivilDate, "Fecha de vencimiento inválida (YYYY-MM-DD)").nullable().optional(),
    isPaid: z.boolean().optional().default(false),
    split: transactionSplitSchema.nullable().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.split) {
      if (data.split.splitType === "PERCENTAGE" && data.split.splitValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El porcentaje a compartir no puede ser mayor al 100%",
          path: ["split", "splitValue"],
        });
      }
      if (data.split.splitType === "FIXED" && data.split.splitValue > data.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El monto fijo a compartir no puede superar el gasto total",
          path: ["split", "splitValue"],
        });
      }
    }
  });
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z
  .object({
    title: z.string().trim().min(2, "El título debe tener al menos 2 caracteres").max(100).optional(),
    amount: z.number().positive("El importe debe ser mayor a cero").optional(),
    category: expenseCategorySchema.optional(),
    date: z.string().refine(isCivilDate, "Fecha de gasto inválida (YYYY-MM-DD)").optional(),
    cardId: z.string().trim().nullable().optional(),
    paymentDueDate: z.string().refine(isCivilDate, "Fecha de vencimiento inválida (YYYY-MM-DD)").nullable().optional(),
    isPaid: z.boolean().optional(),
    split: transactionSplitSchema.nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.split && data.amount) {
      if (data.split.splitType === "PERCENTAGE" && data.split.splitValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El porcentaje a compartir no puede ser mayor al 100%",
          path: ["split", "splitValue"],
        });
      }
      if (data.split.splitType === "FIXED" && data.split.splitValue > data.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El monto fijo a compartir no puede superar el gasto total",
          path: ["split", "splitValue"],
        });
      }
    }
  });
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const createIncomeSchema = z.object({
  periodId: z.string().min(1, "El periodo presupuestario es obligatorio"),
  title: z.string().trim().min(2, "El título debe tener al menos 2 caracteres").max(100),
  amount: z.number().positive("El importe debe ser mayor a cero"),
  date: z.string().refine(isCivilDate, "Fecha de ingreso inválida (YYYY-MM-DD)"),
  source: incomeSourceSchema,
  isReceived: z.boolean().optional().default(false),
  dueDate: z.string().refine(isCivilDate, "Fecha de cobro inválida (YYYY-MM-DD)").nullable().optional(),
  debtorPersonId: z.string().trim().nullable().optional(),
  notes: z.string().trim().max(500).optional(),
});
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;

export const updateIncomeSchema = z.object({
  title: z.string().trim().min(2, "El título debe tener al menos 2 caracteres").max(100).optional(),
  amount: z.number().positive("El importe debe ser mayor a cero").optional(),
  date: z.string().refine(isCivilDate, "Fecha de ingreso inválida (YYYY-MM-DD)").optional(),
  source: incomeSourceSchema.optional(),
  isReceived: z.boolean().optional(),
  dueDate: z.string().refine(isCivilDate, "Fecha de cobro inválida (YYYY-MM-DD)").nullable().optional(),
  debtorPersonId: z.string().trim().nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;

export const copyIncomesSchema = z.object({
  fromPeriodId: z.string().min(1, "El periodo de origen es requerido"),
  toPeriodId: z.string().min(1, "El periodo de destino es requerido"),
});
export type CopyIncomesInput = z.infer<typeof copyIncomesSchema>;

export function calculateSplitBreakdown(
  totalAmount: number,
  split?: TransactionSplit | null,
): { yourShare: number; debtorShare: number } {
  if (!split || split.splitValue <= 0) {
    return { yourShare: totalAmount, debtorShare: 0 };
  }
  let debtorShare = 0;
  if (split.splitType === "PERCENTAGE") {
    debtorShare = Math.round((totalAmount * (split.splitValue / 100)) * 100) / 100;
  } else {
    debtorShare = Math.min(totalAmount, Number(split.splitValue));
  }
  const yourShare = Number((totalAmount - debtorShare).toFixed(2));
  return { yourShare, debtorShare };
}
