import { copyIncomesSchema } from "@/features/transactions/contracts";
import { checkOrigin, failure, privateJson, readJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await readJson(request);
    const body = copyIncomesSchema.parse(raw);
    const result = await authenticatedRequest<unknown>(
      "/incomes/copy-from-previous-month",
      {
        method: "POST",
        body,
      },
    );
    return privateJson(result);
  } catch (error) {
    return failure(error);
  }
}
