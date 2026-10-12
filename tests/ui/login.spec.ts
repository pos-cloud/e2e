import { expect, test } from '@playwright/test';

import { testing } from '../../src/config';

test.describe('Login en el front de testing', () => {
  test('el formulario habla con la API de testing y rechaza un negocio inexistente', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();

    await page.locator('#company').fill('e2e-negocio-inexistente');
    await page.locator('#user').fill('nobody');
    await page.locator('#password').fill('wrong');

    const responsePromise = page.waitForResponse(
      (response) => response.request().method() === 'POST' && response.url().includes('/auth/login')
    );

    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    const response = await responsePromise;

    expect(new URL(response.url()).host).toBe(new URL(testing.apiURL).host);
    expect(response.url()).toContain('database=e2e-negocio-inexistente');
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe('El negocio no existe');
    await expect(page).toHaveURL(/\/login/);
  });
});
