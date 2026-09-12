import { budgetPeriodSchema, updateSavingsSchema } from "@/features/budgets/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ year: string; month: string }> },
) {
  try {
    checkOrigin(request);
    const { year, month } = await context.params;
    const raw = await readJson(request);
    const body = updateSavingsSchema.parse(raw);
    const result = await authenticatedRequest<unknown>(
      `/budgets/${year}/${month}/savings`,
      {
        method: "PATCH",
        body,
      },
    );
    const period = budgetPeriodSchema.parse(result);
    return privateJson(period);
  } catch (error) {
    return failure(error);
  }
}
