import { expect, Locator, Page } from '@playwright/test';

import { DESCRIPCION, PRODUCTO } from './fideo';

export async function abrirTicketMostrador(page: Page): Promise<void> {
  await page.goto('/pos/mostrador/venta');
  const nuevo = page.locator('button:visible', { hasText: 'Nuevo' }).first();
  await expect(nuevo).toBeEnabled({ timeout: 60_000 });
  await nuevo.click();
  await page.getByRole('button', { name: 'Ticket', exact: true }).click();
  await expect(page.getByPlaceholder('Filtrar Productos por Cód. de Barras')).toBeVisible({
    timeout: 60_000,
  });
}

export function lineasFideo(page: Page): Locator {
  return page.locator('.articles-container tbody tr', { hasText: DESCRIPCION });
}

export async function escanearFideo(page: Page, veces: number): Promise<Locator> {
  const filtro = page.getByPlaceholder('Filtrar Productos por Cód. de Barras');
  const lineas = lineasFideo(page);
  for (let i = 1; i <= veces; i++) {
    await filtro.fill(PRODUCTO);
    await filtro.press('Enter');
    await expect(lineas).toHaveCount(i, { timeout: 30_000 });
  }
  return lineas;
}

export async function aplicarDescuentoPorcentaje(page: Page, porcentaje: string): Promise<void> {
  await page.locator('.btn-action.enabled', { hasText: 'Descuento' }).click();
  const modal = page.locator('.modal-content').filter({
    has: page.getByRole('heading', { name: 'Descuento' }),
  });
  await expect(modal).toBeVisible({ timeout: 30_000 });

  const porcentajeInput = modal.locator('input[name="percentageToApply"]');
  await porcentajeInput.fill(porcentaje);
  await porcentajeInput.press('Tab');

  await modal.getByRole('button', { name: 'Aceptar' }).click();
  await expect(modal).toBeHidden({ timeout: 30_000 });
}

/** Abre cobro en efectivo y deja listo el importe. Devuelve `transactionAmount`. */
export async function iniciarCobroEfectivo(page: Page): Promise<string> {
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
  return total;
}

export async function confirmarCobroCancelandoFinalizar(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Guardar' }).click();
  const dialogo = page.getByRole('heading', { name: 'Finalizar Transacción' });
  await expect(dialogo).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialogo).toBeHidden();
}
