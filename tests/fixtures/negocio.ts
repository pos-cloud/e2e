import { test as base } from '@playwright/test';

import { serverEnv } from '../../src/config';
import { Negocio } from '../../src/negocio';
import { leerNegocio } from '../support/negocio-corrido';

export type NegocioDePrueba = Negocio & { password: string };

type Fixtures = {
  /** El negocio que registró el alta de esta corrida. */
  negocio: NegocioDePrueba;
};

export const test = base.extend<Fixtures>({
  negocio: async ({}, use) => {
    const credentials = serverEnv();
    if (!credentials) {
      throw new Error('PASS_ADMIN no está en /home/api-core/.env');
    }

    await use({ ...leerNegocio(), password: credentials.passAdmin });
  },
});

export { expect } from '@playwright/test';
