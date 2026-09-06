// @vitest-environment node
import { expect, it } from "vitest";
import { limitAuthAttempt } from "./rate-limit";
it("limits repeated account attempts, including case variants, and resets after the window", () => {
  for (let i = 0; i < 10; i++) limitAuthAttempt("ratelimit@example.test", 1);
  expect(() => limitAuthAttempt("RATELIMIT@example.test", 2)).toThrow();
  expect(() => limitAuthAttempt("ratelimit@example.test", 15 * 60_000 + 2)).not.toThrow();
});
