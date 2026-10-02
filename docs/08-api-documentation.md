# Mapa de API

Base: `/api`. Salvo login y health, se requiere `Authorization: Bearer <token>` o la cookie de sesión `HttpOnly` emitida por login. `A` = ADMIN; `L` = LEARNER.

## Respuesta

```json
{ "success": true, "message": "Training created successfully", "data": {} }
```

```json
{
  "success": false,
  "message": "Training not found",
  "errorCode": "TRAINING_NOT_FOUND"
}
```

## Endpoints

| Método y ruta                                          | Roles            | Propósito                                          |
| ------------------------------------------------------ | ---------------- | -------------------------------------------------- |
| `GET /health`                                          | público          | salud básica, sin secretos                         |
| `POST /auth/login`                                     | público limitado | autenticar                                         |
| `GET /auth/me`                                         | A/L              | sesión actual                                      |
| `POST /auth/logout`                                    | A/L              | eliminar cookie de sesión                          |
| `GET /users`                                           | A                | listar cuentas                                     |
| `POST /users`                                          | A limitado       | crear una cuenta                                   |
| `PUT /users/:id`                                       | A                | nombre, rol y estado                               |
| `PUT /users/:id/password`                              | A limitado       | nueva clave y revocar sesiones                     |
| `GET /users/audit`                                     | A                | actividad administrativa                           |
| `GET /assignments`                                     | A                | asignaciones enriquecidas                          |
| `POST /assignments`                                    | A                | asignar curso publicado                            |
| `PUT /assignments/:id`                                 | A                | modificar fecha límite                             |
| `DELETE /assignments/:id`                              | A                | retirar sin borrar progreso                        |
| `GET /assignments/me`                                  | L                | asignaciones propias activas                       |
| `GET /trainings`                                       | A/L              | A ve todos; L solo asignados y publicados          |
| `GET /trainings/:id`                                   | A/L              | detalle autorizado y asignado                      |
| `POST /trainings`                                      | A                | crear                                              |
| `PUT /trainings/:id`                                   | A                | editar                                             |
| `DELETE /trainings/:id`                                | A                | cascada confirmada                                 |
| `PATCH /trainings/:id/status`                          | A                | publicar/despublicar/archivar                      |
| `GET, POST /trainings/:trainingId/modules`             | A/L, A           | listar/crear                                       |
| `PUT, DELETE /modules/:id`                             | A                | editar/eliminar                                    |
| `PATCH /modules/reorder`                               | A                | orden completo validado                            |
| `GET, POST /modules/:moduleId/videos`                  | A/L, A           | listar/cargar multipart                            |
| `GET, PUT, DELETE /videos/:id`                         | A/L, A, A        | detalle/editar/eliminar                            |
| `PATCH /videos/reorder`                                | A                | reordenar                                          |
| `POST /videos/:id/retry`                               | A                | reprocesar un video en ERROR                       |
| `POST /videos/:id/thumbnail`                           | A                | reemplazar miniatura                               |
| `GET /videos/:id/thumbnail`                            | A/L              | imagen protegida                                   |
| `GET /videos/:id/stream`                               | A/L              | bytes protegidos y Range                           |
| `GET /progress/me`                                     | L                | resumen propio                                     |
| `GET /progress/trainings/:trainingId`                  | L                | progreso propio del curso                          |
| `PUT /progress/videos/:videoId`                        | L                | upsert validado                                    |
| `GET /admin/progress`                                  | A                | seguimiento agregado                               |
| `DELETE /admin/progress/users/:userId/videos/:videoId` | A                | reinicia el progreso individual y audita la acción |
| `GET /documentation`                                   | A/L              | lista filtrada por rol                             |
| `GET /documentation/:documentId`                       | A/L              | Markdown autorizado                                |
| `GET /development/phases`                              | A                | fases                                              |
| `GET, POST /development/tasks`                         | A                | listar/crear tareas                                |
| `PUT, DELETE /development/tasks/:id`                   | A                | editar/eliminar                                    |
| `PATCH /development/tasks/:id/status`                  | A                | transición de estado                               |

## Streaming

Sin `Range`, puede responder `200` con el archivo completo transmitido por stream. Con un rango válido `bytes=start-end`, responde `206`, `Content-Range`, `Content-Length`, `Accept-Ranges: bytes` y MIME registrado. Rangos múltiples no se soportan en el MVP y reciben `416`; nunca se acepta un nombre de archivo del cliente.

## Documentación

`GET /documentation` devuelve `id`, título, descripción, categoría y audiencia. ADMIN recibe el catálogo completo; LEARNER recibe únicamente el manual del participante y el glosario. `GET /documentation/:documentId` devuelve además el Markdown. Los identificadores deben cumplir `NN-slug`; un documento existente pero no autorizado responde `404` para no confirmar contenido restringido.

## Códigos principales

`200/201/202/204`, `400` validación, `401` autenticación, `403` autorización, `404`, `409`, `413`, `415`, `416`, `429` y `500` con mensaje seguro.

El logout elimina el token de `sessionStorage` y la cookie `HttpOnly`. Cada JWT contiene una versión de autenticación: cambiar rol, estado o contraseña incrementa esa versión y revoca inmediatamente los tokens anteriores. Cada solicitud vuelve a cargar el usuario y su rol desde SQLite.

## Asignaciones

Una asignación relaciona un participante activo con una capacitación `PUBLISHED`. La combinación `(userId, trainingId)` es única. `dueDate` es opcional y usa `YYYY-MM-DD`; informa el plazo, pero no revoca el acceso automáticamente al vencer.

El backend aplica la asignación al catálogo, detalle, módulos, videos, miniaturas, streaming y escritura/consulta de progreso. Retirar una asignación elimina el acceso, pero conserva el progreso para auditoría y para una eventual reasignación.
