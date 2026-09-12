import { budgetPeriodSchema } from "@/features/budgets/contracts";
import { failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET() {
  try {
    const result = await authenticatedRequest<unknown>("/budgets/current");
    const period = budgetPeriodSchema.parse(result);
    return privateJson(period);
  } catch (error) {
    return failure(error);
  }
}
