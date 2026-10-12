import { expect, Page, Response } from '@playwright/test';

import { testing } from '../../src/config';
import { Negocio } from '../../src/negocio';

export type JsonBody = {
  status?: number;
  message?: string;
  result?: { user?: { name?: string } };
};

/** Marca integraciones y módulos. El alta de kiosco los pide todos. */
export async function marcarTodosLosCheckbox(page: Page): Promise<void> {
  const checks = page.locator('.auth-checks input[type="checkbox"]');
  const total = await checks.count();
  expect(total).toBeGreaterThanOrEqual(11);

  for (let i = 0; i < total; i++) {
    await checks.nth(i).check();
  }
}

export async function crearKiosco(
  page: Page,
  negocio: Negocio
): Promise<{ response: Response; body: JsonBody }> {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();

  await page.locator('#fullName').fill(negocio.fullName);
  await page.locator('#companyName').fill(negocio.database);
  await page.locator('#email').fill(negocio.email);
  await page.locator('#phone').fill(negocio.phone);
  await page.locator('#country').selectOption(negocio.country);
  await page.locator('#businessModel').selectOption(negocio.businessModel);
  await marcarTodosLosCheckbox(page);

  const registerPromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/auth/register'),
    { timeout: 150_000 }
  );

  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  const response = await registerPromise;
  const body = (await response.json()) as JsonBody;

  expect(new URL(response.url()).host).toBe(new URL(testing.apiURL).host);

  return { response, body };
}

export async function iniciarSesion(
  page: Page,
  negocio: Negocio,
  password: string
): Promise<{ response: Response; body: JsonBody }> {
  await page.goto('/login');
  await page.locator('#company').fill(negocio.database);
  await page.locator('#user').fill(negocio.user);
  await page.locator('#password').fill(password);

  const loginPromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/auth/login')
  );

  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  const response = await loginPromise;
  const body = (await response.json()) as JsonBody;

  expect(response.url()).toContain(`database=${negocio.database}`);
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

  return { response, body };
}
