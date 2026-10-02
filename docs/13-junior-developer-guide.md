# Guía para desarrolladores junior

## Cómo orientarse

El frontend se organiza por funcionalidades en `frontend/src/features`; páginas y rutas ensamblan componentes. El backend recibe HTTP en `routes/controllers`, aplica reglas en `services` y persiste mediante `repositories`. `backend/data` contiene JSON; `backend/storage` contiene medios privados.

## Cambios comunes

- **Nueva página:** cree el componente en la feature/página, agregue ruta y protección, enlace de navegación y prueba.
- **Nuevo endpoint:** defina esquema Zod, ruta/middleware, controlador fino, servicio, repositorio si aplica, prueba HTTP y documentación.
- **Nuevo componente:** empiece local a la feature; muévalo a `components` solo si tiene consumidores reales.
- **Nueva propiedad:** actualice tipo, esquema, seed/migración de JSON, servicio, respuesta, formulario, prueba y `09-data-model.md`.
- **Nueva variable:** agréguela a `.env.example`, valídela al iniciar y documente unidad/rango.

Ejemplo de flujo de endpoint:

```text
PATCH /trainings/:id/status
→ authenticate → authorizeRoles('ADMIN')
→ validate(statusSchema) → controller → trainingService → trainingRepository
```

## Depuración

Lea el código de error de la respuesta y el log del backend; no agregue logs de token. Compruebe `npm run lint`, `npm test` y `npm run build`. Para FFmpeg ejecute `ffmpeg -version` y `ffprobe -version`. Para Range:

```bash
curl -i -H "Authorization: Bearer TOKEN" -H "Range: bytes=0-1023" http://localhost:3000/api/videos/VIDEO_ID/stream
```

Debe obtener `206`, `Content-Range` y 1024 bytes.

## Recuperación

Si un JSON está corrupto, detenga la API, conserve copias del archivo y `.bak`, valide ambos con una herramienta JSON y use el script de recuperación previsto; nunca edite mientras la API escribe. Una referencia rota se corrige restaurando un backup o con un script validado, no borrando IDs a ciegas.

Para reinstalar dependencias, conserve lockfiles y ejecute `npm ci` en raíz/subproyectos cuando existan. No borre cambios ajenos. Antes de modificar, cree `git switch -c fix/descripcion`; confirme con `git add` selectivo y `git commit -m "fix(scope): summary"`; abra PR con pruebas y riesgos.

## Método de estudio

Siga una petición desde ruta a controlador, servicio y repositorio; luego siga la respuesta hasta hook y componente. Cambie una sola conducta, escriba su prueba y revise el diff para evitar regresiones.
