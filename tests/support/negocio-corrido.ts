import fs from 'fs';
import path from 'path';

import { testing } from '../../src/config';
import { Negocio } from '../../src/negocio';

const archivo = path.join('test-results', 'negocio.json');
const aviso = path.join('test-results', 'bases-conservadas.txt');

/** La deja anotada para el resto de la corrida y para el resumen de GitHub. */
export function guardarNegocio(negocio: Negocio): void {
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, JSON.stringify(negocio, null, 2));

  const texto = [
    `BASE ${negocio.database}`,
    `Entrá en ${testing.webURL}/login`,
    `Negocio: ${negocio.database}`,
    'Usuario: admin',
    'Clave: PASS_ADMIN del servidor',
    'La usan todas las pruebas de esta corrida.',
  ].join('\n');

  fs.writeFileSync(aviso, `${texto}\n`);
  console.log(`\n${texto}\n`);
}

export function leerNegocio(): Negocio {
  if (!fs.existsSync(archivo)) {
    throw new Error('No hay negocio de esta corrida. Primero tiene que correr el alta.');
  }

  return JSON.parse(fs.readFileSync(archivo, 'utf8')) as Negocio;
}
