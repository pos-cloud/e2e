import { expect, test } from '@playwright/test';

import { serverEnv } from '../../src/config';
import { STOCK_TRAS_DESCUENTO, verStock } from '../support/fideo';
import { iniciarSesion } from '../support/kiosco';
import { leerNegocio } from '../support/negocio-corrido';
import { parsePrecioUi } from '../support/precio';
import {
  abrirTicketMostrador,
  aplicarDescuentoPorcentaje,
  confirmarCobroCancelandoFinalizar,
  escanearFideo,
  iniciarCobroEfectivo,
} from '../support/venta';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test('vende una unidad del fideo con 10% de descuento', async ({ page }) => {
  const negocio = leerNegocio();
  const password = serverEnv()!.passAdmin;

  const login = await iniciarSesion(page, negocio, password);
  expect(login.response.status(), JSON.stringify(login.body)).toBe(200);

  await abrirTicketMostrador(page);
  const lineas = await escanearFideo(page, 1);

  const precio = parsePrecioUi(await lineas.first().locator('td').nth(2).innerText());
  expect(precio).toBeGreaterThan(0);

  await aplicarDescuentoPorcentaje(page, '10');

  const total = await iniciarCobroEfectivo(page);
  expect(Number(total)).toBeGreaterThan(0);
  expect(Number(total)).toBeCloseTo(precio * 0.9, 2);

  await confirmarCobroCancelandoFinalizar(page);
  await verStock(page, STOCK_TRAS_DESCUENTO);
});
