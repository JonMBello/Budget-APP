// @vitest-environment node
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./api";
import { getSessionStore } from "./session-store";
import { withSession } from "./session";
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("./api", async (original) => ({ ...await original<typeof import("./api")>(), apiRequest: vi.fn() }));
const auth = { accessToken: "expired", refreshToken: "old-refresh", user: { id: "test-user", name: "Test", email: "test@example.test", currency: "MXN" as const } };
let directory: string;
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "budget-refresh-")); vi.stubEnv("BUDGET_APP_SESSION_DIR", directory); });
afterEach(async () => { vi.unstubAllEnvs(); vi.mocked(apiRequest).mockReset(); await rm(directory, { recursive: true, force: true }); });
describe("session renewal", () => {
  it("renews once for five concurrent requests", async () => {
    const id = await getSessionStore().create(auth);
    vi.mocked(apiRequest).mockResolvedValue({ ...auth, accessToken: "fresh", refreshToken: "new-refresh" });
    const operation = vi.fn(async (token: string) => { if (token === "expired") throw new ApiError(401); return token; });
    expect(await Promise.all(Array.from({ length: 5 }, () => withSession(id, operation)))).toEqual(Array(5).fill("fresh"));
    expect(apiRequest).toHaveBeenCalledOnce();
  });
  it("removes revoked sessions without retry loops", async () => {
    const id = await getSessionStore().create(auth);
    vi.mocked(apiRequest).mockRejectedValue(new ApiError(401));
    await expect(withSession(id, async () => { throw new ApiError(401); })).rejects.toMatchObject({ status: 401 });
    expect(await getSessionStore().read(id)).toBeNull(); expect(apiRequest).toHaveBeenCalledOnce();
  });
  it("does not log users out for a temporary upstream failure or replay failed mutations", async () => {
    const id = await getSessionStore().create(auth);
    const operation = vi.fn(async () => { throw new ApiError(503); });
    await expect(withSession(id, operation)).rejects.toMatchObject({ status: 503 });
    expect(operation).toHaveBeenCalledOnce(); expect(apiRequest).not.toHaveBeenCalled(); expect(await getSessionStore().read(id)).not.toBeNull();
  });
  it("refuses a refresh response for a different identity", async () => {
    const id = await getSessionStore().create(auth);
    vi.mocked(apiRequest).mockResolvedValue({ ...auth, accessToken: "fresh", user: { ...auth.user, id: "other" } });
    await expect(withSession(id, async () => { throw new ApiError(401); })).rejects.toMatchObject({ status: 401 });
    expect(await getSessionStore().read(id)).toBeNull();
  });
});
