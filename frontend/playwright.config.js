import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command: 'cd ../backend && npm run dev',
      port: 3001,
      timeout: 120000,
      reuseExistingServer: true
    },
    {
      command: 'npm run dev',
      port: 5173,
      timeout: 120000,
      reuseExistingServer: true
    }
  ]
});
