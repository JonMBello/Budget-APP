import { budgetSummarySchema } from "@/features/budgets/contracts";
import { failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET() {
  try {
    const result = await authenticatedRequest<unknown>(
      "/budgets/current/summary",
    );
    const summary = budgetSummarySchema.parse(result);
    return privateJson(summary);
  } catch (error) {
    return failure(error);
  }
}
