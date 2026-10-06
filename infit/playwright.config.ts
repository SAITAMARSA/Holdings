import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Use a pre-installed Chromium when available (e.g. CI images); otherwise
// run `npx playwright install chromium` once.
const preinstalled = "/opt/pw-browsers/chromium";
const executablePath = process.env.PW_CHROMIUM_PATH ?? (existsSync(preinstalled) ? preinstalled : undefined);
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/welcome`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
