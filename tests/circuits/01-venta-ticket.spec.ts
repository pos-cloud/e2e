import { expect, test } from '@playwright/test';

import { serverEnv } from '../../src/config';
import { iniciarSesion } from '../support/kiosco';
import { leerNegocio } from '../support/negocio-corrido';

const PRODUCTO = '00001';
const DESCRIPCION = 'FIDEOS TALLARINES 500 GR';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test('vende el fideo del kiosco y cancela el cierre', async ({ page }) => {
  const negocio = leerNegocio();
  const password = serverEnv()!.passAdmin;

  const login = await iniciarSesion(page, negocio, password);
  expect(login.response.status(), JSON.stringify(login.body)).toBe(200);

  await page.goto('/pos/mostrador/venta');
  const nuevo = page.locator('button:visible', { hasText: 'Nuevo' }).first();
  await expect(nuevo).toBeEnabled({ timeout: 60_000 });
  await nuevo.click();
  await page.getByRole('button', { name: 'Ticket', exact: true }).click();

  const filtro = page.getByPlaceholder('Filtrar Productos por Cód. de Barras');
  await expect(filtro).toBeVisible({ timeout: 60_000 });
  await filtro.fill(PRODUCTO);
  await filtro.press('Enter');
  await expect(page.getByText(DESCRIPCION).first()).toBeVisible({ timeout: 30_000 });

  await page.locator('.btn-action.enabled', { hasText: 'Cobrar' }).click();
  await expect(page.getByRole('heading', { name: 'Forma de pago' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Efectivo', exact: true }).click();

  const total = await page.locator('input[name="transactionAmount"]').inputValue();
  const aPagar = page.locator('input[name="amountToPay"]');
  const importe = await aPagar.inputValue();
  if (!importe || Number(importe) === 0) {
    await aPagar.fill(total);
    await aPagar.blur();
  }

  await page.getByRole('button', { name: 'Guardar' }).click();
  const dialogo = page.getByRole('heading', { name: 'Finalizar Transacción' });
  await expect(dialogo).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialogo).toBeHidden();
});
