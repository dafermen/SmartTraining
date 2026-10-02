# Licencias de terceros

Inventario de dependencias directas instalado y revisado el 2026-09-09. No sustituye los avisos incluidos en cada paquete ni el inventario transitivo del lockfile.

## Dependencias de ejecución

| Paquete                      | Versión | Licencia declarada |
| ---------------------------- | ------: | ------------------ |
| `@ffmpeg-installer/ffmpeg`   |   1.1.0 | LGPL-2.1           |
| `@ffprobe-installer/ffprobe` |   2.1.2 | LGPL-2.1           |
| `@tailwindcss/vite`          |   4.3.3 | MIT                |
| `axios`                      |  1.18.1 | MIT                |
| `bcrypt`                     |   6.0.0 | MIT                |
| `cors`                       |   2.8.6 | MIT                |
| `dotenv`                     |  17.4.2 | BSD-2-Clause       |
| `express`                    |   5.2.1 | MIT                |
| `express-rate-limit`         |   8.6.0 | MIT                |
| `helmet`                     |   8.3.0 | MIT                |
| `jsonwebtoken`               |   9.0.3 | MIT                |
| `multer`                     |   2.3.0 | MIT                |
| `react` / `react-dom`        |  19.2.7 | MIT                |
| `react-markdown`             |  10.1.0 | MIT                |
| `react-router-dom`           |  7.18.3 | MIT                |
| `remark-gfm`                 |   4.0.1 | MIT                |
| `tailwindcss`                |   4.3.3 | MIT                |
| `zod`                        |   4.4.3 | MIT                |

Las herramientas directas de desarrollo usan principalmente MIT; incluyen Playwright 1.63.0, fast-check 4.9.0 y Vitest 4.1.11. TypeScript declara Apache-2.0.

## Verificación antes de release

1. Regenerar el inventario desde los tres `package-lock.json`.
2. Revisar dependencias transitivas, avisos y obligaciones de redistribución.
3. Revisar especialmente los binarios FFmpeg/ffprobe y los codecs habilitados.
4. Conservar los archivos de licencia que distribuyen los paquetes.

Una actualización de dependencia debe actualizar este archivo si cambia nombre, versión o licencia.
