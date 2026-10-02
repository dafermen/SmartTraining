# Solución de problemas

## `concurrently` no se reconoce

La dependencia se instala en la raíz del proyecto. Desde `C:\Projects\SmartTraining` ejecute:

```powershell
npm install
npm run dev
```

No invoque el binario globalmente. El script `npm run dev` utiliza la copia local.

## No existe `frontend/package.json` o `backend/package.json`

El comando se está ejecutando desde una carpeta equivocada o la estructura está incompleta. Verifique:

```powershell
Get-ChildItem package.json, frontend/package.json, backend/package.json
```

Los tres archivos deben existir. Desde la raíz use `npm run dev`. Para pasar opciones sólo a Vite use, por ejemplo, `npm run dev:frontend -- --host 127.0.0.1 --port 5172`.

## Otros síntomas

| Síntoma                | Comprobación                    | Acción segura                                                  |
| ---------------------- | ------------------------------- | -------------------------------------------------------------- |
| API no inicia          | variables, JSON y puerto        | valide `.env`; revise el primer error del backend              |
| Puerto ocupado         | proceso que escucha 3000/5173   | cierre únicamente el proceso correcto o cambie configuración   |
| CORS en navegador      | `FRONTEND_URL` exacto           | iguale protocolo, host y puerto; reinicie backend              |
| 401                    | sesión vencida o cookie ausente | cierre sesión e ingrese otra vez                               |
| 403                    | rol o publicación               | use el rol autorizado; no altere el cliente                    |
| FFmpeg no encontrado   | rutas y binario                 | configure `FFMPEG_PATH`/`FFPROBE_PATH` absolutos válidos       |
| Video `ERROR`          | formato, firma, log y espacio   | pruebe MP4/WebM válido y vuelva a cargarlo                     |
| Streaming 416          | encabezado `Range`              | use un rango dentro del tamaño del archivo                     |
| Documentación no carga | `DOCUMENTATION_PATH`            | confirme que resuelve la carpeta `docs` y contiene Markdown    |
| JSON inválido          | log y archivo `.bak`            | detenga API, conserve ambos y restaure sólo una copia validada |

## Diagnóstico mínimo

```powershell
npm run lint
npm test
npm run build
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

No publique tokens, contraseñas, rutas internas, videos ni JSON de usuarios al solicitar ayuda.

## Frontend en 5174 o mezcla de `localhost` y `127.0.0.1`

En desarrollo, el frontend usa el proxy `/api` de Vite. Esto permite iniciar sesión aunque Vite cambie de 5173 a 5174 y evita que la cookie se pierda por mezclar hostnames. Si configuró `VITE_API_URL` manualmente, elimínelo para usar el proxy o asegúrese de que la URL y `FRONTEND_URL` sean coherentes.
