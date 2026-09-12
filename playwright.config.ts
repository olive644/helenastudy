import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env["CI"] ? 2 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:4173", trace: "on-first-retry" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env["PLAYWRIGHT_SYSTEM_EDGE"] ? { channel: "msedge" } : {}),
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        ...(process.env["PLAYWRIGHT_SYSTEM_EDGE"]
          ? { browserName: "chromium" as const, channel: "msedge" }
          : {}),
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
  },
});
