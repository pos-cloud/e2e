import { PosApi, Session } from '../../src/api';
import { serverEnv } from '../../src/config';
import { tenantResources } from '../../src/resources';
import { expect, test } from '../fixtures/negocio';

test.skip(!serverEnv(), 'Corre en el runner dev, que lee /home/api-core/.env');

test.describe('Lectura del negocio recién creado', () => {
  let session: Session | undefined;

  test.beforeEach(async ({ request, negocio }) => {
    if (session?.database === negocio.database) return;

    const api = new PosApi(request);
    const { response, body } = await api.login({
      database: negocio.database,
      user: negocio.user,
      password: negocio.password,
    });

    expect(response.status(), JSON.stringify(body)).toBe(200);
    session = api.sessionFrom(negocio.database, body);
  });

  for (const resource of tenantResources) {
    test(`${resource.area}: lista ${resource.name}`, async ({ request }) => {
      const api = new PosApi(request);
      const { response, body } = await api.list(session!, resource.path);

      expect(response.status(), `${resource.path} ${JSON.stringify(body)}`).toBe(200);
      expect(body.status).toBe(200);
      expect(Array.isArray(body.result), `${resource.path} no devolvió una lista`).toBe(true);
    });
  }
});
