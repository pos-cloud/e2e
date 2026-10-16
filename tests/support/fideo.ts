import { expect, Page } from '@playwright/test';

export const PRODUCTO = '00001';
export const DESCRIPCION = 'FIDEOS TALLARINES 500 GR';
/** Lo cuenta el inventario. La venta siguiente saca una unidad. */
export const STOCK_CONTADO = '5';
export const STOCK_TRAS_VENTA = '4';

export async function verStock(page: Page, cantidad: string): Promise<void> {
  await page.goto('/entities/article-stock');
  await expect(page.locator('.datatable-title')).toHaveText('Inventario', { timeout: 60_000 });

  const fila = page.locator('tbody tr', { hasText: DESCRIPCION });
  await expect(fila).toBeVisible({ timeout: 60_000 });
  await expect(fila).toContainText(PRODUCTO);
  await expect(fila.locator('td').last()).toHaveText(cantidad);
}
