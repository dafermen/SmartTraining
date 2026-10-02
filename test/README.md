# Organización de pruebas

SmartTraining es un monorepo. Las pruebas ejecutables existentes permanecen cerca de cada workspace:

- `frontend/src/**/*.test.tsx`: componentes, rutas y experiencia;
- `backend/tests/*.test.ts`: servicios, repositorios, API, seguridad y medios.

Esta carpeta central contiene la clasificación, evidencias de release y planes para las puertas que requieren herramientas adicionales. No se deben mover pruebas únicamente para imitar una estructura si eso empeora su descubrimiento o mantenimiento.

| Área                      | Ubicación               |
| ------------------------- | ----------------------- |
| Unitarias                 | `unit/README.md`        |
| Integración               | `integration/README.md` |
| Contrato                  | `contract/README.md`    |
| E2E                       | `e2e/README.md`         |
| Fixtures                  | `fixtures/README.md`    |
| Seguridad                 | `security/README.md`    |
| Rendimiento y resiliencia | `performance/README.md` |

La política completa está en `../docs/TESTING.md`.
