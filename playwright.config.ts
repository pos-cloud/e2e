import { defineConfig, devices } from '@playwright/test';

import { testing } from './src/config';

const browser = {
  ...devices['Desktop Chrome'],
  baseURL: testing.webURL,
  trace: 'retain-on-failure' as const,
  screenshot: 'only-on-failure' as const,
  video: 'on' as const,
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  timeout: 300_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'registrar',
      testDir: './tests/setup',
      retries: 0,
      use: browser,
    },
    {
      name: 'circuits',
      dependencies: ['registrar'],
      testDir: './tests/circuits',
      use: browser,
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      use: browser,
    },
  ],
});
