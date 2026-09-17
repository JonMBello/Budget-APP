import { webPushPublicKeyResponseSchema } from "@/features/notifications/contracts";
import { failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function GET() {
  try {
    const result = await authenticatedRequest<unknown>(
      "/notifications/web-push/public-key",
      { method: "GET" },
    );
    const parsed = webPushPublicKeyResponseSchema.parse(result);
    return privateJson(parsed);
  } catch (error) {
    return failure(error);
  }
}
