import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./dev-tests",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:13001",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
  },
  webServer: {
    command: "npm run dev -- --port 13001",
    url: "http://127.0.0.1:13001",
    env: { NEXT_TELEMETRY_DISABLED: "1" },
    timeout: 60000,
    reuseExistingServer: false,
  },
});
