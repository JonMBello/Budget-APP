import { z } from "zod";

export const notificationChannelSchema = z.enum(["WEB_PUSH", "EMAIL", "ALL"]);
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

export const webPushPublicKeyResponseSchema = z.object({
  publicKey: z.string().min(1),
});
export type WebPushPublicKeyResponse = z.infer<typeof webPushPublicKeyResponseSchema>;

export const webPushKeysSchema = z.object({
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});
export type WebPushKeys = z.infer<typeof webPushKeysSchema>;

export const webPushSubscribeInputSchema = z.object({
  endpoint: z.string().url(),
  keys: webPushKeysSchema,
  userAgent: z.string().optional(),
});
export type WebPushSubscribeInput = z.infer<typeof webPushSubscribeInputSchema>;

export const webPushUnsubscribeInputSchema = z.object({
  endpoint: z.string().url(),
});
export type WebPushUnsubscribeInput = z.infer<typeof webPushUnsubscribeInputSchema>;

export const notificationTestInputSchema = z.object({
  channel: notificationChannelSchema.default("ALL"),
  title: z.string().trim().min(1).max(100).optional(),
  message: z.string().trim().min(1).max(250).optional(),
});
export type NotificationTestInput = z.infer<typeof notificationTestInputSchema>;

export const pushResultSchema = z.object({
  sent: z.boolean(),
  recipientCount: z.number().int().nonnegative().default(0),
  error: z.string().optional(),
});
export type PushResult = z.infer<typeof pushResultSchema>;

export const emailResultSchema = z.object({
  sent: z.boolean(),
  recipientEmail: z.string().email().optional(),
  error: z.string().optional(),
});
export type EmailResult = z.infer<typeof emailResultSchema>;

export const notificationTestResultSchema = z.object({
  success: z.boolean(),
  channel: notificationChannelSchema.default("ALL"),
  pushResult: pushResultSchema.optional(),
  emailResult: emailResultSchema.optional(),
  message: z.string().optional(),
});
export type NotificationTestResult = z.infer<typeof notificationTestResultSchema>;

export const triggerRemindersResultSchema = z.object({
  success: z.boolean(),
  remindersProcessed: z.number().int().nonnegative().default(0),
  detectedUpcomingCount: z.number().int().nonnegative().optional(),
  dispatchedAlertsCount: z.number().int().nonnegative().optional(),
  timestamp: z.string().optional(),
  message: z.string().optional(),
});
export type TriggerRemindersResult = z.infer<typeof triggerRemindersResultSchema>;
