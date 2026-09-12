import { z } from "zod";
import { isCivilDate } from "@/lib/format";

export const recurringCategorySchema = z.enum([
  "SERVICE",
  "SUBSCRIPTION",
  "MSI",
  "OTHER_RECURRING",
]);
export type RecurringCategory = z.infer<typeof recurringCategorySchema>;

export const recurringSplitSchema = z.object({
  personId: z.string().min(1, "Selecciona una persona para compartir el compromiso"),
  splitType: z.enum(["PERCENTAGE", "FIXED"]),
  splitValue: z.number().positive("El valor de la división debe ser mayor a cero"),
});
export type RecurringSplit = z.infer<typeof recurringSplitSchema>;

export const recurringTemplateSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(2),
  category: recurringCategorySchema,
  amount: z.number().positive(),
  currency: z.enum(["MXN", "USD"]).default("MXN"),
  exchangeRate: z.number().positive().optional(),
  totalAmount: z.number().positive().nullable().optional(),
  totalInstallments: z.number().int().min(2).nullable().optional(),
  currentInstallment: z.number().int().min(1).nullable().optional(),
  startDate: z.string().refine(isCivilDate, "Fecha de inicio inválida (YYYY-MM-DD)").nullable().optional(),
  cardId: z.string().nullable().optional(),
  split: recurringSplitSchema.nullable().optional(),
  isActive: z.boolean(),
  isCancelled: z.boolean().optional().default(false),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type RecurringTemplate = z.infer<typeof recurringTemplateSchema>;

export const createRecurringSchema = z
  .object({
    title: z.string().trim().min(2, "El título debe tener al menos 2 caracteres"),
    category: recurringCategorySchema,
    amount: z.number().positive("El importe debe ser mayor a cero"),
    currency: z.enum(["MXN", "USD"]).default("MXN"),
    exchangeRate: z.number().positive().optional(),
    totalAmount: z.number().positive().optional(),
    totalInstallments: z.number().int().optional(),
    currentInstallment: z.number().int().min(1).optional().default(1),
    startDate: z.string().refine(isCivilDate, "Fecha de inicio inválida (YYYY-MM-DD)"),
    cardId: z.string().trim().nullable().optional(),
    split: recurringSplitSchema.nullable().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category === "MSI") {
      if (!data.totalInstallments || data.totalInstallments < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Un plan a Meses Sin Intereses debe tener un plazo de al menos 2 cuotas",
          path: ["totalInstallments"],
        });
      }
      if (!data.totalAmount || data.totalAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ingresa el importe total de la compra para el plan de MSI",
          path: ["totalAmount"],
        });
      }
      if (
        data.totalInstallments &&
        data.currentInstallment &&
        data.currentInstallment > data.totalInstallments
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La cuota inicial no puede ser mayor al plazo total de cuotas",
          path: ["currentInstallment"],
        });
      }
    }

    if (data.split) {
      if (data.split.splitType === "PERCENTAGE" && data.split.splitValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El porcentaje no puede ser mayor al 100%",
          path: ["split", "splitValue"],
        });
      }
      if (data.split.splitType === "FIXED" && data.split.splitValue > data.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El monto fijo asignado no puede superar el costo mensual del compromiso",
          path: ["split", "splitValue"],
        });
      }
    }
  });
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;

export const updateRecurringSchema = z
  .object({
    title: z.string().trim().min(2, "El título debe tener al menos 2 caracteres").optional(),
    amount: z.number().positive("El importe debe ser mayor a cero").optional(),
    cardId: z.string().trim().nullable().optional(),
    split: recurringSplitSchema.nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.split && data.amount) {
      if (data.split.splitType === "PERCENTAGE" && data.split.splitValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El porcentaje no puede ser mayor al 100%",
          path: ["split", "splitValue"],
        });
      }
      if (data.split.splitType === "FIXED" && data.split.splitValue > data.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El monto fijo no puede superar el importe",
          path: ["split", "splitValue"],
        });
      }
    }
  });
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;

export const advanceMsiSchema = z
  .object({
    installmentsCount: z.number().int().min(1, "Debe ser al menos 1 cuota").optional(),
    payAll: z.boolean().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.payAll || (data.installmentsCount && data.installmentsCount >= 1), {
    message: "Debes especificar las cuotas a adelantar o marcar liquidar saldo restante.",
  });
export type AdvanceMsiInput = z.infer<typeof advanceMsiSchema>;

export const instantiateRecurringSchema = z.object({
  periodId: z.string().trim().min(1, "Selecciona un periodo presupuestario."),
});

export const instantiateRecurringResultSchema = z.object({
  periodId: z.string().min(1),
  createdCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});
export type InstantiateRecurringInput = z.infer<typeof instantiateRecurringSchema>;

export function calculateMsiInstallments(
  totalAmount: number,
  totalInstallments: number,
): { regularAmount: number; finalInstallmentAmount: number } {
  if (totalInstallments <= 0) return { regularAmount: totalAmount, finalInstallmentAmount: totalAmount };
  const regular = Math.floor((totalAmount / totalInstallments) * 100) / 100;
  const final = Number((totalAmount - regular * (totalInstallments - 1)).toFixed(2));
  return { regularAmount: regular, finalInstallmentAmount: final };
}
