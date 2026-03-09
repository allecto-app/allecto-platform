import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const rootDir = resolve(__dirname, "..", "..");
const runTag = process.env.PLAYWRIGHT_RUN_TAG ?? `run-${Date.now().toString(36)}`;
const outputDir = `.playwright-output-${runTag}`;
const nextDistDir = `.next-playwright-${runTag}`;
const webServerPort = process.env.PLAYWRIGHT_WEB_PORT ?? "4310";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${webServerPort}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `PORT=${webServerPort} pnpm --filter admin dev`,
    url: baseURL,
    cwd: rootDir,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_USE_MOCK_CONVEX: "true",
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ?? "http://localhost:9999/mock",
      NEXT_DIST_DIR: nextDistDir,
      NODE_ENV: "test",
      PLAYWRIGHT_TEST: "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
