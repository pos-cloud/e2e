import { expect, test } from '@playwright/test';

import { PosApi } from '../../../src/api';
import { serverEnv } from '../../../src/config';
import { buildNegocio } from '../../../src/negocio';
import { crearKiosco, iniciarSesion } from '../../support/kiosco';

const PRODUCTO = '00001';
const DESCRIPCION = 'FIDEOS TALLARINES 500 GR';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test.describe('Venta e impresión de ticket', () => {
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

  test('vende el fideo del kiosco, imprime el ticket y lo muestra', async ({ page }, testInfo) => {
    const negocio = buildNegocio();
    const password = serverEnv()!.passAdmin;

    await page.addInitScript(() => {
      window.print = () => undefined;
    });

    const alta = await crearKiosco(page, negocio);
    if (alta.response.status() === 200) database = negocio.database;

    expect(alta.response.status(), JSON.stringify(alta.body)).toBe(200);
    expect(String(alta.body.message)).toContain('Bienvenido');

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

    await page.route('https://ticket.e2e.local/ticket.pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: { 'Content-Disposition': 'inline; filename="ticket.pdf"' },
        body: pdf,
      });
    });

    await page.goto('https://ticket.e2e.local/ticket.pdf');
    await expect(page).toHaveURL(/ticket\.pdf$/);
    await page.waitForTimeout(2_000);

    const pantalla = await page.screenshot({ fullPage: true });
    await testInfo.attach('ticket-pantalla.png', { body: pantalla, contentType: 'image/png' });
  });
});