# Guía de configuración

| Variable                         | Propósito                   | Validación                                       |
| -------------------------------- | --------------------------- | ------------------------------------------------ |
| `NODE_ENV`                       | comportamiento del entorno  | development, test, production                    |
| `PORT`                           | puerto HTTP                 | entero 1–65535                                   |
| `FRONTEND_URL`                   | origen CORS                 | URL absoluta                                     |
| `JWT_SECRET`                     | firma de tokens             | mínimo 32 caracteres; secreto real en producción |
| `JWT_EXPIRES_IN`                 | vida del JWT                | formato aceptado por la biblioteca               |
| `MAX_VIDEO_SIZE_MB`              | límite de carga             | entero positivo                                  |
| `USER_DATABASE_PATH`             | base SQLite de usuarios     | archivo privado en directorio escribible         |
| `*_STORAGE_PATH`                 | directorios de datos/medios | rutas resueltas dentro de raíces permitidas      |
| `DOCUMENTATION_PATH`             | raíz Markdown               | directorio legible; por defecto `../docs`        |
| `FFMPEG_PATH`, `FFPROBE_PATH`    | binarios opcionales         | ejecutables existentes o vacío para PATH         |
| `VIDEO_COMPLETION_PERCENTAGE`    | umbral de finalización      | número 1–100                                     |
| `PROGRESS_SAVE_INTERVAL_SECONDS` | frecuencia cliente          | entero recomendado 5–60                          |

La API debe fallar al iniciar si falta configuración crítica. La carpeta de `USER_DATABASE_PATH` debe pertenecer al usuario del servicio; SQLite necesita crear también sus archivos `-wal` y `-shm`. Las rutas de medios se resuelven una vez y se validan contra su directorio base para prevenir traversal. La documentación sólo acepta nombres descubiertos con el patrón `NN-slug.md`; el cliente nunca proporciona una ruta física.
