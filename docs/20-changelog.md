# Historial de documentación

## 2026-09-09 — integridad, seguridad y pruebas automatizadas

- Restaurados a la raíz `CURRENT_STATUS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md` y `THIRD_PARTY_LICENSES.md`.
- Retirado el archivo `AGENTS.md` anterior porque sus instrucciones dejaron de aplicar; la continuidad queda centralizada en `CURRENT_STATUS.md`.
- Recreados `docs/README.md` y el punto de entrada `docs/SECURITY.md`; retiradas copias desplazadas.
- Añadido `npm run docs:check` para detectar estructura incorrecta y enlaces relativos rotos.
- Incorporadas pruebas generativas con fast-check y recorridos Playwright en escritorio y móvil.
- Documentados el comando integrado `npm run dev:5175`, la cobertura actual y los escenarios aún pendientes.
- Actualizadas dependencias vulnerables y verificada una auditoría npm sin hallazgos.

## 2026-08-01 — navegación documental estandarizada

- Adoptada `/docs` como ruta canónica sin separar la documentación del control de acceso de SmartTraining.
- Conservada `/documentation` como redirección para no romper enlaces existentes.
- Reorganizado el catálogo en Producto, Arquitectura y desarrollo, Entrega y Gestión del proyecto, usando solo documentos reales.
- Añadidos navegación superior, regreso nativo a la aplicación, menú móvil, índice responsive y Anterior/Siguiente.
- Documentado que el modo oscuro no se incorpora de forma aislada mientras la aplicación no disponga de un tema oscuro global coherente.

## 2026-07-28 — puertas de calidad y estructura estándar

- Agregados puntos de entrada `ARCHITECTURE`, `API`, `DEVELOPMENT`, `TESTING`, `DEPLOYMENT`, `OPERATIONS`, `SECURITY` y `TROUBLESHOOTING` sin sustituir los documentos numerados consumidos por la aplicación.
- Creada la Fase 11 con trece puertas previas al despliegue, evidencia `PASS`/`N/A`/`BLOCKED` y tareas trazables para automatización avanzada.
- Añadidos ADR, CI de GitHub, plantillas de colaboración, clasificación central de pruebas y licencias directas de terceros.
- Añadido Dependabot para los tres paquetes y GitHub Actions.
- Registrado como bloqueo el aviso alto de React Router detectado por la nueva auditoría.
- Documentado explícitamente que propiedades, mutation testing, fuzzing, E2E, seguridad dinámica, resiliencia, rendimiento y compatibilidad todavía requieren implementación o evidencia.

## 2026-07-26 — continuidad entre sesiones

- Creados `AGENTS.md` y `CURRENT_STATUS.md` con entorno, estado local y desplegado, validaciones, bloqueantes y próximos pasos.
- Corregidas las notas de entrega para reflejar la administración de usuarios y el reinicio individual de progreso ya implementados.
- Estabilizada la prueba de rutas públicas para esperar explícitamente la carga diferida de la página de acceso.
- Conservados como pendientes verificables la matriz responsive real, las capturas de manuales, la validación en Ubuntu y el tag de release.

## 2026-07-21 — control administrativo de progreso

- Añadido el reinicio del progreso de un video para un participante, con confirmación, autorización por rol, recálculo derivado y registro de auditoría.

## 2026-07-18 — cierre de pruebas y candidato MVP

