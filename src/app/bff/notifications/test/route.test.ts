// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));

vi.mock("@/lib/server/session", () => ({
  authenticatedRequest: requestMock,
}));

vi.mock("@/lib/server/config", () => ({
  getServerConfig: () => ({ origin: "http://localhost:3000" }),
  ConfigurationError: class extends Error {},
}));

describe("POST /app/bff/notifications/test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: unknown, origin = "http://localhost:3000") =>
    new Request("http://localhost:3000/app/bff/notifications/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify(body),
    });

  it("normalizes real NestJS response without channel and with numerical push sent", async () => {
    // Exact response structure from NestJS NotificationsController.sendTest
    requestMock.mockResolvedValueOnce({
      success: true,
      message: "Test notification triggered successfully",
      pushResult: {
        sent: 1,
        failed: 0,
        endpoints: ["https://push.example.com/123"],
      },
      emailResult: {
        success: true,
        messageId: "<test-msg-123@budget>",
      },
    });

    const req = createRequest({ channel: "ALL" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      success: true,
      channel: "ALL",
      message: "Test notification triggered successfully",
      pushResult: {
        sent: true,
        recipientCount: 1,
      },
      emailResult: {
        sent: true,
      },
    });

    expect(requestMock).toHaveBeenCalledWith("/notifications/test", {
      method: "POST",
      body: { channel: "ALL" },
    });
  });

  it("handles push sent = 0 when no active subscriptions exist on NestJS", async () => {
    requestMock.mockResolvedValueOnce({
      success: true,
      message: "Test notification triggered successfully",
      pushResult: {
        sent: 0,
        failed: 0,
        endpoints: [],
      },
      emailResult: {
        success: true,
      },
    });

    const req = createRequest({ channel: "WEB_PUSH" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.channel).toBe("WEB_PUSH");
    expect(data.pushResult).toEqual({
      sent: false,
      recipientCount: 0,
    });
  });

  it("handles notifications disabled response from NestJS", async () => {
    requestMock.mockResolvedValueOnce({
      success: true,
      message: "Notifications are disabled",
      pushResult: null,
      emailResult: null,
    });

    const req = createRequest({ channel: "ALL" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      success: true,
      channel: "ALL",
      message: "Notifications are disabled",
    });
  });

  it("handles synthetic test fixture response format", async () => {
    requestMock.mockResolvedValueOnce({
      success: true,
      channel: "ALL",
      pushResult: {
        sent: true,
        recipientCount: 2,
      },
      emailResult: {
        sent: true,
        recipientEmail: "test@example.com",
      },
    });

    const req = createRequest({ channel: "ALL" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      success: true,
      channel: "ALL",
      pushResult: {
        sent: true,
        recipientCount: 2,
      },
      emailResult: {
        sent: true,
        recipientEmail: "test@example.com",
      },
    });
  });

  it("forwards optional title and message to upstream", async () => {
    requestMock.mockResolvedValueOnce({
      success: true,
      pushResult: { sent: 1 },
    });

    const req = createRequest({
      channel: "EMAIL",
      title: "Alerta de pago",
      message: "Vence mañana",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(requestMock).toHaveBeenCalledWith("/notifications/test", {
      method: "POST",
      body: {
        channel: "EMAIL",
        title: "Alerta de pago",
        message: "Vence mañana",
      },
    });
  });

  it("returns 400 with validation errors if channel is invalid", async () => {
    const req = createRequest({ channel: "INVALID_CHANNEL" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe("Revisa los datos del formulario.");
    expect(data.fields).toHaveProperty("channel");
  });

  it("returns 403 on cross-site origin", async () => {
    const req = createRequest({ channel: "ALL" }, "http://malicious-site.test");
    const res = await POST(req);

    expect(res.status).toBe(403);
  });
});
