# Estado actual de SmartTraining

Última actualización: **2026-10-01**

## Resumen ejecutivo

SmartTraining es un MVP funcional de capacitaciones corporativas por video. El frontend React y la API Express compilan, cuentan con pruebas automatizadas y disponen de una guía de despliegue para Ubuntu con Nginx, systemd y HTTPS.

El código local está en fase de **candidato de release**. El repositorio Git fue recuperado y vinculado a `https://github.com/dafermen/SmartTraining.git`; no debe etiquetarse una versión hasta completar la matriz visual manual y validar en producción el último código.

Desde el 2026-07-28 existe una política de trece puertas obligatorias antes del despliegue. La estructura, el CI, las pruebas generativas iniciales y la base E2E están definidos, pero las pruebas avanzadas y manuales pendientes bloquean una nueva liberación salvo que una autoridad responsable documente explícitamente un `N/A`.

## Estado de los entornos

### Local

- Raíz: `C:\Projects\SmartTraining`.
- Node validado: `v24.18.0`.
- Frontend de desarrollo usado recientemente: `http://127.0.0.1:5175`.
- API local: `http://127.0.0.1:3000`.
- Los servicios locales no deben asumirse activos al iniciar una nueva sesión.
- Rama principal local: `main`.
- Remoto: `origin` → `https://github.com/dafermen/SmartTraining.git`.
- Las capturas públicas verificadas están en `docs/assets/` y pueden regenerarse con `npm run docs:screenshots` mientras la aplicación está activa en el puerto 5175.

### Producción

- Dominio: `https://smarttraining.innovalogic.tech`.
- Código: `/var/www/smarttraining.innovalogic.tech/app`.
- Frontend: `/var/www/smarttraining.innovalogic.tech/public_html`.
- Persistencia: `/var/lib/smarttraining`.
- Servicio: `smarttraining.service`.
- El 2026-07-19 la API quedó activa con `/usr/local/bin/node` v24.18.0 y respondió correctamente en `/api/health`.
- No se ha verificado desde esta sesión si el reinicio individual de progreso ni el módulo de asignaciones del 2026-10-01 ya fueron desplegados.
- Nginx mostró advertencias no bloqueantes por opciones TLS repetidas y un `server_name` duplicado para `netwatch.innovalogic.tech`.

## Funcionalidades terminadas

- Autenticación JWT, cookie `HttpOnly`, roles `ADMIN` y `LEARNER`.
- Administración de usuarios en SQLite: creación, roles, activación, contraseñas y auditoría.
- Asignación individual de capacitaciones publicadas en SQLite:
  - solo participantes activos;
  - fecha límite opcional;
  - auditoría de alta, modificación y retiro;
  - catálogo y acceso protegidos por asignación;
  - progreso conservado cuando se retira el acceso.
- Capacitaciones, módulos, estados editoriales, orden, filtros, paginación y vista previa.
- Carga múltiple de MP4/WebM, FFmpeg/ffprobe, miniaturas, duración, reintento y eliminación.
- Streaming autenticado con HTTP Range.
- Catálogo, reproducción, reanudación y finalización configurable al 80 %.
- Consulta administrativa de progreso.
- Reinicio por parte de ADMIN de un video para un participante específico:
  - elimina únicamente el registro `(userId, videoId)`;
  - no afecta el archivo ni a otros participantes;
  - recalcula el resumen de forma derivada;
  - registra `VIDEO_PROGRESS_RESET` en auditoría.
- Documentación Markdown integrada y filtrada por rol.
- Centro documental canónico en `/docs`, con compatibilidad para `/documentation`, categorías basadas en documentos reales, navegación superior/lateral/móvil, índice responsive y Anterior/Siguiente.
- Estructura documental restaurada y protegida con `npm run docs:check`, que detecta archivos desplazados y enlaces relativos rotos.
- Diseño responsive con navegación y formularios adaptados.
- Documentación de despliegue y actualización para Ubuntu.
- Puntos de entrada estándar de arquitectura, API, desarrollo, pruebas, despliegue, operaciones, seguridad y troubleshooting.
- ADR para decisiones de arquitectura.
- GitHub Actions para lint, pruebas, build y auditoría cuando el repositorio Git sea recuperado.
- Playwright en Chromium para login, rutas por rol, documentación y logout en escritorio y móvil.
- fast-check para propiedades de progreso, UUID, texto y confinamiento de rutas privadas.
- Comando integrado `npm run dev:5175` para levantar API y frontend desde la raíz.
- Plantilla de evidencia `PASS`/`N/A`/`BLOCKED` para las trece puertas previas al despliegue.

## Última validación automatizada conocida

Ejecutada localmente el **2026-10-01** sobre el candidato preparado para GitHub, después de actualizar dependencias de seguridad:

