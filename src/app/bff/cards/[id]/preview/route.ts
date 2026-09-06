import { statementPreviewSchema } from "@/features/cards/contracts";
import { failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const result = await authenticatedRequest<unknown>(
      `/cards/${id}/preview-statement${query}`,
    );
    const preview = statementPreviewSchema.parse(result);
    return privateJson(preview);
  } catch (error) {
    return failure(error);
  }
}
