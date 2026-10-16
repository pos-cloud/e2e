import { expect, test } from '@playwright/test';

import { serverEnv } from '../../src/config';
import { cerrarCaja, verCajasAbiertas } from '../support/caja';
import { iniciarSesion } from '../support/kiosco';
import { leerNegocio } from '../support/negocio-corrido';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test('cierra la caja abierta', async ({ page }) => {
  const negocio = leerNegocio();
  const password = serverEnv()!.passAdmin;

  const login = await iniciarSesion(page, negocio, password);
  expect(login.response.status(), JSON.stringify(login.body)).toBe(200);

  await cerrarCaja(page);
  await verCajasAbiertas(page, false);
});
