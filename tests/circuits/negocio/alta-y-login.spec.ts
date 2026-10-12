import { expect, test } from '@playwright/test';

import { PosApi } from '../../../src/api';
import { serverEnv } from '../../../src/config';
import { buildNegocio } from '../../../src/negocio';
import { crearKiosco, iniciarSesion } from '../../support/kiosco';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test.describe('Alta y login de un negocio', () => {
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

  test('crea un kiosco con todos los checks, entra y al final no queda la base', async ({ page }) => {
    const negocio = buildNegocio();
    const password = serverEnv()!.passAdmin;

    const alta = await crearKiosco(page, negocio);
    if (alta.response.status() === 200) database = negocio.database;

    expect(alta.response.status(), JSON.stringify(alta.body)).toBe(200);
    expect(String(alta.body.message)).toContain('Bienvenido');

    const login = await iniciarSesion(page, negocio, password);
    expect(login.response.status(), JSON.stringify(login.body)).toBe(200);
    expect(login.body.result?.user?.name ?? login.body.result?.user).toBeTruthy();
  });
});
