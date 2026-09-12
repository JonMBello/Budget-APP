import { webPushUnsubscribeInputSchema } from "@/features/notifications/contracts";
import { checkOrigin, failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    const body = await request.json().catch(() => ({}));
    const parsed = webPushUnsubscribeInputSchema.parse(body);
    const result = await authenticatedRequest<unknown>(
      "/notifications/web-push/unsubscribe",
      {
        method: "DELETE",
        body: parsed,
      },
    );
    return privateJson(result);
  } catch (error) {
    return failure(error);
  }
}
