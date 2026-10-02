# Criterios de aceptación del MVP

## Definición de terminado

- Frontend React/TypeScript y backend Node/Express/TypeScript compilan sin errores.
- `admin` y `learner` autentican; hashes bcrypt, JWT y roles se verifican en backend.
- ADMIN administra capacitación, módulos y videos; LEARNER no puede hacerlo.
- Carga rechaza tipo/tamaño inválidos; FFmpeg obtiene duración/miniatura y estados.
- Ningún medio estático es público; streaming autorizado responde 206 a Range válido y 416 al inválido.
- ADMIN asigna contenido publicado a participantes activos con fecha límite opcional.
- LEARNER ve únicamente contenido publicado y asignado, reanuda y completa al 80 % recalculado por backend.
- ADMIN consulta progreso; LEARNER solo el suyo.
- Markdown se lista/renderiza según rol; tablero ADMIN permite estados/tareas.
- Instalación limpia funciona con README y `.env.example`, sin secretos confirmados.
- Pruebas críticas pasan, lint/tipos/build no tienen errores críticos y UI es usable en móvil/escritorio.

## Aceptación de Fases 0–1

- Visión, alcance, RF/RNF, arquitectura, estructura, datos, seguridad, medios, API, fases, tareas, riesgos, roadmap y plan están versionados.
- Decisiones principales incluyen problema, alternativa, elección y limitación.
- El tablero JSON es válido y refleja el estado verificable de cada fase y tarea.
- Las carpetas de medios están excluidas de Git salvo marcadores vacíos.
