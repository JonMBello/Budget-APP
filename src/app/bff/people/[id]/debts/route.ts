import { apiDebtSummarySchema } from "@/features/people/contracts";
import { failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await authenticatedRequest<unknown>(`/people/${id}/debts`);
    const debts = apiDebtSummarySchema.safeParse(result);
    if (!debts.success) {
      return privateJson({ message: "No pudimos consultar las deudas de esta persona. Inténtalo de nuevo." }, 502);
    }
    return privateJson(debts.data);
  } catch (error) {
    return failure(error);
  }
}
