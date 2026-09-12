// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "./route";
import { ApiError } from "@/lib/server/api";
const mocks = vi.hoisted(() => ({ request: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/server/session", () => ({ authenticatedRequest: mocks.request }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/server/http", async (original) => ({ ...await original<object>(), checkOrigin: vi.fn() }));
const result = { periodId: "p-1", year: 2025, month: 4, createdCount: 2, skippedCount: 1 };
const request = (body: unknown) => new Request("http://localhost/bff/recurring/instantiate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { mocks.request.mockReset(); mocks.revalidate.mockReset(); });
it("sends only the destination ID and validates the committed result", async () => {
  mocks.request.mockResolvedValue(result);
  const response = await POST(request({ periodId: "p-1", year: 2026, month: 9 }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(result);
  expect(mocks.request).toHaveBeenCalledWith("/recurring/instantiate", { method: "POST", body: { periodId: "p-1" } });
  expect(mocks.revalidate).toHaveBeenCalledWith("/expenses");
});
it("rejects legacy requests before calling the API", async () => {
  expect((await POST(request({ year: 2026, month: 9 }))).status).toBe(400);
  expect(mocks.request).not.toHaveBeenCalled();
});
it.each([{ totalCount: 2, year: 2025, month: 4 }, { ...result, periodId: "other" }, { ...result, createdCount: -1 }])("does not report invalid upstream responses as form errors or success", async (body) => {
  mocks.request.mockResolvedValue(body);
  expect((await POST(request({ periodId: "p-1" }))).status).toBe(502);
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it("explains a period conflict", async () => {
  mocks.request.mockRejectedValue(new ApiError(409));
  const response = await POST(request({ periodId: "p-1" }));
  expect(response.status).toBe(409);
  expect((await response.json()).message).toContain("siga abierto");
});
