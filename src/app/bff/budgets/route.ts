import { z } from "zod";
import { budgetPeriodSchema } from "@/features/budgets/contracts";
import { failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET() {
  try {
    const result = await authenticatedRequest<unknown[]>("/budgets");
    const periods = z.array(budgetPeriodSchema).parse(result);
    return privateJson(periods);
  } catch (error) {
    return failure(error);
  }
}
