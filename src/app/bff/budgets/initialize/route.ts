import { budgetPeriodSchema, initializeBudgetSchema } from "@/features/budgets/contracts";
import { ApiError } from "@/lib/server/api";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await readJson(request);
    const body = initializeBudgetSchema.parse(raw);

    try {
      const result = await authenticatedRequest<unknown>("/budgets/initialize", {
        method: "POST",
        body,
      });
      const period = budgetPeriodSchema.parse(result);
      return privateJson(period, 201);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // HU-FE-05.1: 409 reuses existing period and does not repeat initialization
        const existing = await authenticatedRequest<unknown>(
          `/budgets/${body.year}/${body.month}`,
        );
        const period = budgetPeriodSchema.parse(existing);
        return privateJson(period, 200);
      }
      throw err;
    }
  } catch (error) {
    return failure(error);
  }
}
