import { cardSchema, updateCardSchema } from "@/features/cards/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await authenticatedRequest<unknown>(`/cards/${id}`);
    const card = cardSchema.parse(result);
    return privateJson(card);
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    const { id } = await context.params;
    const raw = await readJson(request);
    const body = updateCardSchema.parse(raw);
    const result = await authenticatedRequest<unknown>(`/cards/${id}`, {
      method: "PATCH",
      body,
    });
    const card = cardSchema.parse(result);
    return privateJson(card);
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    const { id } = await context.params;
    const result = await authenticatedRequest<unknown>(`/cards/${id}`, {
      method: "DELETE",
    });
    return privateJson(result);
  } catch (error) {
    return failure(error);
  }
}
