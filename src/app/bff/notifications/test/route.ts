import {
  notificationTestInputSchema,
  notificationTestResultSchema,
  type NotificationChannel,
} from "@/features/notifications/contracts";
import { checkOrigin, failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function POST(request: Request) {
  let requestedChannel: NotificationChannel = "ALL";
  let rawResult: any;

  try {
    checkOrigin(request);
    const body = await request.json().catch(() => ({}));
    const parsed = notificationTestInputSchema.parse(body);
    requestedChannel = parsed.channel;

    const payload: { channel: NotificationChannel; title?: string; message?: string } = {
      channel: parsed.channel,
    };
    if (parsed.title) payload.title = parsed.title;
    if (parsed.message) payload.message = parsed.message;

    rawResult = await authenticatedRequest<any>("/notifications/test", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    return failure(error);
  }

  try {
    const rawPush = rawResult?.pushResult;
    const rawEmail = rawResult?.emailResult;

    const normalizedPush =
      rawPush && typeof rawPush === "object"
        ? {
            sent:
              typeof rawPush.sent === "boolean"
                ? rawPush.sent
                : Number(rawPush.sent ?? 0) > 0,
            recipientCount:
              typeof rawPush.recipientCount === "number"
                ? rawPush.recipientCount
                : Number(rawPush.sent ?? 0),
            error:
              rawPush.error ??
              (rawPush.failed && rawPush.failed > 0
                ? `Falló el envío a ${rawPush.failed} dispositivo(s)`
                : undefined),
          }
        : undefined;

    const normalizedEmail =
      rawEmail && typeof rawEmail === "object"
        ? {
            sent:
              typeof rawEmail.sent === "boolean"
                ? rawEmail.sent
                : Boolean(rawEmail.success),
            recipientEmail:
              typeof rawEmail.recipientEmail === "string" &&
              rawEmail.recipientEmail.includes("@")
                ? rawEmail.recipientEmail
                : undefined,
            error: rawEmail.error ?? undefined,
          }
        : undefined;

    const normalized = {
      success: Boolean(rawResult?.success),
      channel: rawResult?.channel ?? requestedChannel,
      message: rawResult?.message ?? undefined,
      pushResult: normalizedPush,
      emailResult: normalizedEmail,
    };

    const validated = notificationTestResultSchema.parse(normalized);
    return privateJson(validated);
  } catch (err) {
    console.error("[bff/notifications/test] Normalization error:", err);
    return privateJson({
      success: Boolean(rawResult?.success),
      channel: requestedChannel,
      message: rawResult?.message ?? "Prueba procesada.",
    });
  }
}

