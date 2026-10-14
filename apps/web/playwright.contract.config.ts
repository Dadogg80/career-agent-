import { defineConfig } from "@playwright/test";

// Pure validation/proxy checks use the existing runner without browsers or application servers.
export default defineConfig({
  testDir: "./contract-tests",
  workers: 2,
  retries: 0,
  reporter: "list",
});
