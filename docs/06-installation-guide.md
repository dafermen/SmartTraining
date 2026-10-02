# Guía de instalación

Procedimiento validado en Windows con PowerShell. Ejecute todos los comandos desde la raíz `C:\Projects\SmartTraining` o la carpeta equivalente de su equipo.

## Requisitos

- Node.js 24.15 o superior (requerido por `node:sqlite`).
- npm 10 o superior.
- Espacio disponible para videos y miniaturas.
- Puertos 3000 y 5173 libres, salvo que configure otros.

El backend instala binarios locales de FFmpeg y ffprobe. En producción puede reemplazarlos mediante `FFMPEG_PATH` y `FFPROBE_PATH`.

## Instalación

```powershell
npm install
npm install --prefix backend
npm install --prefix frontend
Copy-Item backend/.env.example backend/.env
npm run seed
npm run dev
```

No ejecute `npm run dev --prefix frontend` desde una estructura que no contenga `frontend/package.json`. El script raíz ya conoce ambos paquetes y utiliza `concurrently` instalado en la raíz.

## Verificación

1. Abra `http://127.0.0.1:5173/login`.
2. Compruebe `http://127.0.0.1:3000/api/health`; debe responder `status: ok`.
3. Inicie sesión con `admin` / `comillas22` sólo en desarrollo.
4. Abra **Capacitaciones** y confirme que existe el curso de demostración.
5. Ejecute la validación automatizada:

```powershell
npm run lint
npm test
npm run build
```

Si 5173 está ocupado, Vite puede seleccionar 5174. Abra la URL exacta mostrada en la consola; el proxy relativo `/api` seguirá conectando con el backend en 3000.

## Configuración opcional

Edite `backend/.env` para cambiar puerto, origen del frontend, secreto JWT o rutas. Durante desarrollo no necesita configurar `VITE_API_URL`: Vite envía `/api` al backend. En un despliegue separado, configure `frontend/.env` siguiendo su archivo de ejemplo. Nunca utilice las credenciales ni el secreto de demostración en un entorno real.
