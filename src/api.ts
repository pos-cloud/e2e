import { APIRequestContext, APIResponse } from '@playwright/test';

import { serverEnv, testing } from './config';
import { Negocio } from './negocio';

export type ApiBody = {
  status?: number;
  result?: unknown;
  message?: string;
  code?: string;
  error?: unknown;
};

export type Session = {
  database: string;
  token: string;
  refreshToken?: string;
  user: Record<string, unknown>;
};

export class PosApi {
  constructor(private readonly request: APIRequestContext) {}

  async health(): Promise<{ response: APIResponse; body: ApiBody }> {
    const response = await this.request.get(apiUrl('/health'));
    return { response, body: await readJson(response) };
  }

  async register(negocio: Negocio): Promise<{ response: APIResponse; body: ApiBody }> {
    const response = await this.request.post(apiUrl('/auth/register'), {
      data: {
        fullName: negocio.fullName,
        companyName: negocio.database,
        email: negocio.email,
        phone: negocio.phone,
        country: negocio.country,
        businessModel: negocio.businessModel,
        integrations: negocio.integrations,
        modules: negocio.modules,
      },
    });

    return { response, body: await readJson(response) };
  }

  async deleteNegocio(database: string): Promise<{ response: APIResponse; body: ApiBody }> {
    const credentials = serverEnv();
    if (!credentials) {
      throw new Error(`No hay PASS_ADMIN en ${testing.serverEnvFile}`);
    }

    const token = Buffer.from(`${credentials.adminUser}:${credentials.passAdmin}`).toString('base64');
    const response = await this.request.post(apiUrl('/licenses/delete'), {
      headers: { Authorization: `Basic ${token}` },
      data: { nombreBase: database, confirmation: database },
    });

    return { response, body: await readJson(response) };
  }

  async login(input: { database: string; user: string; password: string }): Promise<{ response: APIResponse; body: ApiBody }> {
    const payload: Record<string, string> = {
      password: input.password,
      platform: 'web',
    };

    if (input.user.includes('@')) payload.email = input.user;
    else payload.name = input.user;

    const response = await this.request.post(apiUrl(`/auth/login?database=${encodeURIComponent(input.database)}`), {
      data: payload,
    });

    return { response, body: await readJson(response) };
  }

  sessionFrom(database: string, body: ApiBody): Session {
    const result = (body.result ?? {}) as {
      token?: string | { token?: string };
      refreshToken?: string;
      user?: Record<string, unknown>;
    };
    const token = typeof result.token === 'string' ? result.token : result.token?.token;

    if (!token) {
      throw new Error(`El login no devolvió token: ${JSON.stringify(body)}`);
    }

    return {
      database,
      token,
      refreshToken: result.refreshToken,
      user: result.user ?? {},
    };
  }

  async list(session: Session, path: string, limit = 1): Promise<{ response: APIResponse; body: ApiBody }> {
    const response = await this.request.get(apiUrl(path), {
      headers: { Authorization: session.token },
      params: {
        project: '{}',
        match: '{}',
        sort: '{}',
        group: '{}',
        limit: String(limit),
        skip: '0',
      },
    });

    return { response, body: await readJson(response) };
  }
}

function apiUrl(path: string): string {
  const base = testing.apiURL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function readJson(response: APIResponse): Promise<ApiBody> {
  try {
    return (await response.json()) as ApiBody;
  } catch {
    return { message: await response.text() };
  }
}
