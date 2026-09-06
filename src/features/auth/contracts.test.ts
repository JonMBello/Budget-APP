import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, safeReturnTo } from "./contracts";
describe("auth form contracts", () => {
  it("normalizes email without modifying passwords", () => expect(loginSchema.parse({ email: "TEST@example.test", password: " My Password " })).toEqual({ email: "test@example.test", password: " My Password " }));
  it("rejects uninvited registration, short passwords and unexpected fields", () => {
    expect(registerSchema.safeParse({ email: "test@example.test", password: "short", name: "Test" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "test@example.test", password: "long-enough", admin: true }).success).toBe(false);
  });
  it.each(["https://evil.test", "//evil.test", "/app/../evil", "/app/%2f%2fevil.test", "/app/bff/profile", "/app/login", "/other", "/app\\evil"])("blocks unsafe return destination %s", (url) => expect(safeReturnTo(url)).toBe("/app"));
  it("preserves an internal deep link and month", () => expect(safeReturnTo("/app/incomes?period=2026-09")).toBe("/app/incomes?period=2026-09"));
});
