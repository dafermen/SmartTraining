# Solución de problemas

La guía canónica y detallada está en [15-troubleshooting.md](15-troubleshooting.md). Los incidentes específicos de Ubuntu, Nginx, systemd, FFmpeg y cargas grandes están en [`../deploy/README.md`](../deploy/README.md).

## Recolección segura

Registrar:

- fecha y zona horaria;
- entorno y versión desplegada;
- ruta y código HTTP;
- estado de `smarttraining.service`;
- últimas líneas relevantes del journal y Nginx.

No adjuntar contraseñas, JWT, cookies, cuerpos de login, `.env`, hashes ni archivos de video privados.
