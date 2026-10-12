import { expect, test } from '@playwright/test';

import { PosApi } from '../../../src/api';
import { serverEnv, testing } from '../../../src/config';
import { buildNegocio } from '../../../src/negocio';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test.describe('Alta y login de un negocio', () => {
  let database = '';

  test.afterEach(async ({ request }) => {
    if (!database) return;

    const nombre = database;
    database = '';

    const api = new PosApi(request);
    const removed = await api.deleteNegocio(nombre);
    expect(removed.response.status(), JSON.stringify(removed.body)).toBe(200);

    const login = await api.login({
      database: nombre,
      user: 'admin',
      password: serverEnv()!.passAdmin,
    });
    expect(login.response.status()).toBe(404);
    expect(login.body.message).toBe('El negocio no existe');
  });

  test('crea la cuenta en el formulario, entra y al final no queda la base', async ({ page }) => {
    const negocio = buildNegocio();
    const password = serverEnv()!.passAdmin;

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();

    await page.locator('#fullName').fill(negocio.fullName);
    await page.locator('#companyName').fill(negocio.database);
    await page.locator('#email').fill(negocio.email);
    await page.locator('#phone').fill(negocio.phone);
    await page.locator('#country').selectOption(negocio.country);
    await page.locator('#businessModel').selectOption(negocio.businessModel);
    await page.getByLabel('Ventas').check();
    await page.getByLabel('Stock').check();
    await page.getByLabel('Caja').check();

    const registerPromise = page.waitForResponse(
      (response) => response.request().method() === 'POST' && response.url().includes('/auth/register'),
      { timeout: 150_000 }
    );

    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    const registerResponse = await registerPromise;
    const registerBody = await registerResponse.json();

    if (registerResponse.status() === 200) database = negocio.database;

    expect(registerResponse.status(), JSON.stringify(registerBody)).toBe(200);
    expect(new URL(registerResponse.url()).host).toBe(new URL(testing.apiURL).host);
    expect(String(registerBody.message)).toContain('Bienvenido');

    await page.goto('/login');
    await page.locator('#company').fill(negocio.database);
    await page.locator('#user').fill(negocio.user);
    await page.locator('#password').fill(password);

    const loginPromise = page.waitForResponse(
      (response) => response.request().method() === 'POST' && response.url().includes('/auth/login')
    );

    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    const loginResponse = await loginPromise;
    const loginBody = await loginResponse.json();

    expect(loginResponse.status(), JSON.stringify(loginBody)).toBe(200);
    expect(loginResponse.url()).toContain(`database=${negocio.database}`);
    expect(loginBody.result?.user?.name ?? loginBody.result?.user).toBeTruthy();
    await expect(page).not.toHaveURL(/\/login/);
  });
});
