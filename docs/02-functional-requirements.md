# Requerimientos funcionales

## Autenticación y autorización

- **RF-AUTH-01:** iniciar sesión con usuario y contraseña y recibir una sesión JWT.
- **RF-AUTH-02:** consultar el usuario autenticado y cerrar sesión localmente.
- **RF-AUTH-03:** proteger rutas por autenticación y rol.
- **RF-AUTH-04:** sembrar `admin` y `learner` con hash bcrypt.

## Contenido

- **RF-TRN-01:** ADMIN crea, consulta, edita, elimina y cambia estado de capacitaciones.
- **RF-MOD-01:** ADMIN administra y reordena módulos de una capacitación.
- **RF-VID-01:** ADMIN selecciona uno o varios MP4/WebM, revisa sus títulos, observa el progreso individual, edita, reordena y elimina videos.
- **RF-UX-01:** ADMIN busca y filtra capacitaciones por texto y estado editorial.
- **RF-UX-02:** ADMIN revisa una vista previa de la capacitación antes de publicarla.
- **RF-UX-03:** Las mutaciones administrativas confirman su resultado mediante notificaciones accesibles no bloqueantes.
- **RF-VID-02:** el sistema extrae duración y miniatura, y registra `PROCESSING`, `READY` o `ERROR`.
- **RF-VID-03:** ADMIN reemplaza una miniatura con una imagen válida.
- **RF-CAT-01:** LEARNER ve solamente capacitaciones publicadas y asignadas a su cuenta.
- **RF-ASG-01:** ADMIN asigna una capacitación publicada a un participante activo, con fecha límite opcional.
- **RF-ASG-02:** ADMIN modifica el vencimiento o retira una asignación sin eliminar el progreso existente.
- **RF-ASG-03:** el backend aplica la asignación a catálogo, detalle, módulos, medios y progreso.

## Reproducción y progreso

- **RF-STR-01:** usuarios autorizados reproducen por un endpoint con HTTP Range.
- **RF-PRG-01:** se guarda progreso periódico, en pausa y al abandonar la vista.
- **RF-PRG-02:** la reproducción se reanuda desde `currentTime`.
- **RF-PRG-03:** el backend marca `COMPLETED` al alcanzar el porcentaje configurado (80 % por defecto).
- **RF-PRG-04:** LEARNER ve su progreso y ADMIN consulta progreso agregado.

## Documentación y desarrollo

- **RF-DOC-01:** listar y renderizar Markdown con búsqueda, tabla de contenido y navegación.
- **RF-DOC-02:** filtrar documentos por rol sin duplicarlos en el frontend.
- **RF-DEV-01:** ADMIN consulta fases y administra tareas/estados.

## Reglas de eliminación

La eliminación es física y en cascada después de confirmación explícita. El servicio elimina registros, relaciones, progreso y archivos asociados de forma idempotente; un archivo ya ausente genera advertencia, no una ruta huérfana ni exposición interna.

## Trazabilidad

Cada RF se vinculará a pruebas en Fase 8. El mapa de endpoints está en `08-api-documentation.md` y los criterios observables en `24-mvp-acceptance-criteria.md`.
