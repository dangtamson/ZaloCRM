import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174',
    port: 5174,
    reuseExistingServer: true,
  },
});
