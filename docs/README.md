# Índice de documentación

Estos archivos Markdown son la fuente del centro de conocimiento disponible en `/docs`. La aplicación conserva `/documentation` únicamente como redirección compatible para enlaces antiguos.

## Navegación publicada

- `/docs`: portada y búsqueda local por título, descripción y categoría.
- `/docs/:documentId`: lectura del Markdown autorizado para la sesión.
- Barra superior: accesos a Documentación, Producto, Arquitectura y Estado cuando el rol puede ver esos documentos.
- Escritorio: menú lateral fijo, documento activo, índice “En esta página” y regreso nativo a `/`.
- Móvil: menús desplegables, selector de documento, índice táctil y regreso a la aplicación.
- Pie de lectura: navegación Anterior/Siguiente en el orden del catálogo autorizado.

Los documentos se agrupan sin duplicarlos en `Producto`, `Arquitectura y desarrollo`, `Entrega` y `Gestión del proyecto`. No se muestra una categoría vacía solo para imitar otra plataforma.

## Puntos de entrada del repositorio

- [Arquitectura](ARCHITECTURE.md)
- [API](API.md)
- [Desarrollo](DEVELOPMENT.md)
- [Pruebas](TESTING.md)
- [Despliegue](DEPLOYMENT.md)
- [Operaciones](OPERATIONS.md)
- [Seguridad](SECURITY.md)
- [Solución de problemas](TROUBLESHOOTING.md)
- [Decisiones de arquitectura](adr/README.md)

Estos nombres estables orientan a colaboradores y herramientas. Los archivos numerados siguen siendo la fuente detallada que publica la aplicación.

| Documentos | Contenido                                          | Audiencia       |
| ---------- | -------------------------------------------------- | --------------- |
| 01–05      | visión, requisitos, arquitectura y estructura      | ADMIN           |
| 06–10      | instalación, configuración, API, datos y seguridad | ADMIN           |
| 11         | manual administrativo                              | ADMIN           |
| 12         | manual del participante                            | ADMIN / LEARNER |
| 13–15      | guías educativas y solución de problemas           | ADMIN           |
| 16–20      | fases, pruebas, despliegue, roadmap y cambios      | ADMIN           |
| 21         | glosario                                           | ADMIN / LEARNER |
| 22–25      | riesgos, aceptación, implementación y medios       | ADMIN           |
| 26–29      | demo, release y revisiones de cierre               | ADMIN           |

La API deriva el catálogo de nombres con formato seguro `NN-slug.md`. El rol `LEARNER` recibe únicamente `12-user-manual` y `21-glossary`; solicitar directamente otro documento responde 404 para no revelar contenido restringido.

## Crear o modificar documentos

1. Use codificación UTF-8 y un nombre `NN-slug.md` para documentos publicados dentro de la aplicación.
2. Agregue un único título `#` y encabezados `##`/`###` para generar el índice de página.
3. Evite HTML crudo; utilice Markdown y tablas GFM.
4. Revise enlaces relativos y determine si el documento debe ser visible al participante.
5. Añada o ajuste pruebas de autorización cuando cambie la audiencia.

No se usa VitePress ni existe un segundo sitio estático: el lector React mantiene autenticación, autorización por rol e identidad visual como única experiencia documental.

## DOC-STD-20261002 — Fuentes canónicas

Estándar documental v1.0 · revisión 2026-10-02. Idioma principal: español.

Plataforma de formación React/Express con contenido privado.

La API controla roles, asignaciones y medios privados. SQLite y JSON atómico tienen funciones distintas; conservar una única instancia escritora en producción. Las guías técnicas canónicas enlazan los manuales numerados. No publicar vídeos, bases de datos ni capturas de contenido sensible.

| Necesidad | Fuente oficial |
| --- | --- |
| Presentación | [README.md](../README.md) |
| Estado vigente | [CURRENT_STATUS.md](../CURRENT_STATUS.md) |
| Desarrollo | [docs/DEVELOPMENT.md](DEVELOPMENT.md) |
| Arquitectura | [docs/ARCHITECTURE.md](ARCHITECTURE.md) |
| API / contratos | [docs/API.md](API.md) |
| Pruebas | [docs/TESTING.md](TESTING.md) |
| Seguridad | [docs/SECURITY.md](SECURITY.md) |
| Despliegue | [docs/DEPLOYMENT.md](DEPLOYMENT.md) |
| Operación | [docs/OPERATIONS.md](OPERATIONS.md) |
| Solución de problemas | [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Uso | [docs/12-user-manual.md](12-user-manual.md) |
| Administración | [docs/11-admin-manual.md](11-admin-manual.md) |
| Configuración | [docs/07-configuration-guide.md](07-configuration-guide.md) |
| Modelo de datos | [docs/09-data-model.md](09-data-model.md) |
| Historia | [CHANGELOG.md](../CHANGELOG.md) |
| Decisiones | [docs/adr/README.md](adr/README.md) |

Para probar el producto, comenzar por presentación, estado y uso. Para desarrollar, continuar con instalación, arquitectura y pruebas. Para operar, consultar despliegue, seguridad y recuperación. El índice detallado existente conserva su validez.

### Evidencia y actualización

Separar estado vigente, historia y decisiones. Los resultados de pruebas fechados conservan su valor histórico. Este mapa no vuelve a ejecutar todos los comandos documentados ni cierra la aceptación pendiente del producto. Registrar las comprobaciones realmente ejecutadas, su entorno y sus límites antes de publicar.

Actualizar la guía de origen al cambiar comandos, configuración, comportamiento, permisos o despliegue. Mantener enlaces y rutas del portal. Usar capturas reales con datos sintéticos; nunca publicar valores de .env, claves, datos de usuarios ni logs operativos. Un commit local, un commit remoto y un artefacto desplegado son estados diferentes.
