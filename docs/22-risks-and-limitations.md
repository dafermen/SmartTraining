# Riesgos y limitaciones

| Riesgo                          | Prob./impacto | Mitigación MVP                                   | Señal de migración                           |
| ------------------------------- | ------------- | ------------------------------------------------ | -------------------------------------------- |
| Concurrencia/corrupción JSON    | media/alta    | mutex, esquema, temporal, backup                 | múltiples instancias o escrituras frecuentes |
| Pérdida de disco                | baja/alta     | backups externos y restauración probada          | requisito de alta disponibilidad             |
| FFmpeg consume recursos         | media/alta    | cola local, límites y timeout                    | volumen sostenido de cargas                  |
| JWT en almacenamiento web       | media/alta    | vida corta, CSP y educación                      | despliegue productivo público                |
| MIME falsificado                | media/alta    | extensión, MIME, magic bytes y ffprobe           | contenido no confiable a escala              |
| Descarga por usuario autorizado | alta/media    | permisos y no URL pública                        | DRM/requisitos regulatorios                  |
| Cascadas parciales              | baja/alta     | unidad de trabajo, idempotencia y reconciliación | operaciones complejas/multiusuario           |
| Documentación desactualizada    | media/media   | cambios de contrato exigen docs/board            | crecimiento del equipo                       |

Los JSON de contenido limitan volumen, consultas, transacciones y escalado; las identidades ya usan SQLite con auditoría administrativa. El MVP no promete DRM, alta disponibilidad, cumplimiento normativo ni recuperación ante desastres sin operación adicional.

## Limitaciones operativas confirmadas

- La aplicación está diseñada para una sola instancia del backend. No ejecute dos procesos escribiendo sobre los mismos JSON.
- Los videos viven en el disco privado del servidor; un backup solamente de `app` o `public_html` no conserva el contenido.
- El procesamiento FFmpeg ocurre en el mismo servidor y puede competir por CPU, memoria y disco durante cargas grandes.
- Un usuario autorizado puede capturar el contenido reproducido. El streaming protegido evita una URL pública, pero no constituye DRM.
- Las cuentas de demostración usan una contraseña conocida y deben reemplazarse antes de un uso productivo real.
- No existen todavía recuperación de contraseña de autoservicio, asignaciones masivas por grupos/departamentos, recordatorios, notificaciones ni auditoría completa de contenido. La asignación individual con fecha límite, el restablecimiento por administrador y las auditorías de usuarios/asignaciones sí están disponibles.
- La validación responsive automatizada comprueba estructura y accesibilidad básica; la aceptación final requiere pruebas en navegadores y teléfonos reales.

## Responsabilidades de operación

El operador debe mantener HTTPS, espacio disponible, permisos de `/var/lib/smarttraining`, FFmpeg, backups externos y monitoreo de `systemd`/Nginx. Antes de actualizar debe respaldar el directorio persistente completo y nunca sustituirlo con los JSON del repositorio.
