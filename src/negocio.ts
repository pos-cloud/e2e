export type Negocio = {
  database: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  businessModel: string;
  modules: string[];
  integrations: string[];
  /** Usuario dueño que crea el alta. La clave es PASS_ADMIN del servidor. */
  user: 'admin';
};

/** Nombre de base: minúsculas y números, como lo normaliza el registro, máximo 20. */
export function buildNegocio(): Negocio {
  const stamp = Date.now().toString(36);
  const extra = Math.random().toString(36).slice(2, 5);
  const database = `e2e${stamp}${extra}`.replace(/[^a-z0-9]/g, '').slice(0, 20);

  return {
    database,
    fullName: 'Prueba E2E',
    email: `${database}@example.com`,
    phone: '3510000000',
    country: 'AR',
    businessModel: 'kiosco',
    modules: ['ventas', 'compras', 'stock', 'caja', 'produccion', 'turnos', 'suscripciones'],
    integrations: ['tienda-nube', 'woo-commerce', 'facturacion-electronica', 'mercado-libre'],
    user: 'admin',
  };
}
