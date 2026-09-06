import {
  notificationTestInputSchema,
  notificationTestResultSchema,
} from "@/features/notifications/contracts";
import { checkOrigin, failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await request.json().catch(() => ({}));
    const parsed = notificationTestInputSchema.parse(body);
    const result = await authenticatedRequest<unknown>("/notifications/test", {
      method: "POST",
      body: parsed,
    });
    const validated = notificationTestResultSchema.parse(result);
    return privateJson(validated);
  } catch (error) {
    return failure(error);
  }
}
