import { budgetPeriodSchema } from "@/features/budgets/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ year: string; month: string }> },
) {
  try {
    const { year, month } = await context.params;
    const result = await authenticatedRequest<unknown>(`/budgets/${year}/${month}`);
    const period = budgetPeriodSchema.parse(result);
    return privateJson(period);
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ year: string; month: string }> },
) {
  try {
    checkOrigin(request);
    const { year, month } = await context.params;
    const raw = await readJson(request);
    const result = await authenticatedRequest<unknown>(`/budgets/${year}/${month}`, {
      method: "PATCH",
      body: raw,
    });
    const period = budgetPeriodSchema.parse(result);
    return privateJson(period);
  } catch (error) {
    return failure(error);
  }
}
