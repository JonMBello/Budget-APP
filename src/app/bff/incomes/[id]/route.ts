import { incomeSchema, updateIncomeSchema } from "@/features/transactions/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await authenticatedRequest<unknown>(`/incomes/${id}`);
    const income = incomeSchema.parse(result);
    return privateJson(income);
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
    const body = updateIncomeSchema.parse(raw);
    const result = await authenticatedRequest<unknown>(`/incomes/${id}`, {
      method: "PATCH",
      body,
    });
    const income = incomeSchema.parse(result);
    return privateJson(income);
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
    const result = await authenticatedRequest<unknown>(`/incomes/${id}`, {
      method: "DELETE",
    });
    return privateJson(result);
  } catch (error) {
    return failure(error);
  }
}
