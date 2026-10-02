# Despliegue de smarttraining.innovalogic.tech

Esta configuración publica frontend y API bajo el mismo dominio:

- Aplicación: `https://smarttraining.innovalogic.tech`
- API: `https://smarttraining.innovalogic.tech/api`
- Proceso Node privado: `http://127.0.0.1:3000`

## 1. Estructura correcta del servidor

La raíz asignada al dominio es:

```text
/var/www/smarttraining.innovalogic.tech/
```

Utilice esta separación:

```text
/var/www/smarttraining.innovalogic.tech/
├── app/                 # Repositorio, backend, docs y fuentes privadas
└── public_html/         # Únicamente el contenido compilado de frontend/dist
```

**No copie todo el proyecto dentro de `public_html`.** Esto podría hacer accesibles el código del backend, archivos JSON, documentación interna o configuraciones. Dentro de `public_html` deben quedar solamente `index.html`, `assets/`, el logo y el favicon generados por Vite.

Desde `C:\Projects\SmartTraining`, copie el proyecto a la carpeta privada `app`, excluyendo:

- Todos los directorios `node_modules`.
- `frontend/dist` y `backend/dist` si compilará en el servidor.
- Archivos `.env`, logs, cobertura y archivos temporales.
- La carpeta `frontend/tmp` usada para generar el logo.

No copie `node_modules` desde Windows: los módulos nativos deben instalarse directamente en Linux.

### Transferir cambios desde Windows con WinSCP

En WinSCP, el árbol remoto puede mostrar solamente las carpetas; los archivos de la carpeta seleccionada aparecen en el panel derecho. Mantenga la misma ruta relativa entre el proyecto de Windows y `app` en Ubuntu.

Por ejemplo, para actualizar el cliente de carga de videos copie:

```text
Windows:
C:\Projects\SmartTraining\frontend\src\api\videos.ts

Ubuntu:
/var/www/smarttraining.innovalogic.tech/app/frontend/src/api/videos.ts
```

Confirme el reemplazo si WinSCP lo solicita. El código fuente siempre se transfiere a `app`; nunca copie `frontend/src`, `backend/src`, `node_modules` ni el resto del repositorio dentro de `public_html`.

Después de transferir archivos fuente debe ejecutar el build en Ubuntu y publicar su resultado. `public_html` es una carpeta hermana de `app`, no una carpeta interna:

```text
/var/www/smarttraining.innovalogic.tech/
├── app/frontend/dist/  # Resultado privado generado por Vite
└── public_html/        # Copia publicada que entrega Nginx
```

## 2. DNS y requisitos

Cree un registro DNS `A` para `smarttraining.innovalogic.tech` apuntando a la IP pública del servidor. Instale Node.js 24.15 o superior; se recomienda la versión Node.js 24 LTS indicada abajo. Esta versión es necesaria para la base de usuarios `node:sqlite`. También necesita npm, Nginx y Certbot.

Compruebe la versión antes de instalar dependencias:

```bash
node --version
npm --version
```

### Actualizar Node 18 en Linux x64

Si `node --version` muestra `v18.x`, Vite/Rolldown puede fallar indicando que `node:util` no exporta `styleText`. Node 18 no es compatible con este proyecto.

Como `root`, instale Node 24 LTS desde el binario oficial y valide su suma:

```bash
cd /tmp
NODE_VERSION=v24.18.0
curl -fsSLO "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz"
curl -fsSLO "https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt"
grep " node-${NODE_VERSION}-linux-x64.tar.xz$" SHASUMS256.txt | sha256sum -c -
sudo tar -xJf "node-${NODE_VERSION}-linux-x64.tar.xz" -C /usr/local --strip-components=1
hash -r
/usr/local/bin/node --version
/usr/local/bin/npm --version
```

El resultado debe mostrar Node `v24.18.0`. Estos comandos son para servidores `x86_64`; confirme con `uname -m`. Para `aarch64` debe utilizar el archivo oficial `linux-arm64`.

Después de cambiar la versión de Node, reinstale todas las dependencias. No reutilice módulos instalados con Node 18:

```bash
cd /var/www/smarttraining.innovalogic.tech/app
/usr/local/bin/npm ci
/usr/local/bin/npm ci --prefix frontend
/usr/local/bin/npm ci --prefix backend
/usr/local/bin/npm run build
```

Prepare las carpetas:

