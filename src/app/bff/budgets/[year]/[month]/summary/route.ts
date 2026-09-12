import { budgetSummarySchema } from "@/features/budgets/contracts";
import { failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ year: string; month: string }> },
) {
  try {
    const { year, month } = await context.params;
    const result = await authenticatedRequest<unknown>(
      `/budgets/${year}/${month}/summary`,
    );
    const summary = budgetSummarySchema.parse(result);
    return privateJson(summary);
  } catch (error) {
    return failure(error);
  }
}
