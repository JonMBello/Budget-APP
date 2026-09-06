import { z } from "zod";
import { createExpenseSchema, expenseSchema } from "@/features/transactions/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get("periodId");
    const category = searchParams.get("category");

    const queryParts: string[] = [];
    if (periodId) queryParts.push(`periodId=${encodeURIComponent(periodId)}`);
    if (category) queryParts.push(`category=${encodeURIComponent(category)}`);
    const path = `/expenses${queryParts.length > 0 ? `?${queryParts.join("&")}` : ""}`;

    const result = await authenticatedRequest<unknown[]>(path);
    const expenses = z.array(expenseSchema).parse(result);
    return privateJson(expenses);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await readJson(request);
    const body = createExpenseSchema.parse(raw);
    const result = await authenticatedRequest<unknown>("/expenses", {
      method: "POST",
      body,
    });
    const expense = expenseSchema.parse(result);
    return privateJson(expense, 201);
  } catch (error) {
    return failure(error);
  }
}
