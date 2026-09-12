import { z } from "zod";
import { createIncomeSchema, incomeSchema } from "@/features/transactions/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get("periodId");

    const path = periodId
      ? `/incomes?periodId=${encodeURIComponent(periodId)}`
      : "/incomes";

    const result = await authenticatedRequest<unknown[]>(path);
    const incomes = z.array(incomeSchema).parse(result);
    return privateJson(incomes);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await readJson(request);
    const body = createIncomeSchema.parse(raw);
    const result = await authenticatedRequest<unknown>("/incomes", {
      method: "POST",
      body,
    });
    const income = incomeSchema.parse(result);
    return privateJson(income, 201);
  } catch (error) {
    return failure(error);
  }
}
