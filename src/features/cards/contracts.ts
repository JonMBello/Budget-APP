import { z } from "zod";

export const cardTypeSchema = z.enum(["CREDIT", "DEBIT", "CASH"]);
export type CardType = z.infer<typeof cardTypeSchema>;

export const createCardSchema = z
  .object({
    name: z.string().trim().min(1, "Escribe el nombre de la tarjeta o cuenta.").max(80),
    type: cardTypeSchema,
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Elige un color hexadecimal válido (ej. #10b981).")
      .default("#10b981"),
    last4Digits: z
      .string()
      .regex(/^\d{4}$/, "Deben ser exactamente 4 dígitos.")
      .optional()
      .or(z.literal(""))
      .transform((val) => val || undefined),
    creditLimit: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
      z.number().min(0, "El límite no puede ser negativo.").optional(),
    ),
    cutoffDay: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
      z.number().int().min(1, "El día debe estar entre 1 y 31.").max(31, "El día debe estar entre 1 y 31.").optional(),
    ),
    paymentDueDay: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
      z.number().int().min(1, "El día debe estar entre 1 y 31.").max(31, "El día debe estar entre 1 y 31.").optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.type === "CREDIT") {
      if (data.cutoffDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El día de corte es obligatorio para tarjetas de crédito.",
          path: ["cutoffDay"],
        });
      }
      if (data.paymentDueDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El día de pago es obligatorio para tarjetas de crédito.",
          path: ["paymentDueDay"],
        });
      }
    }
  });

export const updateCardSchema = z
  .object({
    name: z.string().trim().min(1, "Escribe el nombre de la tarjeta o cuenta.").max(80).optional(),
    type: cardTypeSchema.optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Elige un color hexadecimal válido (ej. #10b981).")
      .optional(),
    last4Digits: z
      .string()
      .regex(/^\d{4}$/, "Deben ser exactamente 4 dígitos.")
      .optional()
      .or(z.literal(""))
      .transform((val) => val || undefined),
    creditLimit: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
      z.number().min(0, "El límite no puede ser negativo.").optional(),
    ),
    cutoffDay: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
      z.number().int().min(1, "El día debe estar entre 1 y 31.").max(31, "El día debe estar entre 1 y 31.").optional(),
    ),
    paymentDueDay: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
      z.number().int().min(1, "El día debe estar entre 1 y 31.").max(31, "El día debe estar entre 1 y 31.").optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.type === "CREDIT") {
      if (data.cutoffDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El día de corte es obligatorio para tarjetas de crédito.",
          path: ["cutoffDay"],
        });
      }
      if (data.paymentDueDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El día de pago es obligatorio para tarjetas de crédito.",
          path: ["paymentDueDay"],
        });
      }
    }
  });

export const cardSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: cardTypeSchema,
  color: z.string(),
  last4Digits: z.string().optional(),
  creditLimit: z.number().optional(),
  cutoffDay: z.number().optional(),
  paymentDueDay: z.number().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Card = z.infer<typeof cardSchema>;

export const statementPreviewSchema = z.object({
  statementCutoffDate: z.string().nullable(),
  paymentDueDate: z.string(),
  impactBudgetYear: z.number().int(),
  impactBudgetMonth: z.number().int(),
  daysUntilDue: z.number().int(),
});

export type StatementPreview = z.infer<typeof statementPreviewSchema>;

export const apiStatementPreviewSchema = statementPreviewSchema
  .omit({ statementCutoffDate: true })
  .extend({ cutoffDate: z.string().nullable() })
  .transform(({ cutoffDate, ...preview }) => ({
    ...preview,
    statementCutoffDate: cutoffDate,
  }));