```bash
sudo mkdir -p /var/www/smarttraining.innovalogic.tech/app
sudo mkdir -p /var/www/smarttraining.innovalogic.tech/public_html
```

Después de transferir el contenido del proyecto a `app`, la ruta debe contener, por ejemplo:

```text
/var/www/smarttraining.innovalogic.tech/app/package.json
/var/www/smarttraining.innovalogic.tech/app/frontend/package.json
/var/www/smarttraining.innovalogic.tech/app/backend/package.json
/var/www/smarttraining.innovalogic.tech/app/docs/
```

Evite una carpeta duplicada como `app/SmartTraining/package.json`.

## 3. Instalar, compilar y publicar el frontend

Los siguientes comandos se ejecutan en Ubuntu, no en PowerShell de Windows:

```bash
cd /var/www/smarttraining.innovalogic.tech/app
npm ci
npm ci --prefix frontend
npm ci --prefix backend
npm run build
sudo cp -a frontend/dist/. /var/www/smarttraining.innovalogic.tech/public_html/
```

El comando `npm run build` genera:

- `app/frontend/dist`: frontend estático.
- `app/backend/dist`: backend Node compilado.

La copia posterior publica únicamente el frontend en `public_html`. El frontend ya utiliza `/api`, por lo que no requiere `VITE_API_URL` cuando API y web comparten este dominio.

Compruebe qué bundle quedó referenciado por la página publicada:

```bash
grep -o 'assets/index-[^"]*\.js' /var/www/smarttraining.innovalogic.tech/public_html/index.html
```

El nombre contiene un hash y puede cambiar en cada build. No compare el nombre con el generado en otro computador; confirme que `index.html` referencia un archivo existente dentro de `public_html/assets`. Después de publicar, utilice `Ctrl + Shift + R` en Chrome para descartar la versión anterior almacenada en caché.

## 4. Almacenamiento persistente

```bash
sudo useradd --system --home /var/lib/smarttraining --shell /usr/sbin/nologin smarttraining
sudo mkdir -p /var/lib/smarttraining/data
sudo mkdir -p /var/lib/smarttraining/storage/videos
sudo mkdir -p /var/lib/smarttraining/storage/thumbnails
cd /var/www/smarttraining.innovalogic.tech/app
sudo cp backend/data/*.json /var/lib/smarttraining/data/
sudo cp -a backend/storage/videos/. /var/lib/smarttraining/storage/videos/
sudo cp -a backend/storage/thumbnails/. /var/lib/smarttraining/storage/thumbnails/
sudo chown -R smarttraining:smarttraining /var/lib/smarttraining
```

Copie JSON, videos y miniaturas como un conjunto si desea migrar el contenido local existente. En el primer arranque, si `users.sqlite` no existe o está vacío, el backend importa automáticamente las cuentas del antiguo `users.json` y conserva sus identificadores. Desde ese momento `users.sqlite` es la fuente de verdad para usuarios, asignaciones y auditoría. Las tablas nuevas de asignaciones se crean automáticamente al reiniciar una versión actualizada.

No copie un `users.sqlite` local sobre una instalación de producción ni repita la copia de JSON después de que producción tenga información real. La cuenta del servicio debe tener escritura sobre toda la carpeta `data`, porque SQLite crea junto a la base los archivos temporales `users.sqlite-wal` y `users.sqlite-shm`.

No ejecute `npm run seed` en producción salvo que desee crear o restablecer deliberadamente las cuentas conocidas `admin`/`learner` y garantizar el curso corporativo de demostración dentro de `DATA_STORAGE_PATH`. El seed conserva otros registros, pero actualiza el hash de esas dos cuentas con la contraseña pública de demo; para un entorno real deben utilizarse credenciales distintas.

## 5. Variables de producción

```bash
cd /var/www/smarttraining.innovalogic.tech/app
sudo mkdir -p /etc/smarttraining
sudo cp deploy/smarttraining.env.example /etc/smarttraining/smarttraining.env
sudo chmod 600 /etc/smarttraining/smarttraining.env
sudo openssl rand -base64 48
sudo nano /etc/smarttraining/smarttraining.env
```

Reemplace `JWT_SECRET` con el valor aleatorio generado. No publique el archivo real ni reutilice las credenciales de demostración.

Confirme que el archivo mantiene `USER_DATABASE_PATH=/var/lib/smarttraining/data/users.sqlite`. El usuario `smarttraining` debe ser propietario del directorio:

