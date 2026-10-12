import fs from 'fs';

/** Este repo pega siempre al entorno de testing. */
export const testing = {
  apiURL: 'https://d-api-v2.poscloud.ar',
  webURL: 'https://dev.poscloud.ar',
  /** .env del API en el runner dev. Ahí está PASS_ADMIN. */
  serverEnvFile: '/home/api-core/.env',
};

export type ServerEnv = {
  passAdmin: string;
  adminUser: string;
};

export function serverEnv(): ServerEnv | null {
  if (!fs.existsSync(testing.serverEnvFile)) return null;

  const values = parseEnv(fs.readFileSync(testing.serverEnvFile, 'utf8'));
  const passAdmin = values.PASS_ADMIN?.trim();
  if (!passAdmin) return null;

  return {
    passAdmin,
    adminUser: values.ADMIN_USER?.trim() || 'admin',
  };
}

function parseEnv(content: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}
