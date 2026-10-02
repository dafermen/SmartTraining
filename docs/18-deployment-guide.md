# Guía de despliegue

> Diseño; el procedimiento se valida en Fase 9.

El MVP requiere una sola instancia con HTTPS, disco persistente, Node LTS, FFmpeg, secreto JWT administrado externamente y backup de `data`/`storage`. El frontend compilado puede servirse por un proxy; la API no expone almacenamiento como estático.

Antes de desplegar: cambiar credenciales demo, fijar CORS, habilitar TLS, validar permisos mínimos del usuario de proceso, límites de proxy para carga/Range, rotación de logs, monitoreo de disco y restauración probada. El escalado horizontal queda bloqueado hasta migrar JSON y medios a servicios compartidos adecuados.

La configuración ejecutable para `smarttraining.innovalogic.tech` se encuentra en `deploy/README.md`, junto con las plantillas de Nginx, `systemd` y variables de producción.
