import { recurringTemplateSchema } from "@/features/recurring/contracts";
import { checkOrigin, failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    const { id } = await context.params;
    const result = await authenticatedRequest<unknown>(`/recurring/${id}/cancel`, {
      method: "PATCH",
    });
    const template = recurringTemplateSchema.parse(result);
    return privateJson(template);
  } catch (error) {
    return failure(error);
  }
}
