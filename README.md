# e2e

Pruebas de regresión de POS Cloud contra testing.

- Front: `https://dev.poscloud.ar`
- API: `https://d-api-v2.poscloud.ar`

Corren en el runner `dev` de GitHub, el mismo servidor del entorno de testing. La clave del usuario `admin` se lee de `/home/api-core/.env` (`PASS_ADMIN`). No hay un `.env` propio de este repo.

## Carpetas

```text
tests/setup/      registra un kiosco, una sola vez por corrida
tests/api/        la API responde, sobre ese negocio
tests/ui/         una pantalla
tests/circuits/   un archivo por circuito. El nombre ordena: 02-venta, 03-...
```

Cada corrida registra un negocio cuyo nombre empieza con `e2e` y lo anota en el resumen. La venta, los listados y los circuitos que se sumen usan esa misma base. No se borra al terminar: en testing, ops las borra cada 10 días. El alta marca todas las integraciones y módulos de un kiosco. `venta-ticket` vende el producto `00001` (FIDEOS TALLARINES 500 GR), pide el PDF del ticket y lo deja en pantalla.

## En el runner

El workflow `.github/workflows/e2e.yml` se dispara con un push a `main` y también a mano. El runner es Debian 11 y Playwright ya no instala Chromium ahí, así que las pruebas corren en la imagen `mcr.microsoft.com/playwright:v1.64.0-jammy`, que trae el navegador. El contenedor lee `/home/api-core/.env` del servidor.

El reporte se publica en GitHub Pages e incluye el video de las pruebas que abren el navegador. El link queda en la corrida, en el environment `github-pages`, y cada corrida reemplaza el anterior. El repo tiene que ser público y Pages tiene que estar en Source: GitHub Actions.

## En la máquina local

Sin el archivo del servidor, el alta y las lecturas del negocio nuevo no corren. El health check y los rechazos de login sí.

```bash
npm install
npx playwright install chromium
npm test
```
