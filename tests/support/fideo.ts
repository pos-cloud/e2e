import { expect, Page } from '@playwright/test';

export const PRODUCTO = '00001';
export const DESCRIPCION = 'FIDEOS TALLARINES 500 GR';
/** Lo deja el inventario. */
export const STOCK_CONTADO = '5';
/** Tras vender tres unidades por scan. */
export const STOCK_TRAS_TRES_SCANS = '2';
/** Tras la venta con descuento (una unidad más). */
export const STOCK_TRAS_DESCUENTO = '1';

export async function verStock(page: Page, cantidad: string): Promise<void> {
  await page.goto('/entities/article-stock');
  await expect(page.locator('.datatable-title')).toHaveText('Inventario', { timeout: 60_000 });

  const fila = page.locator('tbody tr', { hasText: DESCRIPCION });
  await expect(fila).toBeVisible({ timeout: 60_000 });
  await expect(fila).toContainText(PRODUCTO);
  await expect(fila.locator('td').last()).toHaveText(cantidad);
}
