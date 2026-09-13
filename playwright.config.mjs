import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: { baseURL: process.env.BASE_URL || "http://127.0.0.1:4173", headless: true },
  webServer: process.env.BASE_URL ? undefined : { command: "npm run serve", port: 4173, reuseExistingServer: true }
});
