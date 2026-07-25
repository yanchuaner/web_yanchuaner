import { defineConfig, devices } from "@playwright/test";

const outputDir =
  process.env.PLAYWRIGHT_OUTPUT_DIR ?? "/tmp/yanchuaner-playwright/test-results";
const reportDir =
  process.env.PLAYWRIGHT_REPORT_DIR ?? "/tmp/yanchuaner-playwright/report";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [["list"], ["html", { outputFolder: reportDir, open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
