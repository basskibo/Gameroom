import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 4173);

// WebGL in headless Chrome runs on SwiftShader (software). Good enough to catch errors and logic bugs;
// FPS numbers from here are NOT real — use .cursor/skills/benchmark for that.
const gl = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];

export default defineConfig({
  testDir: './games',
  outputDir: './reports/artifacts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // every worker runs a software-rendered WebGL game; more than ~2 saturates the CPU and frames starve
  workers: Number(process.env.PW_WORKERS) || 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: './reports/html', open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // System Chrome by default, so no browser download is needed. CI: `npx playwright install chrome`.
    channel: process.env.PW_CHANNEL || 'chrome',
    launchOptions: { args: gl },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL || 'chrome' }, grep: /@mobile/ },
  ],
  webServer: {
    command: 'node server.mjs',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
});
