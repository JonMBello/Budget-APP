import { webPushSubscribeInputSchema } from "@/features/notifications/contracts";
import { checkOrigin, failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await request.json().catch(() => ({}));
    const parsed = webPushSubscribeInputSchema.parse(body);
    const result = await authenticatedRequest<unknown>(
      "/notifications/web-push/subscribe",
      {
        method: "POST",
        body: parsed,
      },
    );
    return privateJson(result, 201);
  } catch (error) {
    return failure(error);
  }
}
