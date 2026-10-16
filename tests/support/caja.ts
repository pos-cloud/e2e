import { expect, Page } from '@playwright/test';

const MONTO = '1000';

async function elegirEnFondos(page: Page, tipo: string): Promise<void> {
  await page.goto('/pos/mostrador/fondo');
  const nuevo = page.locator('button:visible', { hasText: 'Nuevo' }).first();
  await expect(nuevo).toBeEnabled({ timeout: 60_000 });
  await nuevo.click();
  await page.getByRole('button', { name: tipo, exact: true }).click();
}

async function confirmarEfectivo(page: Page, titulo: string): Promise<ReturnType<Page['locator']>> {
  const modal = page.locator('.modal-content').filter({
    has: page.getByRole('heading', { name: titulo }),
  });
  await expect(modal).toBeVisible({ timeout: 30_000 });
  await expect(modal.locator('#paymentMethod option', { hasText: 'Efectivo' })).toHaveCount(1);

  const monto = modal.locator('#amount');
  await expect(monto).toBeEnabled();
  await monto.fill(MONTO);
  await modal.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(modal.locator('tbody tr', { hasText: 'Efectivo' })).toBeVisible();

  return modal;
}

export async function abrirCaja(page: Page): Promise<void> {
  await elegirEnFondos(page, 'Apertura de Caja');
  const modal = await confirmarEfectivo(page, 'Apertura de Caja');
  const abrir = modal.getByRole('button', { name: 'Abrir Caja' });
  await expect(abrir).toBeEnabled();
  await abrir.click();
  await expect(modal).toBeHidden({ timeout: 30_000 });
}

export async function cerrarCaja(page: Page): Promise<void> {
  await elegirEnFondos(page, 'Cierre de Caja');
  const modal = await confirmarEfectivo(page, 'Cierre de Caja');
  const cerrar = modal.getByRole('button', { name: 'Cerrar Caja' });
  await expect(cerrar).toBeEnabled();
  await cerrar.click();
  await expect(modal).toBeHidden({ timeout: 30_000 });
}

export async function verCajasAbiertas(page: Page, abiertas: boolean): Promise<void> {
  await page.goto('/reports/open-cash-boxes');
  await expect(page.getByRole('heading', { name: 'Cajas abiertas' })).toBeVisible({ timeout: 60_000 });

  const vacio = page.getByText('No hay cajas abiertas.');
  if (abiertas) {
    await expect(page.locator('.cash-box-card', { hasText: 'Efectivo' })).toBeVisible({ timeout: 30_000 });
    await expect(vacio).toBeHidden();
    return;
  }

  await expect(vacio).toBeVisible({ timeout: 30_000 });
}
