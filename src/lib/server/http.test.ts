// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { checkOrigin, failure, readJson } from "./http";
import { ApiError } from "./api";
beforeEach(() => { vi.stubEnv("BUDGET_APP_API_URL", "https://budget.example.test/api"); vi.stubEnv("BUDGET_APP_API_KEY", "secret"); vi.stubEnv("BUDGET_APP_ORIGIN", "https://budget.example.test"); });
afterEach(() => vi.unstubAllEnvs());
it("rejects absent or foreign origin on cookie-authenticated mutations", () => {
  expect(() => checkOrigin(new Request("https://budget.example.test/app/bff/profile"))).toThrow();
  expect(() => checkOrigin(new Request("https://budget.example.test/app/bff/profile", { headers: { Origin: "https://evil.test" } }))).toThrow();
  expect(() => checkOrigin(new Request("https://budget.example.test/app/bff/profile", { headers: { Origin: "https://budget.example.test" } }))).not.toThrow();
});
it("limits streamed bodies even without Content-Length", async () => {
  const request = new Request("https://example.test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ large: "x".repeat(9000) }) });
  await expect(readJson(request)).rejects.toMatchObject({ status: 413 });
});
it("rejects malformed JSON and disallows browser caching of errors", async () => {
  await expect(readJson(new Request("https://example.test", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).rejects.toMatchObject({ status: 400 });
  const response = failure(new ApiError(401)); expect(response.status).toBe(401); expect(response.headers.get("Cache-Control")).toContain("no-store");
});
