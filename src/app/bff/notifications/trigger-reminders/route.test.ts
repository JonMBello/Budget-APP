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

describe("POST /app/bff/notifications/trigger-reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (origin = "http://localhost:3000") =>
    new Request("http://localhost:3000/app/bff/notifications/trigger-reminders", {
      method: "POST",
      headers: {
        Origin: origin,
      },
    });

  it("normalizes real NestJS response with detectedUpcomingCount and dispatchedAlertsCount", async () => {
    requestMock.mockResolvedValueOnce({
      success: true,
      message: "Due reminders triggered and logged",
      detectedUpcomingCount: 3,
      dispatchedAlertsCount: 2,
      logs: [],
    });

    const res = await POST(createRequest());

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.remindersProcessed).toBe(2);
    expect(data.detectedUpcomingCount).toBe(3);
    expect(data.dispatchedAlertsCount).toBe(2);
    expect(data.message).toBe("Due reminders triggered and logged");
    expect(typeof data.timestamp).toBe("string");
  });

  it("handles synthetic fixture response format with remindersProcessed", async () => {
    requestMock.mockResolvedValueOnce({
      success: true,
      remindersProcessed: 5,
      timestamp: "2026-09-17T12:00:00.000Z",
    });

    const res = await POST(createRequest());

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.remindersProcessed).toBe(5);
    expect(data.timestamp).toBe("2026-09-17T12:00:00.000Z");
  });

  it("returns 403 on cross-site origin", async () => {
    const res = await POST(createRequest("http://evil.test"));
    expect(res.status).toBe(403);
  });
});
