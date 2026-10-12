import { expect, test } from '@playwright/test';

import { serverEnv } from '../../src/config';
import { iniciarSesion } from '../support/kiosco';
import { leerNegocio } from '../support/negocio-corrido';

const PRODUCTO = '00001';
const DESCRIPCION = 'FIDEOS TALLARINES 500 GR';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test('vende el fideo del kiosco, imprime el ticket y lo muestra', async ({ page }, testInfo) => {
  const negocio = leerNegocio();
  const password = serverEnv()!.passAdmin;

  await page.addInitScript(() => {
    window.print = () => undefined;

    const mostrar = (frame: HTMLIFrameElement) => {
      frame.style.setProperty('visibility', 'visible', 'important');
      frame.style.setProperty('opacity', '1', 'important');
      frame.style.setProperty('position', 'fixed', 'important');
      frame.style.setProperty('inset', '0', 'important');
      frame.style.setProperty('width', '100vw', 'important');
      frame.style.setProperty('height', '100vh', 'important');
      frame.style.setProperty('z-index', '2147483647', 'important');
      frame.style.setProperty('border', '0', 'important');
      frame.style.setProperty('background', '#fff', 'important');
    };

    const quitar = Element.prototype.remove;
    Element.prototype.remove = function () {
      if (this.id === 'printJS') return;
      return quitar.call(this);
    };

    new MutationObserver(() => {
      const frame = document.getElementById('printJS');
      if (frame instanceof HTMLIFrameElement) mostrar(frame);
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  });

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
  await expect(page.getByRole('heading', { name: 'Finalizar Transacción' })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Imprimir', exact: true }).click();

  const impreso = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/to-print/transaction'),
    { timeout: 60_000 }
  );
  await page.getByRole('button', { name: 'Confirmar' }).click();

  const ticket = await impreso;
  const pdf = await ticket.body();
  expect(ticket.status(), pdf.subarray(0, 180).toString('utf8')).toBe(200);
  expect(pdf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  await testInfo.attach('ticket.pdf', { body: pdf, contentType: 'application/pdf' });

  const visor = page.locator('#printJS');
  await expect(visor).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => visor.getAttribute('src')).toMatch(/^blob:/);
  await page.waitForTimeout(2_000);
});
