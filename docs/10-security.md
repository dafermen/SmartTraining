# Diseño de seguridad

## Amenazas y controles

| Riesgo                   | Control MVP                                                                      | Limitación                                                                |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Robo de contraseña       | bcrypt costo 12, claves nuevas de 12–72 bytes y comparación segura               | credenciales demo deben cambiarse fuera de local                          |
| Robo/reutilización JWT   | secreto fuerte, expiración, versión revocable y HTTPS                            | logout común no crea una lista global de revocación                       |
| Fuerza bruta             | rate limit específico de login y respuesta genérica                              | instancia única, memoria local                                            |
| Acceso por rol/ID        | autenticación, rol y autorización del recurso en backend                         | requiere pruebas negativas exhaustivas                                    |
| XSS/token                | React escapa texto, CSP, cookie `HttpOnly` para medios y JWT en `sessionStorage` | el Bearer de la pestaña sigue accesible a JavaScript                      |
| Carga maliciosa          | tamaño, MIME, extensión, magic bytes y nombre UUID                               | FFmpeg sigue siendo superficie de ataque; aislar en producción            |
| Path traversal           | usar solo `storedFilename` generado y validar ruta resuelta bajo raíz            | errores de configuración aún pueden bloquear servicio                     |
| Exposición de videos     | fuera de public, sin `express.static`, endpoint autorizado                       | el usuario autorizado puede capturar bytes                                |
| DoS de streaming/FFmpeg  | límites, timeouts, concurrencia acotada y streams                                | no hay CDN/worker distribuido en MVP                                      |
| Corrupción JSON          | esquemas, mutex, temporal, backup y fail closed                                  | no hay transacciones reales                                               |
| Manipulación de usuarios | SQLite defensivo, consultas parametrizadas, auditoría y reglas de último admin   | el archivo requiere backup y permisos operativos correctos                |
| Acceso no asignado       | verificación participante-capacitación en catálogo, módulos, medios y progreso   | la captura de pantalla/bytes por un usuario autorizado no puede impedirse |

## JWT

Payload: `sub`, `username`, `role`, `ver`, `iat`, `exp`; nunca hash, contraseña ni rutas. `authenticate` verifica firma/expiración, usuario activo y versión, y sustituye el rol del token por el rol vigente en SQLite. Cambiar rol, estado o contraseña invalida sesiones previas. `authorizeRoles` restringe rol y los servicios verifican acceso al recurso.

## Administración de identidades

Sólo `ADMIN` accede a `/api/users`. Los nombres de usuario se normalizan y son únicos sin distinguir mayúsculas. Las contraseñas nuevas se validan antes de bcrypt, las acciones sensibles tienen límite de frecuencia y la respuesta pública nunca contiene hashes. Un administrador no puede desactivarse ni cambiar su propio rol; tampoco puede retirarse el último administrador activo. Las cuentas se desactivan en vez de borrarse para preservar progreso y trazabilidad.

## Autorización por asignación

Solo `ADMIN` crea, modifica o retira asignaciones. El servicio acepta únicamente participantes activos y capacitaciones publicadas, usa una restricción única en SQLite y registra auditoría. Para `LEARNER`, la comprobación se repite en el detalle de capacitación, módulos, videos, miniaturas, streaming y progreso; no se confía en que la interfaz o el catálogo oculten el recurso. El contenido no asignado responde como no encontrado cuando corresponde para reducir divulgación de identificadores.

## Medios privados y streaming

El ID de URL busca metadatos; el servidor deriva la ubicación desde una raíz configurada y un nombre interno validado. Se comprueba existencia/tamaño con `stat`, se analiza un único rango y se transmite con `createReadStream`. Los errores no incluyen ubicación física.

## Cookie de medios y CORS

El login emite una cookie de sesión `HttpOnly`, `SameSite=Lax`, con ruta `/api`; en producción también usa `Secure`. Esto permite que `<video>` solicite rangos sin exponer el JWT en la URL. CORS acepta credenciales solamente desde `FRONTEND_URL`. Las mutaciones siguen protegidas por SameSite y por el origen explícito; un despliegue entre sitios distintos debe incorporar un token CSRF.

## Privacidad y logs

No registrar contraseñas, tokens, cuerpos de login, rutas físicas ni contenido del video. Los logs incluyen fecha, nivel, método, ruta normalizada, usuario ID, código y stack solo en desarrollo.
