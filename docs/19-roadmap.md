# Roadmap

El MVP está operativo. Las siguientes etapas se priorizan por reducción de riesgo y valor para organizaciones reales.

## Próxima entrega — operación segura

1. Recuperación de contraseña de autoservicio mediante enlace temporal (la administración y el restablecimiento por ADMIN ya están completados).
2. Extender la asignación individual ya disponible a grupos o departamentos.
3. Agregar recordatorios y notificaciones para las fechas límite ya disponibles.
4. Auditoría de accesos, cambios de contenido y eventos administrativos.
5. Backups automatizados con prueba periódica de restauración.

## Escalamiento técnico

1. Migrar JSON a PostgreSQL cuando existan escrituras concurrentes, múltiples instancias o necesidades de consulta avanzada.
2. Migrar videos y miniaturas a almacenamiento de objetos compatible con S3.
3. Mover FFmpeg a una cola de trabajos con workers aislados, reintentos y límites de recursos.
4. Agregar observabilidad centralizada: métricas, alertas, trazas y retención de logs.
5. Incorporar análisis antivirus y políticas de retención de archivos.

## Evolución del aprendizaje

- Evaluaciones, intentos, puntajes y bancos de preguntas.
- Certificados verificables y exportación PDF.
- Rutas de aprendizaje, prerrequisitos y contenido obligatorio.
- Reportes y analítica por persona, equipo, capacitación y período.
- Interoperabilidad SCORM/xAPI cuando exista una necesidad contractual.

## Capacidades empresariales

- SSO mediante OIDC/SAML.
- Roles personalizados y permisos granulares.
- Multi-organización y separación lógica de datos.
- Políticas de cumplimiento, consentimiento y retención.

La arquitectura mantiene servicios y repositorios intercambiables, pero estas capacidades no forman parte del alcance actual. Cada migración debe activarse por una señal observable, no solamente por crecimiento previsto.
