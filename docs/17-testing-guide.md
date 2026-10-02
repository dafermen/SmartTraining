# Guía de pruebas

La estrategia usa pirámide: unitarias para reglas/repositorio, integración Supertest para API y componentes con React Testing Library. Los flujos mínimos cubren login correcto/incorrecto, 401, 403, CRUD, validación de carga, Range 206/416, progreso/80 %, corrupción JSON, rutas protegidas y render Markdown.

Cada corrección debe incluir una prueba que falle antes y pase después. Los archivos temporales de pruebas viven en directorios aislados y nunca usan `backend/data` real. En CI se ejecutarán lint, tipos, pruebas y build.

## Estado actual

La suite Vitest contiene 62 pruebas: 23 del frontend y 39 del backend, incluidas seis propiedades generativas. Playwright agrega seis recorridos en navegador: tres escenarios ejecutados en escritorio y móvil. En total hay 68 comprobaciones automatizadas.

Las pruebas cubren servicios y validadores, persistencia JSON, seed idempotente, contratos REST, autenticación, matriz de permisos, límite de carga, procesamiento, streaming completo/parcial, progreso, reinicio administrativo aislado por participante, auditoría, rutas protegidas, navegación móvil, filtros, ordenamiento, paginación, rutas privadas de medios y los flujos E2E iniciales de ambos roles.

La Fase 8 permanece abierta únicamente por la matriz visual manual. Debe comprobarse en teléfono, tableta y escritorio que no exista desplazamiento horizontal accidental, que los controles táctiles sean operables y que carga, reproducción, documentación y cierre de sesión conserven su jerarquía.

La política de liberación ampliada está en [TESTING.md](TESTING.md). Mutation testing, fuzzing dedicado, E2E de contenido y video, seguridad dinámica, resiliencia, rendimiento y compatibilidad siguen siendo puertas independientes y pendientes.
