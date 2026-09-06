import { profileSchema, userSchema } from "@/features/auth/contracts";
import { ApiError } from "@/lib/server/api";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET() {
  try { return privateJson(userSchema.parse(await authenticatedRequest("/users/me"))); } catch (error) { return failure(error); }
}
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const body = profileSchema.parse(await readJson(request));
    const current = userSchema.parse(await authenticatedRequest("/users/me"));
    if (body.currency && body.currency !== current.currency) {
      const [incomes, expenses, recurring, budgets] = await Promise.all(["/incomes", "/expenses", "/recurring?includeInactive=true", "/budgets"].map((path) => authenticatedRequest<unknown[]>(path)));
      if (![incomes, expenses, recurring, budgets].every(Array.isArray)) throw new ApiError(502);
      if ([incomes, expenses, recurring, budgets].some((items) => items.length > 0)) return privateJson({ message: "La moneda no puede cambiar cuando ya tienes presupuestos o movimientos." }, 409);
    }
    return privateJson(userSchema.parse(await authenticatedRequest("/users/me", { method: "PATCH", body })));
  } catch (error) { return failure(error); }
}
