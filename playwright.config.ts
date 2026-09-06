import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3002", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: [{ command: "node tests/fixtures/api-server.mjs", url: "http://127.0.0.1:3101/ready", reuseExistingServer: false }, {
    command: "npm run start",
    url: "http://127.0.0.1:3002/app/login",
    reuseExistingServer: false,
    timeout: 60_000,
    env: { BUDGET_APP_ORIGIN: "http://127.0.0.1:3002", BUDGET_APP_API_URL: "http://127.0.0.1:3101/api", BUDGET_APP_API_KEY: "integration-only-key", BUDGET_APP_SESSION_DIR: join(tmpdir(), "budget-app-e2e-sessions"), BUDGET_APP_ALLOW_REGISTRATION: "true" },
  }],
});