- Frontend: **24 pruebas aprobadas**.
- Backend: **41 pruebas aprobadas**, incluidas 6 propiedades generativas y el ciclo de asignaciones.
- Vitest total actual: **65 pruebas aprobadas**.
- Build de producción frontend/backend: aprobado.
- Playwright: **6 recorridos aprobados** en Chromium de escritorio y móvil el 2026-10-01.
- Total combinado conocido: **71 comprobaciones automatizadas distintas**, sujeto a repetir E2E sobre el artefacto candidato.
- `npm.cmd run dev:5175`: validado; frontend respondió 200 en `127.0.0.1:5175` y la API reportó `ok` en `127.0.0.1:3000`.
- Formato Prettier de los archivos modificados: aprobado.
- Enlaces Markdown relativos: **0 enlaces rotos**.
- Rutas duplicadas `/docs/docs/`: **0 coincidencias**.
- Unitarias/componentes clasificadas: frontend **23** y backend **8**.
- Integración clasificada: **11 pruebas aprobadas**.
- Contrato: **3 pruebas aprobadas**.
- Seguridad automatizada: **13 pruebas aprobadas**.
- Auditoría npm de producción raíz: **0 vulnerabilidades**.
- Auditoría npm de producción backend: **0 vulnerabilidades**.
- Auditoría npm de producción frontend: **0 vulnerabilidades**.
- React Router actualizado a 7.18.3, Axios a 1.20.0, Multer a 2.4.0, express-rate-limit a 8.7.0, ip-address a 10.7.3 y Vitest a 4.1.11.
- Documentación: **61 archivos Markdown**, estructura y enlaces relativos verificados.
- Capturas reales: panel administrativo, asignaciones, catálogo de participante y vista móvil verificadas visualmente.

Las suites frontend y backend limitan workers y usan 20 segundos para pruebas/hooks, evitando que una máquina lenta aborte jsdom o FFmpeg mientras aún escribe temporales.

El tablero contiene **94 tareas**: 82 `COMPLETED`, 6 `TESTING` y 6 `NOT_STARTED`.

La siguiente sesión debe repetir estas validaciones si modifica código o dependencias.

## Pendientes y bloqueantes

1. **Pruebas avanzadas de la Fase 11**
   - Ampliar propiedades e invariantes a unicidad persistida y recuperación de escrituras JSON.
   - Mutation testing y fuzzing.
   - Ampliar E2E a autoría, publicación, asignación, carga, reproducción, reanudación y reinicio administrativo.
   - Seguridad dinámica autorizada.
   - Concurrencia, resiliencia y restauración.
   - Rendimiento y recursos.
   - Compatibilidad final en Ubuntu, navegadores y dispositivos.

2. **Validación responsive manual**
   - Probar teléfono, tableta y escritorio reales.
   - Confirmar login, navegación, asignación, carga, reproducción, progreso, reinicio y cierre de sesión.
   - Verificar que no exista desplazamiento horizontal accidental.
   - Revisar `/docs` a 1440 × 900 y 390 × 844 en Chrome y Edge reales, incluyendo menús, índice, Anterior/Siguiente y regreso a `/`.
   - SmartTraining aún no dispone de un modo oscuro global; no se agregó uno aislado al lector para evitar una experiencia inconsistente.

3. **Validación del último código en Ubuntu**
   - Respaldar `/var/lib/smarttraining`.
   - Transferir fuentes a `app`, compilar, publicar `frontend/dist` y reiniciar la API.
   - Probar especialmente asignaciones/vencimientos, autorización del catálogo, reinicio individual de progreso y auditoría.

4. **Control de versiones y release**
   - Confirmar que el workflow de GitHub Actions del commit publicado termine en verde.
   - Crear el tag solo después de las validaciones manuales y de producción.

5. **Operación de producción**
   - Corregir por separado las advertencias duplicadas de Nginx.
   - Sustituir las credenciales conocidas `admin`/`learner` antes de un uso productivo real.
   - Verificar backup externo y restauración.

6. **Evolución visual opcional**
   - Diseñar un modo oscuro para toda la aplicación antes de habilitar un selector en documentación.

## Próximos pasos recomendados

1. Ampliar E2E a contenido, asignaciones, carga, reproducción y progreso.
2. Configurar mutation testing y fuzzing dedicado.
3. Completar `test/pre-deployment-evidence-template.md` para el artefacto candidato.
4. Verificar GitHub Actions sobre `main` y proteger la rama cuando el flujo de colaboración esté establecido.
5. Desplegar solamente cuando ninguna puerta esté `BLOCKED`.
6. Ejecutar el smoke test de producción:

   ```bash
   curl -I https://smarttraining.innovalogic.tech/
   curl https://smarttraining.innovalogic.tech/api/health
   sudo systemctl status smarttraining --no-pager -l
   ```

7. Realizar la matriz visual de `docs/17-testing-guide.md`.
8. Crear la entrega desde el commit y artefacto verificados.

## Archivos de orientación

- `README.md`: instalación y visión general.
- `AGENTS.md`: reglas obligatorias para futuras sesiones de desarrollo.
- `scripts/check-documentation.mjs`: validación automática de estructura y enlaces.
- `scripts/capture-documentation-screenshots.mjs`: capturas públicas reproducibles desde las cuentas demo.
- `playwright.config.ts`: matriz E2E de escritorio y móvil.
- `deploy/README.md`: despliegue, actualización y diagnóstico en Ubuntu.
- `docs/TESTING.md`: trece puertas obligatorias y estado de automatización.
- `test/pre-deployment-evidence-template.md`: evidencia por versión.
- `docs/08-api-documentation.md`: contrato REST.
- `docs/11-admin-manual.md`: recorrido administrativo.
- `docs/12-user-manual.md`: recorrido del participante.
- `docs/17-testing-guide.md`: validación automatizada y responsive.
- `docs/22-risks-and-limitations.md`: límites operativos.
- `backend/data/development-phases.json`: estado de fases.
- `backend/data/development-tasks.json`: tablero de tareas.
