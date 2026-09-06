import { triggerRemindersResultSchema } from "@/features/notifications/contracts";
import { checkOrigin, failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const result = await authenticatedRequest<unknown>(
      "/notifications/trigger-reminders",
      {
        method: "POST",
      },
    );
    const validated = triggerRemindersResultSchema.parse(result);
    return privateJson(validated);
  } catch (error) {
    return failure(error);
  }
}
