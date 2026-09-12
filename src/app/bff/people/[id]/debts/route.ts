import { debtSummarySchema } from "@/features/people/contracts";
import { failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await authenticatedRequest<unknown>(`/people/${id}/debts`);
    const debts = debtSummarySchema.parse(result);
    return privateJson(debts);
  } catch (error) {
    return failure(error);
  }
}
