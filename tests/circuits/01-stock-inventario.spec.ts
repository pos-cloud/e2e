import { expect, test } from '@playwright/test';

import { serverEnv } from '../../src/config';
import { DESCRIPCION, PRODUCTO, STOCK_CONTADO, verStock } from '../support/fideo';
import { iniciarSesion } from '../support/kiosco';
import { leerNegocio } from '../support/negocio-corrido';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test('inventaría el fideo del kiosco y deja el stock contado', async ({ page }) => {
  const negocio = leerNegocio();
  const password = serverEnv()!.passAdmin;

  const login = await iniciarSesion(page, negocio, password);
  expect(login.response.status(), JSON.stringify(login.body)).toBe(200);

  await page.goto('/pos/mostrador/stock');
  const nuevo = page.locator('button:visible', { hasText: 'Nuevo' }).first();
  await expect(nuevo).toBeEnabled({ timeout: 60_000 });
  await nuevo.click();
  await page.locator('.dropdown-menu button', { hasText: 'Inventario' }).click();

  const filtro = page.getByPlaceholder('Filtrar Productos por Cód. de Barras');
  await expect(filtro).toBeVisible({ timeout: 60_000 });
  await filtro.fill(PRODUCTO);
  await filtro.press('Enter');

  const linea = page.locator('tr', { hasText: DESCRIPCION }).first();
  await expect(linea).toBeVisible({ timeout: 30_000 });

  await filtro.fill(`*${STOCK_CONTADO}`);
  await filtro.press('Enter');
  await expect(linea.locator('.badge')).toHaveText(STOCK_CONTADO, { timeout: 30_000 });

  await page.locator('.btn-action.enabled', { hasText: 'Procesar' }).click();
  await expect(page).toHaveURL(/\/pos\/mostrador\/stock(?:\?|$)/, { timeout: 60_000 });
  await expect(page.getByText('Stock Pendientes', { exact: true })).toBeVisible();
  await expect(page.getByText('Aún no hay transacciones pendientes')).toBeVisible();

  await verStock(page, STOCK_CONTADO);
});
