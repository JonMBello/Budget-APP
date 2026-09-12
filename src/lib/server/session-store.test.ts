// @vitest-environment node
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileSessionStore } from "./session-store";
const auth = { accessToken: "access-test", refreshToken: "refresh-test", user: { id: "test-user", name: "Test User", email: "test@example.test", currency: "MXN" as const } };
let directory: string; let store: FileSessionStore;
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "budget-sessions-")); store = new FileSessionStore(directory); });
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });
describe("durable private sessions", () => {
  it("uses an opaque random ID, private permissions and survives store recreation", async () => {
    const id = await store.create(auth); expect(id).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await new FileSessionStore(directory).read(id)).toMatchObject(auth);
    const files = await readdir(directory); expect(files).toHaveLength(1); expect(files[0]).not.toContain(id);
    expect((await stat(join(directory, files[0]))).mode & 0o777).toBe(0o600);
    expect(await readFile(join(directory, files[0]), "utf8")).toContain("access-test");
  });
  it("expires sessions and rejects path traversal identifiers", async () => {
    const id = await store.create(auth); await store.save(id, { ...auth, expiresAt: 1 });
    expect(await store.read(id)).toBeNull(); expect(await readdir(directory)).toHaveLength(0);
    expect(await store.read("../../some-file")).toBeNull();
  });
  it("serializes updates so logout cannot be undone by an earlier refresh", async () => {
    const id = await store.create(auth);
    const order: string[] = [];
    await Promise.all([
      store.lock(id, async () => { order.push("refresh"); await store.save(id, { ...auth, accessToken: "new", expiresAt: Date.now() + 10000 }); }),
      new FileSessionStore(directory).lock(id, async () => { order.push("logout"); await store.destroy(id); }),
    ]);
    expect(order).toEqual(["refresh", "logout"]); expect(await store.read(id)).toBeNull();
  });
});