```bash
sudo chown -R smarttraining:smarttraining /var/lib/smarttraining
sudo -u smarttraining test -w /var/lib/smarttraining/data && echo "SQLite: escritura OK"
```

## 6. Servicio de la API

`ExecStart=/usr/local/bin/node dist/src/server.js` es una directiva del archivo `systemd`; **no se ejecuta directamente en Bash**. El servicio la resuelve desde `WorkingDirectory=/var/www/smarttraining.innovalogic.tech/app/backend`.

Antes de instalar el servicio, confirme que el build del backend existe:

```bash
cd /var/www/smarttraining.innovalogic.tech/app
ls -l backend/dist/src/server.js
```

Para una prueba manual opcional desde la raíz `app`, la ruta completa sería:

```bash
/usr/local/bin/node /var/www/smarttraining.innovalogic.tech/app/backend/dist/src/server.js
```

Esta prueba mantiene la terminal ocupada y requiere que las variables de producción estén cargadas. Para operación normal utilice `systemd`:

```bash
cd /var/www/smarttraining.innovalogic.tech/app
sudo cp deploy/smarttraining.service /etc/systemd/system/smarttraining.service
sudo systemctl daemon-reload
sudo systemctl enable --now smarttraining
sudo systemctl status smarttraining
curl http://127.0.0.1:3000/api/health
```

La plantilla utiliza `/usr/local/bin/node`, correspondiente a la instalación oficial indicada en esta guía. Confirme la ruta con `which node` y ajuste `ExecStart` si instaló Node mediante otro método.

## 7. HTTPS y Nginx

Obtenga primero el certificado con Certbot en modo standalone. El puerto 80 debe estar libre durante este paso:

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d smarttraining.innovalogic.tech
sudo systemctl start nginx
```

Después instale la configuración incluida:

```bash
cd /var/www/smarttraining.innovalogic.tech/app
sudo cp deploy/nginx-smarttraining.conf /etc/nginx/sites-available/smarttraining
sudo ln -s /etc/nginx/sites-available/smarttraining /etc/nginx/sites-enabled/smarttraining
sudo nginx -t
sudo systemctl reload nginx
```

Si el enlace ya existe, no vuelva a ejecutar `ln -s`. La ubicación `/api/` conserva HTTP Range para video y permite cargas de hasta 500 MB. La ubicación `/` utiliza `index.html` como fallback para que `/login`, `/learn` y demás rutas funcionen al recargar.

No habilite `nginx-smarttraining.conf` antes de que Certbot haya creado:

```text
/etc/letsencrypt/live/smarttraining.innovalogic.tech/fullchain.pem
/etc/letsencrypt/live/smarttraining.innovalogic.tech/privkey.pem
```

Si el proveedor creó previamente otro vhost para el dominio, no mantenga ambos habilitados. Localice duplicados con:

```bash
ls -la /etc/nginx/sites-enabled/
grep -R "server_name smarttraining.innovalogic.tech" /etc/nginx/sites-enabled/
```

## 8. Comprobación

```bash
curl -I https://smarttraining.innovalogic.tech/
curl https://smarttraining.innovalogic.tech/api/health
sudo systemctl status smarttraining
sudo journalctl -u smarttraining -n 100 --no-pager
```

Compruebe después login, carga, reproducción, HTTP Range, progreso y cierre de sesión desde un teléfono.

### `systemd` muestra `Result: resources`

Este resultado aparece antes de ejecutar Node. Revise primero los cuatro recursos requeridos:

```bash
getent passwd smarttraining
test -x /usr/local/bin/node && /usr/local/bin/node --version
test -f /var/www/smarttraining.innovalogic.tech/app/backend/dist/src/server.js
test -f /etc/smarttraining/smarttraining.env
sudo journalctl -u smarttraining -n 100 --no-pager
```

Si falta el usuario o las carpetas persistentes:

```bash
getent passwd smarttraining >/dev/null || sudo useradd --system --home /var/lib/smarttraining --shell /usr/sbin/nologin smarttraining
sudo mkdir -p /var/lib/smarttraining/data
sudo mkdir -p /var/lib/smarttraining/storage/videos
sudo mkdir -p /var/lib/smarttraining/storage/thumbnails
sudo chown -R smarttraining:smarttraining /var/lib/smarttraining
```

Si falta el archivo de entorno:

```bash
cd /var/www/smarttraining.innovalogic.tech/app
sudo mkdir -p /etc/smarttraining
sudo cp deploy/smarttraining.env.example /etc/smarttraining/smarttraining.env
sudo chmod 600 /etc/smarttraining/smarttraining.env
sudo nano /etc/smarttraining/smarttraining.env
```

Reemplace obligatoriamente el marcador de `JWT_SECRET`. Después:

```bash
sudo systemctl reset-failed smarttraining
sudo systemctl daemon-reload
sudo systemctl restart smarttraining
sudo systemctl status smarttraining --no-pager -l
```

### El navegador muestra `Welcome to nginx!`

Esa página indica que Nginx está usando el sitio predeterminado en lugar del bloque de `smarttraining.innovalogic.tech`.

Confirme primero que el frontend publicado existe:

```bash
ls -l /var/www/smarttraining.innovalogic.tech/public_html/index.html
```

Instale y habilite la configuración del dominio:

```bash
cd /var/www/smarttraining.innovalogic.tech/app
sudo cp deploy/nginx-smarttraining.conf /etc/nginx/sites-available/smarttraining
sudo ln -sfn /etc/nginx/sites-available/smarttraining /etc/nginx/sites-enabled/smarttraining
sudo nginx -t
sudo systemctl reload nginx
```

Verifique que Nginx realmente cargó el dominio:

```bash
sudo nginx -T 2>/dev/null | grep -n "server_name smarttraining.innovalogic.tech"
```

Cuando la configuración del dominio ya pasa `nginx -t`, deshabilite únicamente el enlace del sitio predeterminado y recargue:

```bash
sudo unlink /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

