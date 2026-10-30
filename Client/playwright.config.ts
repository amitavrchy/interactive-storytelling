import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "node ../scripts/test-api.mjs",
      url: "http://localhost:4100/health",
      reuseExistingServer: false,
      timeout: 20000,
    },
    {
      command: "node node_modules/next/dist/bin/next start -p 3100",
      url: "http://localhost:3100",
      reuseExistingServer: false,
      timeout: 20000,
    },
  ],
});
