import { advanceMsiSchema, recurringTemplateSchema } from "@/features/recurring/contracts";
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
    const body = advanceMsiSchema.parse(raw);
    const result = await authenticatedRequest<unknown>(`/recurring/${id}/advance`, {
      method: "POST",
      body,
    });
    const template = recurringTemplateSchema.parse(result);
    return privateJson(template);
  } catch (error) {
    return failure(error);
  }
}
