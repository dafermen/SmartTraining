# Despliegue

La guía operativa canónica está en [`../deploy/README.md`](../deploy/README.md). El resumen de arquitectura de despliegue está en [18-deployment-guide.md](18-deployment-guide.md).

## Condición previa obligatoria

Antes de desplegar deben revisarse las trece puertas de [TESTING.md](TESTING.md). Cada una debe quedar como:

- `PASS`: existe evidencia de esta versión;
- `N/A`: no aplica y existe justificación aprobada;
- `BLOCKED`: no existe evidencia suficiente y el despliegue no puede continuar.

`npm run predeploy:core` cubre las puertas automatizadas actuales, incluida la base E2E con Chromium. No reemplaza aceptación, recorridos E2E multimedia completos, rendimiento, resiliencia ni compatibilidad manual en Ubuntu y dispositivos reales.

## Protección de producción

- Respaldar `/var/lib/smarttraining`.
- No ejecutar el seed ni copiar `backend/data` sobre producción.
- Publicar fuentes en `app` y únicamente `frontend/dist` en `public_html`.
- Validar `nginx -t` antes de recargar.
- Confirmar health, login, carga, reproducción, progreso, auditoría y cierre de sesión.
