import "server-only";
import { createHash } from "node:crypto";
import { ApiError } from "./api";

const attempts = new Map<string, { count: number; reset: number }>();
export function limitAuthAttempt(email: string, now = Date.now()) {
  for (const [key, bucket] of attempts) if (bucket.reset <= now) attempts.delete(key);
  const accountKey = createHash("sha256").update(email.toLowerCase()).digest("hex");
  for (const [key, limit] of [["global", 100], [accountKey, 10]] as const) {
    const bucket = attempts.get(key) ?? { count: 0, reset: now + 15 * 60_000 };
    if (bucket.count >= limit) throw new ApiError(429);
    bucket.count++; attempts.set(key, bucket);
  }
}