`unlink` solamente retira el enlace habilitado; no elimina la plantilla `/etc/nginx/sites-available/default`.

Si el navegador también indica que HTTPS no es seguro, confirme el certificado:

```bash
sudo certbot certificates
sudo openssl x509 -in /etc/letsencrypt/live/smarttraining.innovalogic.tech/fullchain.pem -noout -subject -issuer -dates
```

Si el certificado no existe o no corresponde al dominio:

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d smarttraining.innovalogic.tech
sudo systemctl start nginx
sudo nginx -t
sudo systemctl reload nginx
```

Después de emitir el certificado, confirme los archivos antes de probar Nginx:

```bash
sudo test -f /etc/letsencrypt/live/smarttraining.innovalogic.tech/fullchain.pem
sudo test -f /etc/letsencrypt/live/smarttraining.innovalogic.tech/privkey.pem
sudo nginx -t
```

Nunca ejecute `systemctl reload nginx` cuando `nginx -t` falla.

Finalmente valide sin ignorar errores TLS:

```bash
curl -I https://smarttraining.innovalogic.tech/
curl https://smarttraining.innovalogic.tech/api/health
```

### La carga de un video se cancela a los pocos segundos

La carga de videos no debe heredar el timeout corto de las llamadas normales. Confirme primero que el código transferido contiene la excepción para cargas largas:

```bash
grep -n "timeout: 0" /var/www/smarttraining.innovalogic.tech/app/frontend/src/api/videos.ts
```

Si aparece `timeout: 0`, reconstruya y publique el frontend desde Ubuntu:

```bash
cd /var/www/smarttraining.innovalogic.tech/app
npm --prefix frontend run build
cp -a frontend/dist/. /var/www/smarttraining.innovalogic.tech/public_html/
```

Copiar únicamente `videos.ts` no actualiza el JavaScript que recibe el navegador. Después de publicar, recargue Chrome con `Ctrl + Shift + R`.

La interfaz admite selección múltiple, pero transfiere los archivos de la cola uno por uno. Esto evita varias cargas simultáneas sobre la misma conexión; cada archivo sigue sujeto individualmente a `MAX_VIDEO_SIZE_MB` y `client_max_body_size`.

La interfaz permite cargas largas y la plantilla de Nginx acepta archivos de hasta 500 MB. Confirme también que el servidor está utilizando la configuración de Nginx y backend publicada:

```bash
sudo nginx -T 2>/dev/null | grep -E "client_max_body_size|proxy_request_buffering"
grep '^MAX_VIDEO_SIZE_MB=' /etc/smarttraining/smarttraining.env
```

La salida esperada incluye `client_max_body_size 500m`, `proxy_request_buffering off` y `MAX_VIDEO_SIZE_MB=500`. Compruebe también espacio, permisos y registros mientras repite la carga:

```bash
df -h /var/lib/smarttraining
sudo -u smarttraining test -w /var/lib/smarttraining/storage/videos && echo "videos: escritura OK"
sudo -u smarttraining test -w /var/lib/smarttraining/storage/thumbnails && echo "miniaturas: escritura OK"
sudo journalctl -u smarttraining -f
```

En otra terminal puede observar los errores de Nginx:

```bash
sudo tail -f /var/log/nginx/error.log
```

Si la petición vuelve a fallar, capture los registros inmediatamente:

```bash
sudo journalctl -u smarttraining --since "10 minutes ago" --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

