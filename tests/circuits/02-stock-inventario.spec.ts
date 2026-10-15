import { expect, test } from '@playwright/test';

import { serverEnv } from '../../src/config';
import { iniciarSesion } from '../support/kiosco';
import { leerNegocio } from '../support/negocio-corrido';

const PRODUCTO = '00001';
const DESCRIPCION = 'FIDEOS TALLARINES 500 GR';
const CANTIDAD = '5';

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

  await filtro.fill(`*${CANTIDAD}`);
  await filtro.press('Enter');
  await expect(linea.locator('.badge')).toHaveText(CANTIDAD, { timeout: 30_000 });

  await page.locator('.btn-action.enabled', { hasText: 'Procesar' }).click();
  await expect(page).toHaveURL(/\/pos\/mostrador\/stock(?:\?|$)/, { timeout: 60_000 });
  await expect(page.getByText('Stock Pendientes', { exact: true })).toBeVisible();
  await expect(page.getByText('Aún no hay transacciones pendientes')).toBeVisible();

  await page.goto('/entities/article-stock');
  await expect(page.locator('.datatable-title')).toHaveText('Inventario', { timeout: 60_000 });

  const fila = page.locator('tbody tr', { hasText: DESCRIPCION });
  await expect(fila).toBeVisible({ timeout: 60_000 });
  await expect(fila).toContainText(PRODUCTO);
  await expect(fila.locator('td').last()).toHaveText(CANTIDAD);
});
