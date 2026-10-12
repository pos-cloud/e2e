import fs from 'fs';
import path from 'path';

import { APIRequestContext, expect, TestInfo } from '@playwright/test';

import { PosApi } from '../../src/api';
import { serverEnv, testing } from '../../src/config';

const aviso = path.join('test-results', 'bases-conservadas.txt');

/** Si la prueba falló, deja la base creada y anota cómo entrar. Si pasó, la borra. */
export async function cerrarNegocio(
  request: APIRequestContext,
  testInfo: TestInfo,
  database: string
): Promise<void> {
  if (!database) return;

  if (testInfo.status !== testInfo.expectedStatus) {
    conservar(database);
    return;
  }

  const api = new PosApi(request);
  const removed = await api.deleteNegocio(database);
  expect(removed.response.status(), JSON.stringify(removed.body)).toBe(200);

  const login = await api.login({
    database,
    user: 'admin',
    password: serverEnv()!.passAdmin,
  });
  expect(login.response.status()).toBe(404);
  expect(login.body.message).toBe('El negocio no existe');
}

export function conservar(database: string): void {
  const texto = [
    `BASE CONSERVADA ${database}`,
    `Entrá en ${testing.webURL}/login`,
    `Negocio: ${database}`,
    'Usuario: admin',
    'Clave: PASS_ADMIN del servidor',
  ].join('\n');

  console.log(`\n${texto}\n`);
  fs.mkdirSync(path.dirname(aviso), { recursive: true });
  fs.appendFileSync(aviso, `${texto}\n\n`);
}