### El video se carga pero queda con estado `Error`

Este estado indica que la transferencia terminó, pero FFprobe o FFmpeg no pudo analizar el archivo, optimizar el MP4 o generar su miniatura. Instale las herramientas nativas de Ubuntu y configure rutas explícitas:

```bash
sudo apt update
sudo apt install -y ffmpeg
command -v ffmpeg
command -v ffprobe
sudo -u smarttraining /usr/bin/ffmpeg -version
sudo -u smarttraining /usr/bin/ffprobe -version
```

Edite `/etc/smarttraining/smarttraining.env` y establezca:

```dotenv
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
```

Reinicie el backend y confirme que tomó la configuración:

```bash
sudo systemctl restart smarttraining
sudo systemctl status smarttraining --no-pager -l
sudo journalctl -u smarttraining -n 100 --no-pager
```

Los videos que ya muestran `Error` no se reprocesan automáticamente. Elimínelos desde el panel y vuelva a cargarlos después de corregir FFmpeg. Las versiones nuevas del backend registran `operation: "video-processing"` y el motivo del fallo en el journal.

## 9. Actualizaciones

Antes de respaldar o transferir archivos, complete las trece puertas de `docs/TESTING.md` usando `test/pre-deployment-evidence-template.md`. Ejecute como mínimo:

```bash
cd /var/www/smarttraining.innovalogic.tech/app
npx playwright install --with-deps chromium
npm run predeploy:core
```

Este comando incluye la base E2E automatizada, pero no sustituye aceptación, mutation testing, fuzzing dedicado, recorridos multimedia E2E completos, resiliencia, rendimiento ni compatibilidad manual. Si alguna puerta queda `BLOCKED`, no continúe con el despliegue.

Antes de actualizar, haga backup consistente de `/var/lib/smarttraining`. Detener la API garantiza que la base, su WAL, los JSON y los medios correspondan al mismo instante:

```bash
sudo systemctl stop smarttraining
sudo tar -C /var/lib -czf "/root/smarttraining-backup-$(date +%Y%m%d-%H%M%S).tar.gz" smarttraining
sudo systemctl start smarttraining
```

Desde Windows, transfiera los archivos modificados a sus rutas equivalentes dentro de `/var/www/smarttraining.innovalogic.tech/app`. Después ejecute en Ubuntu:

```bash
cd /var/www/smarttraining.innovalogic.tech/app
npm ci --prefix frontend
npm ci --prefix backend
npm run build
sudo cp -a frontend/dist/. /var/www/smarttraining.innovalogic.tech/public_html/
sudo systemctl restart smarttraining
sudo nginx -t && sudo systemctl reload nginx
```

No sobrescriba `/var/lib/smarttraining` durante una actualización de código.

Al desplegar por primera vez esta versión desde una instalación anterior basada en `users.json`, conserve ese archivo y asegúrese de que aún no exista `users.sqlite`; el primer inicio realiza la importación. Compruebe después el módulo **Usuarios** y respalde la carpeta persistente completa. No ejecute `npm run seed` para efectuar la migración.

### Verificación posterior de la versión actual

Además del health check, valide con un registro de prueba el flujo administrativo más reciente:

1. Como participante, reproduzca parcialmente un video.
2. Como administrador, abra **Progreso** y pulse **Reiniciar** en esa fila.
3. Confirme que desaparece únicamente ese registro.
4. Compruebe en **Usuarios → Auditoría** el evento `Progreso de video reiniciado`.
5. Ingrese nuevamente como participante y verifique que ese video comienza desde cero.

Esta prueba modifica solo el progreso del usuario seleccionado; no elimina el video. No use una cuenta real si necesita conservar exactamente su avance.
