import { z } from "zod";

export const createPersonSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede exceder 100 caracteres."),
  contact: z
    .string()
    .trim()
    .max(100, "El contacto no puede exceder 100 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((val) => val || undefined),
  notes: z
    .string()
    .trim()
    .max(500, "Las notas no pueden exceder 500 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((val) => val || undefined),
});

export const updatePersonSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede exceder 100 caracteres.")
    .optional(),
  contact: z
    .string()
    .trim()
    .max(100, "El contacto no puede exceder 100 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((val) => val || undefined),
  notes: z
    .string()
    .trim()
    .max(500, "Las notas no pueden exceder 500 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((val) => val || undefined),
});

export const personSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  contact: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Person = z.infer<typeof personSchema>;

export const msiInstallmentItemSchema = z.object({
  title: z.string(),
  currentInstallment: z.number().int().optional(),
  totalInstallments: z.number().int().optional(),
  amount: z.number(),
  paymentDueDate: z.string().nullable().optional(),
  cardName: z.string().optional(),
});

export const recurringServiceItemSchema = z.object({
  title: z.string(),
  amount: z.number(),
  paymentDueDate: z.string().nullable().optional(),
});

export const singleExpenseItemSchema = z.object({
  expenseId: z.string().min(1),
  title: z.string(),
  amount: z.number(),
  paymentDueDate: z.string().nullable().optional(),
  settled: z.boolean().default(false),
});

export const debtSummarySchema = z.object({
  totalDebt: z.number().default(0),
  immediateDueAmount: z.number().default(0),
  nextPaymentDueDate: z.string().nullable().optional(),
  msiInstallments: z.array(msiInstallmentItemSchema).default([]),
  recurringServices: z.array(recurringServiceItemSchema).default([]),
  singleExpenses: z.array(singleExpenseItemSchema).default([]),
});

export type DebtSummary = z.infer<typeof debtSummarySchema>;

export const settleDebtSchema = z.object({
  expenseId: z.string().min(1, "El ID del gasto es obligatorio."),
  amount: z.number().positive("El monto debe ser mayor a cero.").optional(),
  notes: z.string().trim().max(250).optional(),
});

export type SettleDebtInput = z.infer<typeof settleDebtSchema>;
