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
  id: z.string().optional(),
  title: z.string(),
  currentInstallment: z.number().int().optional(),
  totalInstallments: z.number().int().optional(),
  amount: z.number(),
  remainingAmount: z.number().optional(),
  paymentDueDate: z.string().nullable().optional(),
  cardName: z.string().optional(),
});

export type MsiInstallmentItem = z.infer<typeof msiInstallmentItemSchema>;

export const recurringServiceItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  cardName: z.string().optional(),
  amount: z.number(),
  paymentDueDate: z.string().nullable().optional(),
});

export type RecurringServiceItem = z.infer<typeof recurringServiceItemSchema>;

export const singleExpenseItemSchema = z.object({
  expenseId: z.string().min(1),
  title: z.string(),
  cardName: z.string().optional(),
  amount: z.number(),
  date: z.string().optional(),
  paymentDueDate: z.string().nullable().optional(),
  settled: z.boolean().default(false),
});

export type SingleExpenseItem = z.infer<typeof singleExpenseItemSchema>;

export const periodDebtsSchema = z.object({
  period: z.string(),
  year: z.number().int(),
  month: z.number().int(),
  periodName: z.string(),
  periodId: z.string().nullable().optional(),
  totalDebt: z.number().default(0),
  msiInstallments: z.array(msiInstallmentItemSchema).default([]),
  recurringServices: z.array(recurringServiceItemSchema).default([]),
  singleExpenses: z.array(singleExpenseItemSchema).default([]),
});

export type PeriodDebts = z.infer<typeof periodDebtsSchema>;

export const debtSummarySchema = z.object({
  personId: z.string().optional(),
  name: z.string().optional(),
  phoneCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  totalDebt: z.number().default(0),
  immediateDueAmount: z.number().default(0),
  nextPaymentDueDate: z.string().nullable().optional(),
  periods: z.array(periodDebtsSchema).default([]),
  msiInstallments: z.array(msiInstallmentItemSchema).default([]),
  recurringServices: z.array(recurringServiceItemSchema).default([]),
  singleExpenses: z.array(singleExpenseItemSchema).default([]),
});

export type DebtSummary = z.infer<typeof debtSummarySchema>;

const apiMsiItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  cardName: z.string().optional(),
  currentInstallment: z.number().int().optional(),
  totalInstallments: z.number().int().optional(),
  installmentAmount: z.number(),
  remainingAmount: z.number().optional(),
  nextDueDate: z.string().nullable().optional(),
}).transform(({ installmentAmount, nextDueDate, ...item }) => ({
  ...item,
  amount: installmentAmount,
  paymentDueDate: nextDueDate,
}));

const apiRecurringItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  cardName: z.string().optional(),
  amount: z.number(),
  nextDueDate: z.string().nullable().optional(),
}).transform(({ nextDueDate, ...item }) => ({
  ...item,
  paymentDueDate: nextDueDate,
}));

const apiSingleExpenseItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  cardName: z.string().optional(),
  amount: z.number(),
  date: z.string().optional(),
  paymentDueDate: z.string().nullable().optional(),
  isPaid: z.boolean(),
}).transform(({ id, isPaid, ...item }) => ({
  ...item,
  expenseId: id,
  settled: isPaid,
}));

export const apiPeriodDebtsSchema = z.object({
  period: z.string(),
  year: z.number().int(),
  month: z.number().int(),
  periodName: z.string(),
  periodId: z.string().nullable().optional(),
  totalDebt: z.number(),
  msiInstallments: z.array(apiMsiItemSchema).default([]),
  recurringServices: z.array(apiRecurringItemSchema).default([]),
  singleExpenses: z.array(apiSingleExpenseItemSchema).default([]),
});

// The V2 API groups debts by budget periods and provides accumulated total debt.
export const apiDebtSummarySchema = z.object({
  personId: z.string().optional(),
  name: z.string().optional(),
  phoneCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  totalDebt: z.number(),
  periods: z.array(apiPeriodDebtsSchema).default([]),
}).transform((data) => {
  const periods = data.periods;
  const immediateDueAmount = periods[0]?.totalDebt ?? 0;

  const msiInstallments = periods.flatMap((p) => p.msiInstallments);
  const recurringServices = periods.flatMap((p) => p.recurringServices);
  const singleExpenses = periods.flatMap((p) => p.singleExpenses);

  const allDates: string[] = [];
  for (const item of msiInstallments) {
    if (item.paymentDueDate) allDates.push(item.paymentDueDate);
  }
  for (const item of recurringServices) {
    if (item.paymentDueDate) allDates.push(item.paymentDueDate);
  }
  for (const item of singleExpenses) {
    if (!item.settled && item.paymentDueDate) allDates.push(item.paymentDueDate);
  }
  allDates.sort();
  const nextPaymentDueDate = allDates[0] ?? null;

  return {
    ...data,
    immediateDueAmount,
    nextPaymentDueDate,
    periods,
    msiInstallments,
    recurringServices,
    singleExpenses,
  };
});

export const settleDebtSchema = z.object({
  expenseId: z.string().min(1, "El ID del gasto es obligatorio."),
  amount: z.number().positive("El monto debe ser mayor a cero.").optional(),
  notes: z.string().trim().max(250).optional(),
});

export type SettleDebtInput = z.infer<typeof settleDebtSchema>;
