# Notas de entrega — MVP 0.1.0

Estado del artefacto: **candidato de release**. El código compila y las pruebas automatizadas deben ejecutarse nuevamente en el servidor de destino antes de etiquetar la versión.

## Incluido

- Identidad visual índigo y ámbar con logo y favicon orientados al aprendizaje digital.
- Autenticación y autorización `ADMIN`/`LEARNER`.
- Gestión de capacitaciones, módulos, publicación y orden.
- Carga múltiple, procesamiento FFmpeg, miniaturas y reintento de videos fallidos.
- Streaming autenticado con HTTP Range.
- Catálogo, reproductor, reanudación y finalización configurable.
- Consulta administrativa de progreso.
- Reinicio individual del progreso de un video por parte de un administrador, con auditoría.
- Administración de usuarios, roles, estado y contraseñas sobre SQLite.
- Asignación individual de capacitaciones publicadas con fecha límite opcional, auditoría y autorización integral de catálogo, módulos, videos y progreso.
- Documentación integrada por rol.
- Experiencia responsive y optimización por carga diferida de rutas.
- Despliegue Ubuntu con systemd, Nginx y HTTPS.

## Antes de publicar la versión

```bash
npm ci
npm ci --prefix frontend
npm ci --prefix backend
npm run predeploy:core
```

Complete además las trece puertas de [TESTING.md](TESTING.md) en `test/pre-deployment-evidence-template.md`. El comando automatizado no sustituye mutation testing, fuzzing, E2E, resiliencia, rendimiento ni validación de compatibilidad.

Después valide login, carga, reproducción, progreso y cierre de sesión en el dominio final. El tag solamente debe crearse desde un repositorio Git limpio que corresponda exactamente con el artefacto validado.

## Actualización

Respaldar `/var/lib/smarttraining`, transferir el código a `app`, instalar dependencias, compilar, copiar **todo** `frontend/dist/.` a `public_html`, reiniciar la API y validar Nginx. Nunca reemplace los datos persistentes con `backend/data` durante una actualización.

## Limitaciones conocidas

Consulte [Riesgos y limitaciones](22-risks-and-limitations.md). El candidato no incluye recuperación de contraseña de autoservicio, asignación por grupos/departamentos, recordatorios, notificaciones, auditoría completa de contenido, procesamiento distribuido, almacenamiento de objetos ni DRM.
