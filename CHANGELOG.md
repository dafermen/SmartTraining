# Changelog

## 2026-10-03 · Navegación documental local

Búsqueda por contenido exclusivamente sobre el catálogo autorizado. Carga acotada y protección frente a respuestas antiguas; copia, índice, tema y enlaces entre capítulos. El backend sigue filtrando por rol. verify completo: 24 pruebas frontend y 41 backend; regresión de búsqueda autorizada; navegador con sesión LEARNER sintética en 1440/390 px. Detalle: [navegación web](docs/WEB_NAVIGATION.md). Sin publicación ni despliegue; los hitos de producto conservan su estado.


Todos los cambios relevantes se registran aquí siguiendo Keep a Changelog.

## [Unreleased]

### Added

- Documentación de visión, alcance, requisitos, arquitectura, seguridad y API.
- Modelo de datos y diseño de persistencia/medios.
- Fases, tareas, criterios de aceptación, riesgos y roadmap.
- Estructura inicial del monorepo y tablero JSON.
- Proyectos ejecutables React/Vite/Tailwind y Express/TypeScript.
- Endpoint de salud, configuración validada, JsonStore y seed bcrypt.
- Pruebas smoke de frontend, API y persistencia JSON.
- Autenticación JWT con login, consulta de sesión, logout, rate limit y roles.
- Pantalla de acceso y paneles protegidos para administrador y participante.
- API y administración visual de capacitaciones y módulos con publicación y ordenamiento.
- Carga y administración de MP4/WebM con validación de firma, FFmpeg, miniaturas y duración.
- Streaming autenticado con HTTP Range y eliminación física segura de medios.
- Cookie de sesión `HttpOnly` para streaming nativo sin tokens en la URL.
- Catálogo del participante, detalle ordenado de módulos y reproductor con reanudación.
- Progreso validado por el backend, finalización configurable al 80 % y vista administrativa.
- Centro de documentación Markdown con búsqueda, categorías, índice y autorización por rol.
- Identidad visual SmartTraining con logo, favicon y navegación principal reorganizada.
- Manuales operativos actualizados para los recorridos ADMIN y LEARNER.
- Experiencia móvil optimizada para navegación, documentación, progreso, formularios y reproducción.
- Administración de usuarios con SQLite, roles, activación, restablecimiento de contraseña y auditoría.
- Reinicio administrativo del progreso de un video para un participante, sin afectar a otros usuarios.
- Archivo `CURRENT_STATUS.md` para continuidad verificable entre sesiones de desarrollo.
- Espera explícita en las pruebas de rutas lazy para evitar fallos intermitentes bajo carga.
- Estructura estándar de documentación con arquitectura, API, desarrollo, pruebas, despliegue, operaciones, seguridad, troubleshooting y ADR.
- Política de trece puertas de calidad obligatorias antes del despliegue y plantilla de evidencia por versión.
- Workflow de GitHub Actions para instalación limpia, lint, pruebas, build y auditoría de dependencias.
- Plantillas de issues y pull request, organización central de pruebas y licencias directas de terceros.
- Dependabot para los tres paquetes y GitHub Actions.
- Configuración estable de workers/timeouts para evitar abortar jsdom, FFmpeg o escrituras atómicas bajo carga.
- Navegación documental estandarizada en `/docs`, con redirección compatible, categorías reales, menú móvil, índice responsive y enlaces Anterior/Siguiente.
- Estados de foco globales y respeto por `prefers-reduced-motion` para mejorar la accesibilidad.
- Verificación repetible de estructura documental y enlaces relativos mediante `npm run docs:check`.
- Pruebas E2E con Playwright para escritorio y móvil, cubriendo protección, login, destinos por rol, documentación y logout.
- Pruebas generativas con fast-check para progreso, UUID, normalización y rutas privadas de medios.
- Comando único `npm run dev:5175` para iniciar frontend y backend con la interfaz en el puerto 5175.
- Asignaciones individuales en SQLite con fecha límite opcional, auditoría y conservación del progreso al retirar acceso.
- Pantalla administrativa responsive para asignar, buscar, filtrar, editar vencimientos y retirar capacitaciones.
- Autorización por asignación aplicada al catálogo, detalle, módulos, videos, miniaturas, streaming y progreso.
- Capturas reproducibles de la interfaz administrativa y del catálogo responsive para la portada del repositorio.
- Script `npm run docs:screenshots` para renovar imágenes públicas sin exponer el formulario de acceso ni credenciales.
- Instrucciones raíz `AGENTS.md` para preservar seguridad, validaciones y continuidad entre sesiones.

### Fixed

- Restauradas las ubicaciones canónicas de los documentos movidos accidentalmente y recreados los índices de documentación y seguridad.
- Corregida la redirección posterior al login para enviar `ADMIN` a `/admin` y `LEARNER` a `/learn` sin competir con `/app`.
- Actualizadas React Router, Multer, Vitest y dependencias transitivas para eliminar los hallazgos de `npm audit`.
- Agregados reintentos acotados al reemplazo atómico de JSON ante bloqueos transitorios `EPERM`, `EBUSY` o `EACCES` en Windows.
- Capturadas las excepciones del procesamiento de video en segundo plano para evitar rechazos no gestionados durante apagados o fallos de almacenamiento.
- Actualizado Axios a 1.20.0 para corregir los avisos altos detectados por la auditoría de dependencias de producción.
- Actualizados Multer a 2.4.0, express-rate-limit a 8.7.0 e ip-address a 10.7.3 para cerrar los avisos moderados restantes en producción.
- Actualizadas y fijadas por hash las acciones oficiales de checkout y Node.js para usar su runtime vigente en CI.
