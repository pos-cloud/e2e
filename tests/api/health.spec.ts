import { expect, test } from '@playwright/test';

import { PosApi } from '../../src/api';

test.describe('API de testing', () => {
  test('responde el health check', async ({ request }) => {
    const api = new PosApi(request);
    const { response, body } = await api.health();

    expect(response.status()).toBe(200);
    expect(body).toMatchObject({
      status: 'ok',
      service: 'api-core',
    });
  });
});
