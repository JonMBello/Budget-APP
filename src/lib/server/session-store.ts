import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { authResponseSchema, type AuthResponse } from "@/features/auth/contracts";

const schema = authResponseSchema.extend({ expiresAt: z.number() });
export type Session = z.infer<typeof schema>;
const locks = new Map<string, Promise<unknown>>();
const validId = (id: string) => /^[A-Za-z0-9_-]{43}$/.test(id);
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export class FileSessionStore {
  constructor(private readonly directory: string) {}
  private file(id: string) { return resolve(this.directory, `${createHash("sha256").update(id).digest("hex")}.json`); }
  async lock<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const key = `${this.directory}:${id}`;
    const previous = locks.get(key) ?? Promise.resolve();
    const current = previous.catch(() => {}).then(fn);
    locks.set(key, current);
    try { return await current; } finally { if (locks.get(key) === current) locks.delete(key); }
  }
  async create(auth: AuthResponse): Promise<string> {
    const id = randomBytes(32).toString("base64url");
    await this.save(id, { ...auth, expiresAt: Date.now() + SESSION_TTL });
    return id;
  }
  async read(id: string): Promise<Session | null> {
    if (!validId(id)) return null;
    try {
      const session = schema.parse(JSON.parse(await readFile(this.file(id), "utf8")));
      if (session.expiresAt <= Date.now()) { await this.destroy(id); return null; }
      return session;
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError || (error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  async save(id: string, session: Session) {
    if (!validId(id)) throw new Error("Invalid session identifier");
    const parsed = schema.parse(session);
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const destination = this.file(id);
    const temporary = `${destination}.${randomBytes(8).toString("hex")}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(parsed), { mode: 0o600, flag: "wx" });
      await rename(temporary, destination);
    } finally {
      await unlink(temporary).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    }
  }
  async destroy(id: string) {
    if (!validId(id)) return;
    await unlink(this.file(id)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  }
}

// Sessions are runtime state, never input files to include in a deployment artifact.
export function getSessionStore() { return new FileSessionStore(resolve(/* turbopackIgnore: true */ process.env.BUDGET_APP_SESSION_DIR ?? ".data/sessions")); }
