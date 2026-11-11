import { expect, test } from '@playwright/test';

import { serverEnv } from '../../src/config';
import { DESCRIPCION, PRODUCTO, STOCK_TRAS_VENTA, verStock } from '../support/fideo';
import { iniciarSesion } from '../support/kiosco';
import { leerNegocio } from '../support/negocio-corrido';

/** Precio es-AR del pipe currency (`$ 1.234,56`). */
function parsePrecioUi(texto: string): number {
  const solo = texto.replace(/[^\d.,]/g, '');
  if (solo.includes(',') && solo.includes('.')) {
    return Number(solo.replace(/\./g, '').replace(',', '.'));
  }
  if (solo.includes(',')) {
    return Number(solo.replace(',', '.'));
  }
  return Number(solo);
}

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test('vende tres unidades del fideo por scan y descuenta el inventario', async ({ page }) => {
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

  const lineas = page.locator('.articles-container tbody tr', { hasText: DESCRIPCION });
  for (let i = 1; i <= 3; i++) {
    await filtro.fill(PRODUCTO);
    await filtro.press('Enter');
    await expect(lineas).toHaveCount(i, { timeout: 30_000 });
  }

  const precioPrimera = parsePrecioUi(await lineas.first().locator('td').nth(2).innerText());

  await page.locator('.btn-action.enabled', { hasText: 'Cobrar' }).click();
  await expect(page.getByRole('heading', { name: 'Forma de pago' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Efectivo', exact: true }).click();

  const total = await page.locator('input[name="transactionAmount"]').inputValue();
  expect(Number(total)).toBeGreaterThan(0);
  if (precioPrimera > 0) {
    expect(Number(total)).toBeCloseTo(precioPrimera * 3, 2);
  }

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

  await verStock(page, STOCK_TRAS_VENTA);
});
