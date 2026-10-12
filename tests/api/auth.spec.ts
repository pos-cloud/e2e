import { expect, test } from '@playwright/test';

import { PosApi } from '../../src/api';

test.describe('Login contra testing', () => {
  test('rechaza el login si no se indica el negocio', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: { email: 'nobody@example.com', password: 'wrong', platform: 'web' },
    });
    const body = await response.json();

    expect(response.status()).toBe(500);
    expect(body.message).toContain('clientId');
  });

  test('rechaza un negocio que no existe', async ({ request }) => {
    const api = new PosApi(request);
    const { response, body } = await api.login({
      database: 'e2e-negocio-inexistente',
      user: 'nobody',
      password: 'wrong',
    });

    expect(response.status()).toBe(404);
    expect(body.message).toBe('El negocio no existe');
  });

  test('exige token para leer artículos', async ({ request }) => {
    const response = await request.get('/articles');
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(body.message).toBe('authentication token missing');
  });
});
