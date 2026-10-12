import { expect, test } from '@playwright/test';

import { serverEnv } from '../../../src/config';
import { buildNegocio } from '../../../src/negocio';
import { cerrarNegocio } from '../../support/base';
import { crearKiosco, iniciarSesion } from '../../support/kiosco';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test.describe('Alta y login de un negocio', () => {
  let database = '';

  test.afterEach(async ({ request }, testInfo) => {
    const nombre = database;
    database = '';
    await cerrarNegocio(request, testInfo, nombre);
  });

  test('crea un kiosco con todos los checks, entra y al final no queda la base', async ({ page }) => {
    const negocio = buildNegocio();
    const password = serverEnv()!.passAdmin;
    database = negocio.database;

    const alta = await crearKiosco(page, negocio);

    expect(alta.response.status(), JSON.stringify(alta.body)).toBe(200);
    expect(String(alta.body.message)).toContain('Bienvenido');

    const login = await iniciarSesion(page, negocio, password);
    expect(login.response.status(), JSON.stringify(login.body)).toBe(200);
    expect(login.body.result?.user?.name ?? login.body.result?.user).toBeTruthy();
  });
});
