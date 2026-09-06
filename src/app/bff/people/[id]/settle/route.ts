import { settleDebtSchema } from "@/features/people/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    const { id } = await context.params;
    const raw = await readJson(request);
    const body = settleDebtSchema.parse(raw);
    const result = await authenticatedRequest<unknown>(`/people/${id}/settle`, {
      method: "POST",
      body,
    });
    return privateJson(result);
  } catch (error) {
    return failure(error);
  }
}
