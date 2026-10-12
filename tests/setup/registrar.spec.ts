import { expect, test } from '@playwright/test';

import { serverEnv } from '../../src/config';
import { buildNegocio } from '../../src/negocio';
import { crearKiosco, iniciarSesion } from '../support/kiosco';
import { guardarNegocio } from '../support/negocio-corrido';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');
test.describe.configure({ retries: 0 });

test('registra un kiosco y lo deja para el resto de la corrida', async ({ page }) => {
  const negocio = buildNegocio();
  const password = serverEnv()!.passAdmin;

  const alta = await crearKiosco(page, negocio);
  expect(alta.response.status(), JSON.stringify(alta.body)).toBe(200);
  expect(String(alta.body.message)).toContain('Bienvenido');

  guardarNegocio(negocio);

  const login = await iniciarSesion(page, negocio, password);
  expect(login.response.status(), JSON.stringify(login.body)).toBe(200);
  expect(login.body.result?.user?.name ?? login.body.result?.user).toBeTruthy();
});