- Renovada la identidad visual con un logo de aprendizaje, progreso y video, paleta índigo/ámbar, fondos cálidos y favicon consistente; se retiró la apariencia verde clínica.
- Incorporada administración de usuarios con alta, búsqueda, filtros, paginación, roles, activación y restablecimiento de contraseña.
- Migradas identidades desde `users.json` a SQLite estricto con importación automática, WAL, sentencias parametrizadas y auditoría administrativa.
- Agregada revocación de sesiones por versión al cambiar contraseña, rol o estado, además de protección del último administrador activo.
- Endurecido el servicio systemd y documentados backup, permisos y migración de la base en Ubuntu.
- Compactada la gestión de módulos mediante filas, área desplazable, búsqueda, formulario plegable y menú de acciones secundarias.
- Convertidas Ruta de publicación e Información general en secciones resumidas expandibles.
- Reubicada la administración de capacitaciones sobre la ruta de publicación, con tabla ordenable, filtros, paginación y estado inicial sin selección.
- Ampliadas las pruebas de backend a servicios, validadores, corrupción JSON, contratos REST y matriz de permisos.
- Validado automáticamente el seed corporativo idempotente con usuarios, capacitación y módulos sin videos privados.
- Agregadas guía de demostración, notas de release y revisiones de código/documentación.
- Actualizados roadmap, riesgos y estado de fases con los pendientes manuales reales.

## 2026-07-16

- Completadas definición y arquitectura iniciales.
- Creados requisitos, contratos, seguridad, streaming, fases, riesgos y plan.
- Creado tablero JSON de desarrollo y estructura privada de medios.

## 2026-07-17

- Completada Fase 2 con React/Vite/Tailwind y Express/TypeScript.
- Agregados configuración validada, errores centralizados, JsonStore, seed bcrypt y pruebas smoke.
- Validados lint, pruebas, build, CORS y arranque en puertos 5172/5173 y 3000.
- Completada Fase 3 con login bcrypt, JWT, rate limit, usuario activo y autorización por roles.
- Agregados login responsive, sesión en `sessionStorage`, rutas protegidas y paneles ADMIN/LEARNER.
- Completada Fase 4 con CRUD de capacitaciones y módulos, publicación y ordenamiento.
- Agregada pantalla administrativa responsive con edición, estados y confirmaciones de eliminación.
- Completada Fase 5 con carga, validación binaria, FFmpeg local, miniaturas y duración.
- Agregados streaming Range protegido, miniaturas autenticadas, reordenamiento y eliminación de medios.
- Completada Fase 6 con catálogo, reproductor, reanudación, progreso al 80 % y seguimiento administrativo.
- Agregada cookie `HttpOnly` para streaming nativo protegido sin JWT en la URL.
- Agregado centro de documentación con Markdown GFM, búsqueda, categorías, TOC y filtrado ADMIN/LEARNER.
- Actualizados instalación, manuales, arquitectura y troubleshooting con el comportamiento ejecutable.
- Corregida la reproducción web mediante streaming directo, cookie de sesión y normalización MP4 `faststart`.
- Agregados logo, favicon y encabezado reorganizado con acciones separadas por contexto.
- Ampliados los manuales de administrador y participante; sus capturas finales continúan en validación.
- Optimizada la experiencia móvil con navegación inferior, controles táctiles, lector documental compacto, progreso en tarjetas y reproductor de mayor tamaño.
- Simplificado el panel administrativo para evitar accesos duplicados al mismo flujo.
- Agregada una ruta visual de publicación con verificación de información, módulos y videos.
- Agregados motivo persistente de procesamiento fallido y reintento sin volver a transferir el video.
- Agregada carga múltiple con selección o arrastre, títulos editables, transferencia secuencial, progreso individual y reintento de elementos fallidos.
- Rediseñada la administración de módulos con tarjetas de lectura, estado del contenido, acción principal para videos y formulario de edición desplegable.
- Creada la fase F10 con tareas trazables de experiencia administrativa.
- Rediseñadas las tarjetas de video con miniatura, duración, tamaño, vista previa y menú contextual accesible.
- Agregadas notificaciones no bloqueantes para guardado, publicación, carga, reintento y eliminación.
- Agregados búsqueda y filtros editoriales de capacitaciones y vista previa administrativa como participante.
- Divididas las páginas por ruta para reducir el JavaScript inicial y mejorar la carga en teléfonos.
