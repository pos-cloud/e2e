import { defineConfig, devices } from '@playwright/test';

import { testing } from './src/config';

const browser = {
  ...devices['Desktop Chrome'],
  baseURL: testing.webURL,
  trace: 'retain-on-failure' as const,
  screenshot: 'only-on-failure' as const,
  video: 'on' as const,
};

/** Cada circuito espera al anterior. Si uno falla, los siguientes no corren. */
function circuito(name: string, file: string, after: string) {
  return {
    name,
    dependencies: [after],
    testDir: './tests/circuits',
    testMatch: file,
    fullyParallel: false,
    use: browser,
  };
}

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
    circuito('01-inventario', '01-stock-inventario.spec.ts', 'registrar'),
    circuito('02-abrir-caja', '02-abrir-caja.spec.ts', '01-inventario'),
    circuito('03-venta', '03-venta-ticket.spec.ts', '02-abrir-caja'),
    circuito('04-cerrar-caja', '04-cerrar-caja.spec.ts', '03-venta'),
  ],
});
