import { describe, expect, it } from "vitest";
import { parseServerConfig } from "./config";
const env = { BUDGET_APP_API_URL: "http://127.0.0.1:3000/api/", BUDGET_APP_API_KEY: "test-secret", BUDGET_APP_ORIGIN: "https://budget.example.test" };
describe("server config", () => {
  it("normalizes a valid upstream", () => expect(parseServerConfig(env).apiUrl).toBe("http://127.0.0.1:3000/api"));
  it("fails closed without exposing invalid values", () => {
    expect(() => parseServerConfig({ ...env, BUDGET_APP_API_KEY: "" })).toThrow("no está configurada");
    expect(() => parseServerConfig({ ...env, BUDGET_APP_API_URL: "https://test-secret@example.test/api" })).toThrow("no está configurada");
  });
  it("rejects insecure non-local production origins", () => {
    expect(() => parseServerConfig({ ...env, NODE_ENV: "production", BUDGET_APP_ORIGIN: "http://example.test" })).toThrow();
    expect(() => parseServerConfig({ ...env, BUDGET_APP_ORIGIN: "https://budget.example.test/app" })).toThrow();
  });
});
