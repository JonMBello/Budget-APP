import { describe, expect, it } from "vitest";
import {
  notificationChannelSchema,
  webPushPublicKeyResponseSchema,
  webPushSubscribeInputSchema,
  webPushUnsubscribeInputSchema,
  notificationTestInputSchema,
  pushResultSchema,
  emailResultSchema,
  notificationTestResultSchema,
  triggerRemindersResultSchema,
} from "./contracts";

describe("Notification Contracts", () => {
  it("validates notification channels", () => {
    expect(notificationChannelSchema.parse("WEB_PUSH")).toBe("WEB_PUSH");
    expect(notificationChannelSchema.parse("EMAIL")).toBe("EMAIL");
    expect(notificationChannelSchema.parse("ALL")).toBe("ALL");
    expect(() => notificationChannelSchema.parse("SMS")).toThrow();
  });

  it("validates web push public key response", () => {
    const valid = { publicKey: "BNcR123..." };
    expect(webPushPublicKeyResponseSchema.parse(valid)).toEqual(valid);
    expect(() => webPushPublicKeyResponseSchema.parse({ publicKey: "" })).toThrow();
    expect(() => webPushPublicKeyResponseSchema.parse({})).toThrow();
  });

  it("validates web push subscribe input", () => {
    const valid = {
      endpoint: "https://fcm.googleapis.com/fcm/send/123",
      keys: {
        p256dh: "key-p256dh",
        auth: "key-auth",
      },
      userAgent: "Mozilla/5.0",
    };
    expect(webPushSubscribeInputSchema.parse(valid)).toEqual(valid);

    // Invalid endpoint
    expect(() =>
      webPushSubscribeInputSchema.parse({
        ...valid,
        endpoint: "not-a-url",
      }),
    ).toThrow();

    // Missing keys
    expect(() =>
      webPushSubscribeInputSchema.parse({
        endpoint: "https://fcm.googleapis.com/fcm/send/123",
        keys: { p256dh: "" },
      }),
    ).toThrow();
  });

  it("validates web push unsubscribe input", () => {
    const valid = { endpoint: "https://fcm.googleapis.com/fcm/send/123" };
    expect(webPushUnsubscribeInputSchema.parse(valid)).toEqual(valid);
    expect(() => webPushUnsubscribeInputSchema.parse({ endpoint: "invalid" })).toThrow();
  });

  it("validates notification test input", () => {
    expect(notificationTestInputSchema.parse({})).toEqual({ channel: "ALL" });
    expect(
      notificationTestInputSchema.parse({
        channel: "EMAIL",
        title: "Test",
        message: "Hello",
      }),
    ).toEqual({
      channel: "EMAIL",
      title: "Test",
      message: "Hello",
    });
  });

  it("validates push result and email result", () => {
    const push = { sent: true, recipientCount: 2 };
    expect(pushResultSchema.parse(push)).toEqual(push);

    const email = { sent: true, recipientEmail: "user@example.test" };
    expect(emailResultSchema.parse(email)).toEqual(email);

    expect(() => pushResultSchema.parse({ sent: true, recipientCount: -1 })).toThrow();
    expect(() => emailResultSchema.parse({ sent: true, recipientEmail: "not-email" })).toThrow();
  });

  it("validates notification test result", () => {
    const result = {
      success: true,
      channel: "ALL",
      pushResult: { sent: true, recipientCount: 1 },
      emailResult: { sent: true, recipientEmail: "user@example.test" },
    };
    expect(notificationTestResultSchema.parse(result)).toEqual(result);
  });

  it("validates trigger reminders result", () => {
    const result = {
      success: true,
      remindersProcessed: 5,
      timestamp: "2026-09-06T12:00:00Z",
    };
    expect(triggerRemindersResultSchema.parse(result)).toEqual(result);
    expect(() =>
      triggerRemindersResultSchema.parse({
        success: true,
        remindersProcessed: -2,
      }),
    ).toThrow();
  });
});
