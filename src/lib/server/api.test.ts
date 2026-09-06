// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api";
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("BUDGET_APP_API_URL", "https://budget.example.test/api");
  vi.stubEnv("BUDGET_APP_API_KEY", "test-secret");
  vi.stubEnv("BUDGET_APP_ORIGIN", "https://budget.example.test");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); fetchMock.mockReset(); });
describe("server API client", () => {
  it("injects credentials on server and forbids caching and redirects", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: "me" }));
    await expect(apiRequest("/users/me", { token: "private-token" })).resolves.toEqual({ id: "me" });
    expect(fetchMock).toHaveBeenCalledWith("https://budget.example.test/api/users/me", expect.objectContaining({ cache: "no-store", redirect: "error", headers: { "x-api-key": "test-secret", Accept: "application/json", Authorization: "Bearer private-token" } }));
  });
  it("requires a token before making a protected request", async () => {
    await expect(apiRequest("/users/me")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(["//evil.test/api", "https://evil.test/api", "/../auth/login", "/users/me#fragment"])("rejects unexpected path %s", async (path) => {
    await expect(apiRequest(path, { token: "test" })).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("sends API key on public login without requiring JWT", async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: true }));
    await apiRequest("/auth/login", { method: "POST", body: { email: "test@example.test" } });
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
    expect(fetchMock.mock.calls[0][1].headers["x-api-key"]).toBe("test-secret");
  });
  it("sanitizes upstream errors and never automatically retries a mutation", async () => {
    fetchMock.mockResolvedValue(Response.json({ message: "private database details" }, { status: 500 }));
    await expect(apiRequest("/incomes", { token: "test", method: "POST", body: {} })).rejects.toThrow("No pudimos conectar");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("reports a network failure without a false saved result", async () => {
    fetchMock.mockRejectedValue(new TypeError("failed connection with secret"));
    await expect(apiRequest("/health")).rejects.toMatchObject({ status: 503, code: "network" });
  });
});
