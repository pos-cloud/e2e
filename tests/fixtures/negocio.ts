import { expect, request, test as base } from '@playwright/test';

import { PosApi } from '../../src/api';
import { serverEnv } from '../../src/config';
import { buildNegocio, Negocio } from '../../src/negocio';
import { conservar } from '../support/base';

export type NegocioDePrueba = Negocio & { password: string };

type TestFixtures = {
  anotarFallo: void;
};

type WorkerFixtures = {
  /** Un negocio nuevo para todo el worker. Si una prueba falla, la base queda. */
  negocio: NegocioDePrueba;
};

let conservarBase = false;

/**
 * Los circuitos que necesitan datos importan `test` desde acá.
 * El alta del formulario no lo usa: ese circuito crea el negocio desde la pantalla.
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  anotarFallo: [
    async ({}, use, testInfo) => {
      await use();
      if (testInfo.status !== testInfo.expectedStatus) conservarBase = true;
    },
    { auto: true },
  ],
  negocio: [
    async ({}, use) => {
      const credentials = serverEnv();
      if (!credentials) {
        throw new Error('PASS_ADMIN no está en /home/api-core/.env');
      }

      const negocio = buildNegocio();
      const context = await request.newContext();
      const api = new PosApi(context);
      let created = false;

      try {
        const registered = await api.register(negocio);
        expect(registered.response.status(), JSON.stringify(registered.body)).toBe(200);
        created = true;
        await use({ ...negocio, password: credentials.passAdmin });
      } finally {
        if (created && conservarBase) {
          conservar(negocio.database);
        } else if (created) {
          const removed = await api.deleteNegocio(negocio.database);
          expect(removed.response.status(), JSON.stringify(removed.body)).toBe(200);
        }
        await context.dispose();
      }
    },
    { scope: 'worker', timeout: 180_000 },
  ],
});

export { expect };
