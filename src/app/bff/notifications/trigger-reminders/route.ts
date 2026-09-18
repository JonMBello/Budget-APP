import { triggerRemindersResultSchema } from "@/features/notifications/contracts";
import { checkOrigin, failure, privateJson } from "@/lib/server/http";
import { authenticatedRequest } from "@/lib/server/session";

export async function POST(request: Request) {
  let rawResult: any;
  try {
    checkOrigin(request);
    rawResult = await authenticatedRequest<any>(
      "/notifications/trigger-reminders",
      {
        method: "POST",
      },
    );
  } catch (error) {
    return failure(error);
  }

  try {
    const count =
      typeof rawResult?.remindersProcessed === "number"
        ? rawResult.remindersProcessed
        : typeof rawResult?.dispatchedAlertsCount === "number"
          ? rawResult.dispatchedAlertsCount
          : typeof rawResult?.detectedUpcomingCount === "number"
            ? rawResult.detectedUpcomingCount
            : 0;

    const normalized = {
      success: Boolean(rawResult?.success),
      remindersProcessed: count,
      detectedUpcomingCount: rawResult?.detectedUpcomingCount,
      dispatchedAlertsCount: rawResult?.dispatchedAlertsCount,
      timestamp: rawResult?.timestamp ?? new Date().toISOString(),
      message: rawResult?.message,
    };

    const validated = triggerRemindersResultSchema.parse(normalized);
    return privateJson(validated);
  } catch (err) {
    console.error("[bff/notifications/trigger-reminders] Normalization error:", err);
    return privateJson({
      success: Boolean(rawResult?.success),
      remindersProcessed: 0,
      timestamp: new Date().toISOString(),
      message: rawResult?.message ?? "Evaluación procesada.",
    });
  }
}

