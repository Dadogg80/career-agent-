import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:13000",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
  },
  webServer: [
    {
      command: "java -jar ../backend/build/libs/career-agent-backend.jar",
      url: "http://127.0.0.1:18080/actuator/health",
      env: { SERVER_PORT: "18080", GROQ_API_KEY: "" },
      timeout: 60000,
      reuseExistingServer: false,
    },
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 13000",
      url: "http://127.0.0.1:13000",
      env: { CAREER_API_BASE_URL: "http://127.0.0.1:18080", NEXT_TELEMETRY_DISABLED: "1" },
      timeout: 60000,
      reuseExistingServer: false,
    },
  ],
});
