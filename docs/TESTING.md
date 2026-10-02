# Estrategia y puertas de prueba

Este documento define la evidencia obligatoria antes de desplegar SmartTraining. La guía histórica de la suite está en [17-testing-guide.md](17-testing-guide.md) y los criterios funcionales en [24-mvp-acceptance-criteria.md](24-mvp-acceptance-criteria.md).

## Regla de liberación

Cada puerta debe registrar uno de estos resultados para el código y artefacto exactos que se desplegarán:

- `PASS`: evidencia vigente y reproducible;
- `N/A`: no aplica, con justificación y aprobación explícitas;
- `BLOCKED`: falta evidencia o hay un fallo; **no se despliega**.

No se permite reutilizar el resultado de una versión anterior. La evidencia se registra con [la plantilla central](../test/pre-deployment-evidence-template.md).

## Las trece puertas

|   # | Puerta                      | Evidencia mínima                                                 | Automatización actual                        |
| --: | --------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
|   1 | Aceptación                  | recorridos ADMIN/LEARNER y criterios firmados                    | manual, pendiente por versión                |
|   2 | Unitarias                   | servicios, validadores y componentes aislados                    | parcial con Vitest                           |
|   3 | Propiedades e invariantes   | propiedades generativas de IDs, orden, progreso y almacenamiento | parcial con `fast-check`                     |
|   4 | Mutation testing            | puntuación y mutantes sobrevivientes revisados                   | pendiente; no hay Stryker                    |
|   5 | Fuzzing                     | entradas malformadas contra validadores, API y carga             | pendiente                                    |
|   6 | Integración                 | API, SQLite, JSON, FFmpeg y archivos temporales                  | Supertest/Vitest                             |
|   7 | Contrato                    | rutas, roles, códigos y envolturas REST                          | `api-contract.test.ts`                       |
|   8 | Extremo a extremo           | navegador real en flujos críticos                                | parcial con Playwright en escritorio y móvil |
|   9 | Regresión                   | suite completa sobre correcciones anteriores                     | `npm test`                                   |
|  10 | Seguridad                   | auth, permisos, auditoría, dependencias y revisión dinámica      | parcial                                      |
|  11 | Concurrencia y resiliencia  | escrituras simultáneas, reinicio, disco/FFmpeg y restauración    | pendiente salvo atomicidad básica            |
|  12 | Rendimiento y recursos      | latencia, carga, Range, CPU, memoria y disco                     | pendiente                                    |
|  13 | Compatibilidad y despliegue | Node 24, Ubuntu, Nginx y navegadores/dispositivos objetivo       | build automatizado; matriz manual pendiente  |

## Procedimiento por puerta

### 1. Pruebas de aceptación

- Ejecutar [criterios del MVP](24-mvp-acceptance-criteria.md) y [guía de demostración](26-demo-guide.md).
- Probar como `ADMIN` y `LEARNER`.
- Incluir creación de usuario, publicación, carga, reproducción, reanudación, reinicio de progreso, auditoría y cierre de sesión.

### 2. Pruebas unitarias

```bash
npm run test:unit
```

La clasificación actual es aproximada: los componentes frontend permanecen junto a su fuente y algunas pruebas backend combinan repositorio y sistema de archivos aislado.

### 3. Propiedades e invariantes

La base generativa se ejecuta con:

```bash
npm run test:properties
```

Actualmente cubre entradas de progreso, UUID y orden, normalización de texto y confinamiento de rutas de medios. Aún faltan propiedades sobre unicidad persistida y recuperación de escrituras JSON. Propiedades prioritarias:

- porcentajes siempre entre 0 y 100;
- orden único y no negativo;
- un solo progreso por `(userId, videoId)`;
- rutas derivadas nunca escapan de la raíz privada;
- una escritura fallida conserva el archivo válido anterior.

### 4. Mutation testing

Configurar Stryker para servicios, validadores y autorización. Registrar puntuación, umbral acordado y mutantes sobrevivientes. Un porcentaje alto sin revisar supervivientes no constituye evidencia suficiente.

### 5. Fuzzing

Ejercitar esquemas Zod, parámetros de ruta, JSON, cabeceras `Range`, nombres de archivo y multipart. Los corpus no deben contener medios reales ni secretos.

### 6. Pruebas de integración

```bash
npm run test:integration
```

Verificar además que los temporales se limpian y que las pruebas usan directorios aislados.

### 7. Pruebas de contrato

```bash
npm run test:contract
```

Comparar también con [API.md](API.md) y [08-api-documentation.md](08-api-documentation.md).

### 8. Pruebas de extremo a extremo

La base Playwright se ejecuta con:

```bash
npx playwright install chromium
npm run test:e2e
```

Actualmente cubre redirección protegida, login y destino por rol, documentación del participante y cierre de sesión en escritorio y móvil. Aún falta cubrir:

- login y permisos por rol;
- autoría y publicación;
- carga/procesamiento de video;
- reproducción y reanudación;
- reinicio administrativo de progreso;
- navegación móvil y cierre de sesión.

### 9. Pruebas de regresión

```bash
npm test
```

Cada defecto corregido debe aportar una prueba que falle antes del arreglo.

### 10. Pruebas de seguridad

```bash
npm run test:security
npm run audit:prod
```

Completar con revisión de configuración, secretos, cabeceras, TLS, autorización horizontal/vertical y un escaneo dinámico autorizado en un entorno no productivo.

### 11. Concurrencia y resiliencia

- Simular escrituras concurrentes al mismo JSON.
- Confirmar recuperación tras reinicio durante procesamiento.
- Probar falta de espacio y fallos de FFmpeg sin residuos.
- Restaurar un backup completo en un entorno aislado.
- No ejecutar dos instancias contra la misma persistencia JSON.

### 12. Rendimiento y recursos

Definir presupuesto antes de medir. Registrar, como mínimo:

- latencia p50/p95/p99 de API;
- concurrencia sostenible;
- tiempo y recursos de carga/procesamiento;
- streaming 200/206 y consumo de ancho de banda;
- CPU, memoria y crecimiento de disco.

### 13. Compatibilidad y despliegue

- Ejecutar `npm run build` con Node 24.
- Probar Ubuntu, systemd, Nginx, TLS, FFmpeg y permisos.
- Validar Chrome/Edge y la matriz teléfono/tableta/escritorio.
- Ejecutar health y smoke tests de [DEPLOYMENT.md](DEPLOYMENT.md).

## Automatización central

```bash
npm run verify
npm run predeploy:core
```

`verify` ejecuta lint, integridad documental, regresión y build. `predeploy:core` añade contrato, seguridad, propiedades, E2E y auditoría de dependencias. Ninguno declara aprobadas las puertas manuales ni la cobertura avanzada todavía pendiente.
