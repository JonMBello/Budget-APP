import { z } from "zod";

const optionalText = z.string().trim().optional().transform((value) => value || undefined);
const optionalEmail = z.union([z.email("Ingresa un correo válido."), z.literal("")]).optional();
const personFields = {
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
  phoneCode: optionalText,
  phone: optionalText,
  email: z.string().trim().optional().pipe(optionalEmail).transform((value) => value || undefined),
  notes: optionalText,
};

export const createPersonSchema = z.object(personFields);

export const updatePersonSchema = z.object({
  name: personFields.name.optional(),
  phoneCode: z.string().trim().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  email: z.string().trim().pipe(z.union([z.email("Ingresa un correo válido."), z.literal("")])).nullable().optional()
    .transform((value) => value === "" ? null : value),
  notes: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const personSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  phoneCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Person = z.infer<typeof personSchema>;

export function personContact(person: Person): string {
  return [ [person.phoneCode, person.phone].filter(Boolean).join(" "), person.email ]
    .filter(Boolean).join(" · ");
}

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
