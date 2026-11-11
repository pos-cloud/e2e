import { expect, test } from '@playwright/test';

import { serverEnv } from '../../src/config';
import { STOCK_TRAS_TRES_SCANS, verStock } from '../support/fideo';
import { iniciarSesion } from '../support/kiosco';
import { leerNegocio } from '../support/negocio-corrido';
import { parsePrecioUi } from '../support/precio';
import {
  abrirTicketMostrador,
  confirmarCobroCancelandoFinalizar,
  escanearFideo,
  iniciarCobroEfectivo,
} from '../support/venta';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test('vende tres unidades del fideo por scan y descuenta el inventario', async ({ page }) => {
  const negocio = leerNegocio();
  const password = serverEnv()!.passAdmin;

  const login = await iniciarSesion(page, negocio, password);
  expect(login.response.status(), JSON.stringify(login.body)).toBe(200);

  await abrirTicketMostrador(page);
  const lineas = await escanearFideo(page, 3);

  const precioPrimera = parsePrecioUi(await lineas.first().locator('td').nth(2).innerText());
  expect(precioPrimera).toBeGreaterThan(0);

  const total = await iniciarCobroEfectivo(page);
  expect(Number(total)).toBeGreaterThan(0);
  expect(Number(total)).toBeCloseTo(precioPrimera * 3, 2);

  await confirmarCobroCancelandoFinalizar(page);
  await verStock(page, STOCK_TRAS_TRES_SCANS);
});
