# e2e

Pruebas de regresión de POS Cloud contra testing.

- Front: `https://dev.poscloud.ar`
- API: `https://d-api-v2.poscloud.ar`

Corren en el runner `dev` de GitHub, el mismo servidor del entorno de testing. La clave del usuario `admin` se lee de `/home/api-core/.env` (`PASS_ADMIN`). No hay un `.env` propio de este repo.

## Carpetas

```text
tests/api/        la API responde
tests/ui/         una pantalla
tests/circuits/   un archivo por circuito de negocio
tests/fixtures/   negocio nuevo para los circuitos que necesitan datos
```

Cada circuito que necesite datos crea su negocio y lo borra al terminar.

## En el runner

El workflow `.github/workflows/e2e.yml` se dispara con un push a `main` y también a mano. El runner es Debian 11 y Playwright ya no instala Chromium ahí, así que las pruebas corren en la imagen `mcr.microsoft.com/playwright:v1.64.0-jammy`, que trae el navegador. El contenedor lee `/home/api-core/.env` del servidor.

El reporte se publica en GitHub Pages. El link queda en la corrida, en el environment `github-pages`. Cada corrida reemplaza el reporte anterior. Hay que dejar Pages en Source: GitHub Actions, con visibilidad privada.

## En la máquina local

Sin el archivo del servidor, el alta y las lecturas del negocio nuevo no corren. El health check y los rechazos de login sí.

```bash
npm install
npx playwright install chromium
npm test
```
