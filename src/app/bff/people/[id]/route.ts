import { personSchema, updatePersonSchema } from "@/features/people/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await authenticatedRequest<unknown>(`/people/${id}`);
    const person = personSchema.parse(result);
    return privateJson(person);
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
    const body = updatePersonSchema.parse(raw);
    const result = await authenticatedRequest<unknown>(`/people/${id}`, {
      method: "PATCH",
      body,
    });
    const person = personSchema.parse(result);
    return privateJson(person);
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
    const result = await authenticatedRequest<unknown>(`/people/${id}`, {
      method: "DELETE",
    });
    return privateJson(result);
  } catch (error) {
    return failure(error);
  }
}
