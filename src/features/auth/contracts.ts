import { z } from "zod";

export const loginSchema = z.object({ email: z.email("Escribe un correo válido.").max(254).transform((value) => value.toLowerCase()), password: z.string().min(1, "Escribe tu contraseña.").max(1024) }).strict();
export const registerSchema = loginSchema.extend({ password: z.string().min(8, "Usa al menos 8 caracteres.").max(1024), name: z.string().trim().min(2, "Escribe tu nombre.").max(120), inviteCode: z.string().min(1, "Escribe tu código de invitación.").max(256), currency: z.enum(["MXN", "USD"]).default("MXN") }).strict();
export const profileSchema = z.object({ name: z.string().trim().min(2, "Usa al menos 2 caracteres.").max(120), currency: z.enum(["MXN", "USD"]).optional() }).strict();
export const userSchema = z.object({ id: z.string().min(1), email: z.email(), name: z.string(), currency: z.enum(["MXN", "USD"]), createdAt: z.string().optional() });
export const authResponseSchema = z.object({ accessToken: z.string().min(1), refreshToken: z.string().min(1), user: userSchema });
export type User = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !/^\/app(?:\/[a-z0-9/-]*)?(?:\?[a-zA-Z0-9_=&%.-]*)?$/.test(value) || value.includes("..") || /\/app\/(login|register|bff)(\/|\?|$)/.test(value)) return "/app";
  return value;
}
